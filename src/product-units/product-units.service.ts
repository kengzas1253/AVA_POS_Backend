import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { ProductStock } from '../stocks/entities/product-stock.entity';
import { StockMovement } from '../stocks/entities/stock-movement.entity';
import { Unit } from '../units/entities/unit.entity';
import { CreateProductUnitDto } from './dto/create-product-unit.dto';
import { UpdateProductUnitDto } from './dto/update-product-unit.dto';
import { ProductUnit } from './entities/product-unit.entity';

@Injectable()
export class ProductUnitsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ProductUnit)
    private readonly productUnitRepository: Repository<ProductUnit>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Unit)
    private readonly unitRepository: Repository<Unit>,
    @InjectRepository(ProductStock)
    private readonly productStockRepository: Repository<ProductStock>,
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
  ) {}

  async create(productId: string, dto: CreateProductUnitDto) {
    this.validateBaseConversion(dto.isBase, dto.conversionToBase);

    return this.dataSource.transaction(async (manager) => {
      await this.ensureProductAndUnit(productId, dto.unitId.toString(), manager);

      if (dto.isBase) {
        await manager.update(ProductUnit, { product_id: productId }, { is_base: false });
      }

      const productUnit = manager.create(ProductUnit, {
        product_id: productId,
        unit_id: dto.unitId.toString(),
        barcode: dto.barcode,
        conversion_to_base: dto.conversionToBase,
        sale_price: dto.salePrice,
        cost_price: dto.costPrice,
        is_base: dto.isBase ?? false,
        is_active: dto.isActive ?? true,
        sort_order: dto.sortOrder ?? 0,
      });

      try {
        return this.mapProductUnit(await manager.save(ProductUnit, productUnit));
      } catch (error) {
        this.handleDatabaseError(error);
      }
    });
  }

  async findByProduct(productId: string) {
    const product = await this.productRepository.findOne({ where: { id: productId } });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const items = await this.productUnitRepository.find({
      where: { product_id: productId },
      relations: { unit: true },
      order: { sort_order: 'ASC', id: 'ASC' },
    });
    const baseUnit = items.find((item) => item.is_base);

    return {
      productId: Number(product.id),
      productName: product.product_name,
      baseUnit: baseUnit ? this.mapBaseUnit(baseUnit) : null,
      items: items.map((item) => this.mapProductUnitWithUnit(item)),
    };
  }

  async findByBarcode(barcode: string) {
    const productUnit = await this.productUnitRepository.findOne({
      where: { barcode, is_active: true },
      relations: { product: true, unit: true },
    });

    if (!productUnit) {
      throw new NotFoundException('Product unit not found');
    }

    const stock = await this.productStockRepository.findOne({
      where: { product_id: productUnit.product_id, store_id: '1' },
    });
    const baseQty = Number(stock?.stock_base_qty ?? 0);

    return {
      productId: Number(productUnit.product_id),
      productUnitId: Number(productUnit.id),
      sku: productUnit.product.sku,
      productName: productUnit.product.product_name,
      barcode: productUnit.barcode,
      unit: {
        id: Number(productUnit.unit_id),
        code: productUnit.unit.unit_code,
        nameTh: productUnit.unit.unit_name_th,
      },
      conversionToBase: Number(productUnit.conversion_to_base),
      salePrice: Number(productUnit.sale_price),
      costPrice: Number(productUnit.cost_price),
      stock: {
        baseQty,
        availableInSelectedUnit: this.roundQty(baseQty / Number(productUnit.conversion_to_base)),
      },
    };
  }

  async update(productId: string, productUnitId: string, dto: UpdateProductUnitDto) {
    if (dto.isBase !== undefined || dto.conversionToBase !== undefined) {
      this.validateBaseConversion(dto.isBase, dto.conversionToBase);
    }

    return this.dataSource.transaction(async (manager) => {
      const productUnit = await manager.findOne(ProductUnit, {
        where: { id: productUnitId, product_id: productId },
      });

      if (!productUnit) {
        throw new NotFoundException('Product unit not found');
      }

      if (dto.unitId) {
        await this.ensureUnit(dto.unitId.toString(), manager);
        productUnit.unit_id = dto.unitId.toString();
      }

      if (dto.isBase) {
        productUnit.conversion_to_base = 1;
        await manager.update(ProductUnit, { product_id: productId }, { is_base: false });
      } else if (dto.conversionToBase !== undefined) {
        productUnit.conversion_to_base = dto.conversionToBase;
      }

      if (dto.barcode !== undefined) productUnit.barcode = dto.barcode;
      if (dto.salePrice !== undefined) productUnit.sale_price = dto.salePrice;
      if (dto.costPrice !== undefined) productUnit.cost_price = dto.costPrice;
      if (dto.isBase !== undefined) productUnit.is_base = dto.isBase;
      if (dto.isActive !== undefined) productUnit.is_active = dto.isActive;
      if (dto.sortOrder !== undefined) productUnit.sort_order = dto.sortOrder;

      try {
        return this.mapProductUnit(await manager.save(ProductUnit, productUnit));
      } catch (error) {
        this.handleDatabaseError(error);
      }
    });
  }

  async remove(productId: string, productUnitId: string) {
    const productUnit = await this.productUnitRepository.findOne({
      where: { id: productUnitId, product_id: productId },
    });

    if (!productUnit) {
      throw new NotFoundException('Product unit not found');
    }

    const historyCount = await this.stockMovementRepository.count({
      where: { product_unit_id: productUnitId },
    });

    if (historyCount > 0) {
      throw new ConflictException(
        'This product unit has stock movement history. Set isActive to false instead.',
      );
    }

    await this.productUnitRepository.remove(productUnit);

    return { status: 'ok', message: 'Product unit deleted successfully' };
  }

  async setBase(productId: string, productUnitId: string) {
    return this.dataSource.transaction(async (manager) => {
      const productUnit = await manager.findOne(ProductUnit, {
        where: { id: productUnitId, product_id: productId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!productUnit) {
        throw new NotFoundException('Product unit not found');
      }

      if (Number(productUnit.conversion_to_base) !== 1) {
        throw new ConflictException('Base product unit conversionToBase must be 1');
      }

      await manager.update(ProductUnit, { product_id: productId }, { is_base: false });
      productUnit.is_base = true;
      productUnit.is_active = true;

      return this.mapProductUnit(await manager.save(ProductUnit, productUnit));
    });
  }

  private async ensureProductAndUnit(productId: string, unitId: string, manager = this.dataSource.manager) {
    const [product, unit] = await Promise.all([
      manager.findOne(Product, { where: { id: productId } }),
      manager.findOne(Unit, { where: { id: unitId } }),
    ]);

    if (!product) throw new NotFoundException('Product not found');
    if (!unit) throw new NotFoundException('Unit not found');
  }

  private async ensureUnit(unitId: string, manager = this.dataSource.manager) {
    const unit = await manager.findOne(Unit, { where: { id: unitId } });

    if (!unit) throw new NotFoundException('Unit not found');
  }

  private validateBaseConversion(isBase?: boolean, conversionToBase?: number) {
    if (isBase && conversionToBase !== undefined && conversionToBase !== 1) {
      throw new BadRequestException('Base product unit conversionToBase must be 1');
    }
  }

  private mapBaseUnit(productUnit: ProductUnit) {
    return {
      productUnitId: Number(productUnit.id),
      unitId: Number(productUnit.unit_id),
      unitCode: productUnit.unit.unit_code,
      unitNameTh: productUnit.unit.unit_name_th,
      conversionToBase: Number(productUnit.conversion_to_base),
    };
  }

  private mapProductUnitWithUnit(productUnit: ProductUnit) {
    return {
      ...this.mapProductUnit(productUnit),
      unitCode: productUnit.unit.unit_code,
      unitNameTh: productUnit.unit.unit_name_th,
    };
  }

  private mapProductUnit(productUnit: ProductUnit) {
    return {
      id: Number(productUnit.id),
      productId: Number(productUnit.product_id),
      unitId: Number(productUnit.unit_id),
      barcode: productUnit.barcode,
      conversionToBase: Number(productUnit.conversion_to_base),
      salePrice: Number(productUnit.sale_price),
      costPrice: Number(productUnit.cost_price),
      isBase: productUnit.is_base,
      isActive: productUnit.is_active,
      sortOrder: productUnit.sort_order,
    };
  }

  private roundQty(value: number) {
    return Math.round(value * 10000) / 10000;
  }

  private handleDatabaseError(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as { code?: string; constraint?: string };

      if (driverError.code === '23505') {
        throw new ConflictException(
          driverError.constraint?.includes('barcode')
            ? 'Barcode already exists'
            : 'Product unit already exists',
        );
      }
    }

    throw error;
  }
}
