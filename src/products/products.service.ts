import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, QueryFailedError, Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { FindProductsQueryDto } from './dto/find-products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductPriceMode } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    const productInput = this.normalizeProductInput(createProductDto);
    const product = this.productRepository.create({
      ...productInput,
      category_id: this.numberToString(productInput.category_id),
      cost_price: this.numberToString(productInput.cost_price),
      sale_price: this.numberToString(productInput.sale_price),
      stock_qty: this.numberToString(productInput.stock_qty),
      min_stock_qty: this.numberToString(productInput.min_stock_qty),
    });

    try {
      const savedProduct = await this.productRepository.save(product);
      const productWithCategory = await this.productRepository.findOne({
        where: { id: savedProduct.id },
        relations: { category: true },
      });

      return {
        status: 'ok',
        message: 'Product created successfully',
        data: productWithCategory,
      };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async findAll({
    page = 1,
    limit = 50,
    search,
    category_id,
  }: FindProductsQueryDto) {
    const pageNumber = Number(page) || 1;
    const limitNumber = Math.min(Number(limit) || 50, 100);
    const skip = (pageNumber - 1) * limitNumber;
    const containsSearch = search
      ? `%${this.escapeLikePattern(search)}%`
      : undefined;

    const query = this.productRepository
      .createQueryBuilder('product')
      .select([
        'product.id',
        'product.sku',
        'product.barcode',
        'product.product_name',
        'product.category_id',
        'product.unit_code',
        'product.price_mode',
        'product.sale_price',
        'product.stock_qty',
        'product.track_stock',
        'product.image_url',
        'product.status',
      ]);

    if (category_id) {
      query.andWhere('product.category_id = :categoryId', {
        categoryId: category_id.toString(),
      });
    }

    if (search && containsSearch) {
      query
        .andWhere(
          new Brackets((qb) => {
            qb.where(`product.barcode ILIKE :containsSearch ESCAPE '\\'`)
              .orWhere(`product.sku ILIKE :containsSearch ESCAPE '\\'`)
              .orWhere(
                `product.product_name ILIKE :containsSearch ESCAPE '\\'`,
              );
          }),
        )
        .orderBy(
          `CASE
            WHEN product.barcode = :search THEN 0
            WHEN LOWER(product.sku) = LOWER(:search) THEN 1
            WHEN LOWER(product.product_name) = LOWER(:search) THEN 2
            WHEN product.barcode ILIKE :containsSearch ESCAPE '\\' THEN 3
            WHEN product.sku ILIKE :containsSearch ESCAPE '\\' THEN 4
            ELSE 5
          END`,
          'ASC',
        )
        .setParameters({ search, containsSearch });
    } else {
      query.orderBy('product.id', 'ASC');
    }

    query
      .addOrderBy('product.product_name', 'ASC')
      .addOrderBy('product.id', 'ASC')
      .skip(skip)
      .take(limitNumber);

    const [products, total] = await query.getManyAndCount();
    const productUnitSummaries = await this.findProductUnitSummaries(
      products.map((product) => product.id),
    );
    const productIdsWithPromotion = await this.findProductIdsWithActivePromotion(
      products.map((product) => product.id),
    );
    const totalPages = Math.ceil(total / limitNumber);

    return {
      data: products.map((product) => ({
        ...product,
        ...(productUnitSummaries.get(product.id) ?? {}),
        has_promotion: productIdsWithPromotion.has(product.id),
      })),
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages,
        hasMore: pageNumber < totalPages,
      },
    };
  }

  async findOne(id: string) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: { category: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const productInput = this.normalizeProductInput(updateProductDto);
    const product = await this.productRepository.preload({
      id,
      ...productInput,
      category_id: this.numberToString(productInput.category_id),
      cost_price: this.numberToString(productInput.cost_price),
      sale_price: this.numberToString(productInput.sale_price),
      stock_qty: this.numberToString(productInput.stock_qty),
      min_stock_qty: this.numberToString(productInput.min_stock_qty),
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    try {
      await this.productRepository.save(product);
      const updatedProduct = await this.findOne(id);

      return {
        status: 'ok',
        message: 'Product updated successfully',
        data: updatedProduct,
      };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async remove(id: string) {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    try {
      await this.productRepository.remove(product);

      return {
        status: 'ok',
        message: 'Product deleted successfully',
        data: {
          id,
        },
      };
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as { code?: string };

        if (driverError.code === '23503') {
          throw new ConflictException(
            'Product cannot be deleted because it is being used',
          );
        }
      }

      throw error;
    }
  }

  private handleDatabaseError(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as {
        code?: string;
        constraint?: string;
      };

      if (driverError.code === '23505') {
        throw new ConflictException(
          driverError.constraint?.includes('barcode')
            ? 'Barcode already exists'
            : 'SKU already exists',
        );
      }

      if (driverError.code === '23503') {
        throw new BadRequestException('Category does not exist');
      }
    }

    throw error;
  }

  private normalizeProductInput<T extends CreateProductDto | UpdateProductDto>(
    productDto: T,
  ): T {
    if (productDto.price_mode !== ProductPriceMode.SERVICE_PRICE) {
      return productDto;
    }

    return {
      ...productDto,
      stock_qty: 0,
      min_stock_qty: 0,
      track_stock: false,
    };
  }

  private numberToString(value?: number | null) {
    return value === undefined ? undefined : value?.toString();
  }

  private escapeLikePattern(value: string) {
    return value.replace(/[\\%_]/g, '\\$&');
  }

  private async findProductIdsWithActivePromotion(productIds: string[]) {
    if (productIds.length === 0) {
      return new Set<string>();
    }

    let rows: { product_id: string }[];

    try {
      rows = await this.productRepository.query(
        `
          SELECT DISTINCT pp.product_id
          FROM promotion_products pp
          INNER JOIN promotions p ON p.id = pp.promotion_id
          WHERE pp.product_id = ANY($1::bigint[])
            AND p.status = 'ACTIVE'
            AND (p.start_date IS NULL OR p.start_date <= NOW())
            AND (p.end_date IS NULL OR p.end_date >= NOW())
        `,
        [productIds],
      );
    } catch (error) {
      if (this.isUndefinedTableError(error)) {
        return new Set<string>();
      }

      throw error;
    }

    return new Set<string>(rows.map((row) => row.product_id));
  }

  private async findProductUnitSummaries(productIds: string[]) {
    if (productIds.length === 0) {
      return new Map<string, ProductUnitSummary>();
    }

    let rows: ProductUnitSummaryRow[];

    try {
      rows = await this.productRepository.query(
        `
          SELECT
            p.id AS product_id,
            ps.stock_base_qty,
            COUNT(pu.id)::int AS unit_count,
            base_pu.id AS base_product_unit_id,
            base_pu.unit_id AS base_unit_id,
            base_pu.barcode AS base_barcode,
            base_pu.sale_price AS base_sale_price,
            u.unit_code AS base_unit_code,
            u.unit_name_th AS base_unit_name_th
          FROM products p
          LEFT JOIN product_stocks ps
            ON ps.product_id = p.id
            AND ps.store_id = 1
          LEFT JOIN product_units pu
            ON pu.product_id = p.id
          LEFT JOIN product_units base_pu
            ON base_pu.product_id = p.id
            AND base_pu.is_base = true
          LEFT JOIN units u
            ON u.id = base_pu.unit_id
          WHERE p.id = ANY($1::bigint[])
          GROUP BY
            p.id,
            ps.stock_base_qty,
            base_pu.id,
            base_pu.unit_id,
            base_pu.barcode,
            base_pu.sale_price,
            u.unit_code,
            u.unit_name_th
        `,
        [productIds],
      );
    } catch (error) {
      if (this.isUndefinedTableError(error)) {
        return new Map<string, ProductUnitSummary>();
      }

      throw error;
    }

    return new Map<string, ProductUnitSummary>(
      rows.map(
        (row) => [
          row.product_id,
          {
            baseUnit: row.base_product_unit_id
              ? {
                  productUnitId: Number(row.base_product_unit_id),
                  unitId: Number(row.base_unit_id),
                  unitCode: row.base_unit_code,
                  unitNameTh: row.base_unit_name_th,
                  barcode: row.base_barcode,
                  salePrice: Number(row.base_sale_price ?? 0),
                }
              : null,
            stockBaseQty: Number(row.stock_base_qty ?? 0),
            unitCount: row.unit_count,
          },
        ],
      ),
    );
  }

  private isUndefinedTableError(error: unknown) {
    return (
      error instanceof QueryFailedError &&
      (error.driverError as { code?: string }).code === '42P01'
    );
  }
}

type ProductUnitSummaryRow = {
  product_id: string;
  stock_base_qty: string | null;
  unit_count: number;
  base_product_unit_id: string | null;
  base_unit_id: string | null;
  base_barcode: string | null;
  base_sale_price: string | null;
  base_unit_code: string | null;
  base_unit_name_th: string | null;
};

type ProductUnitSummary = {
  baseUnit: {
    productUnitId: number;
    unitId: number;
    unitCode: string | null;
    unitNameTh: string | null;
    barcode: string | null;
    salePrice: number;
  } | null;
  stockBaseQty: number;
  unitCount: number;
};
