import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductUnit } from '../product-units/entities/product-unit.entity';
import { Product, ProductPriceMode, ProductStatus } from '../products/entities/product.entity';
import { PromotionsService } from '../promotions/promotions.service';
import { ProductStock } from '../stocks/entities/product-stock.entity';
import { CalculatePromotionsDto } from './dto/calculate-promotions.dto';
import { ScanProductDto } from './dto/scan-product.dto';

@Injectable()
export class PosService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductUnit)
    private readonly productUnitRepository: Repository<ProductUnit>,
    @InjectRepository(ProductStock)
    private readonly productStockRepository: Repository<ProductStock>,
    private readonly promotionsService: PromotionsService,
  ) {}

  async scanProduct({ barcode }: ScanProductDto) {
    const productUnit = await this.productUnitRepository.findOne({
      where: { barcode, is_active: true },
      relations: { product: true, unit: true },
    });

    if (productUnit && productUnit.product.status === ProductStatus.ACTIVE) {
      const stock = await this.productStockRepository.findOne({
        where: { product_id: productUnit.product_id, store_id: '1' },
      });

      return {
        productId: Number(productUnit.product_id),
        productUnitId: Number(productUnit.id),
        sku: productUnit.product.sku,
        productName: productUnit.product.product_name,
        barcode: productUnit.barcode,
        unitId: Number(productUnit.unit_id),
        unitCode: productUnit.unit.unit_code,
        unitNameTh: productUnit.unit.unit_name_th,
        conversionToBase: Number(productUnit.conversion_to_base),
        salePrice: Number(productUnit.sale_price),
        costPrice: Number(productUnit.cost_price),
        stockBaseQty: Number(stock?.stock_base_qty ?? 0),
      };
    }

    const product = await this.productRepository.findOne({
      where: {
        barcode,
        status: ProductStatus.ACTIVE,
      },
    });

    if (!product) {
      return {
        success: false,
        code: 'PRODUCT_NOT_FOUND',
        message: `Barcode ${barcode} Not registered in the system.`,
      };
    }

    const id = Number(product.id);
    const hasPromotion = await this.hasActivePromotion(product.id);

    switch (product.price_mode) {
      case ProductPriceMode.WEIGHT_PRICE:
        return {
          success: true,
          code: 'WEIGHT_REQUIRED',
          product: {
            id,
            barcode: product.barcode,
            name: product.product_name,
            product_type: 'WEIGHT',
            unit: product.unit_code,
            price_per_unit: Number(product.sale_price),
            has_promotion: hasPromotion,
          },
        };

      case ProductPriceMode.OPEN_PRICE:
        return {
          success: true,
          code: 'PRICE_REQUIRED',
          product: {
            id,
            barcode: product.barcode,
            name: product.product_name,
            product_type: ProductPriceMode.OPEN_PRICE,
            unit: product.unit_code,
            has_promotion: hasPromotion,
          },
        };

      case ProductPriceMode.SERVICE_PRICE:
        return {
          success: true,
          code: 'SERVICE_AMOUNT_REQUIRED',
          product: {
            id,
            barcode: product.barcode,
            name: product.product_name,
            product_type: ProductPriceMode.SERVICE_PRICE,
            unit: product.unit_code,
            default_price: Number(product.sale_price),
            has_promotion: hasPromotion,
          },
        };

      case ProductPriceMode.FIXED_PRICE:
      default:
        return {
          success: true,
          product: {
            id,
            name: product.product_name,
            product_type: ProductPriceMode.FIXED_PRICE,
            sale_price: Number(product.sale_price),
            stock_qty: Number(product.stock_qty),
            has_promotion: hasPromotion,
          },
        };
    }
  }

  async calculatePromotions({ items }: CalculatePromotionsDto) {
    return this.promotionsService.calculate(items);
  }

  async searchProducts(keyword: string) {
    const containsKeyword = `%${this.escapeLikePattern(keyword)}%`;

    const products = await this.productRepository
      .createQueryBuilder('product')
      .where('product.status = :status', { status: ProductStatus.ACTIVE })
      .andWhere(
        `(
          product.barcode ILIKE :containsKeyword ESCAPE '\\'
          OR product.sku ILIKE :containsKeyword ESCAPE '\\'
          OR product.product_name ILIKE :containsKeyword ESCAPE '\\'
        )`,
        { containsKeyword },
      )
      .orderBy(
        `CASE
          WHEN product.barcode = :keyword THEN 0
          WHEN LOWER(product.sku) = LOWER(:keyword) THEN 1
          WHEN LOWER(product.product_name) = LOWER(:keyword) THEN 2
          ELSE 3
        END`,
        'ASC',
      )
      .addOrderBy('product.product_name', 'ASC')
      .addOrderBy('product.id', 'ASC')
      .setParameter('keyword', keyword)
      .getMany();

    if (products.length === 0) {
      return {
        status: 'not_found',
        message: 'No products found.',
      };
    }

    if (products.length === 1) {
      return this.buildSingleProductResponse(products[0]);
    }

    return {
      status: 'success',
      keyword,
      total: products.length,
      data: products.map((product) => this.mapSearchResult(product)),
    };
  }

  private buildSingleProductResponse(product: Product) {
    if (product.price_mode === ProductPriceMode.WEIGHT_PRICE) {
      return {
        status: 'success',
        action: 'WEIGHT_REQUIRED',
        data: {
          product_id: Number(product.id),
          barcode: product.barcode,
          name: product.product_name,
          product_type: 'WEIGHT',
          price_mode: product.price_mode,
          unit: product.unit_code,
          price_per_unit: Number(product.sale_price),
        },
      };
    }

    if (product.price_mode === ProductPriceMode.OPEN_PRICE) {
      return {
        status: 'success',
        action: 'OPEN_PRICE_REQUIRED',
        data: {
          product_id: Number(product.id),
          name: product.product_name,
          price_mode: product.price_mode,
          default_price: Number(product.sale_price),
        },
      };
    }

    if (product.price_mode === ProductPriceMode.SERVICE_PRICE) {
      return {
        status: 'success',
        action: 'SERVICE_AMOUNT_REQUIRED',
        data: {
          product_id: Number(product.id),
          name: product.product_name,
          price_mode: product.price_mode,
          default_price: Number(product.sale_price),
        },
      };
    }

    return {
      status: 'success',
      total: 1,
      auto_select: true,
      data: [this.mapSearchResult(product, false)],
    };
  }

  private mapSearchResult(product: Product, includeImage = true) {
    return {
      product_id: Number(product.id),
      barcode: product.barcode,
      sku: product.sku,
      name: product.product_name,
      product_type:
        product.price_mode === ProductPriceMode.WEIGHT_PRICE
          ? 'WEIGHT'
          : product.price_mode === ProductPriceMode.SERVICE_PRICE
            ? 'SERVICE'
          : 'NORMAL',
      price_mode: product.price_mode,
      price: Number(product.sale_price),
      track_stock: product.track_stock,
      stock_qty: Number(product.stock_qty),
      ...(includeImage ? { image_url: product.image_url } : {}),
    };
  }

  private async hasActivePromotion(productId: string) {
    const result = await this.productRepository.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM promotion_products pp
          INNER JOIN promotions p ON p.id = pp.promotion_id
          WHERE pp.product_id = $1
            AND p.status = 'ACTIVE'
            AND (p.start_date IS NULL OR p.start_date <= NOW())
            AND (p.end_date IS NULL OR p.end_date >= NOW())
        ) AS has_promotion
      `,
      [productId],
    );

    return Boolean(result?.[0]?.has_promotion);
  }

  private escapeLikePattern(value: string) {
    return value.replace(/[\\%_]/g, '\\$&');
  }
}
