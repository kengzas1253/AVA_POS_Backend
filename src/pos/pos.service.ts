import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ProductPriceMode, ProductStatus } from '../products/entities/product.entity';
import { ScanProductDto } from './dto/scan-product.dto';

@Injectable()
export class PosService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async scanProduct({ barcode }: ScanProductDto) {
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
          },
        };
    }
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
          : 'NORMAL',
      price_mode: product.price_mode,
      price: Number(product.sale_price),
      track_stock: product.track_stock,
      stock_qty: Number(product.stock_qty),
      ...(includeImage ? { image_url: product.image_url } : {}),
    };
  }

  private escapeLikePattern(value: string) {
    return value.replace(/[\\%_]/g, '\\$&');
  }
}
