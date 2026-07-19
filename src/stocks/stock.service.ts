import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, EntityManager, Repository } from 'typeorm';
import { ProductUnit } from '../product-units/entities/product-unit.entity';
import { Product } from '../products/entities/product.entity';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import {
  StockMovementQueryDto,
  StockQueryDto,
} from './dto/stock-query.dto';
import { ProductStock } from './entities/product-stock.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { StockMovementType } from './entities/stock-movement-type.enum';

type MovementInput = Omit<CreateStockMovementDto, 'inputQty' | 'conversionToBase'> & {
  productUnitId?: number;
  inputQty: number;
  conversionToBase: number;
  qtyChangeBase: number;
  movementType: StockMovementType;
  createdBy?: string;
  reversedMovementId?: string;
};

@Injectable()
export class StockService {
  private readonly maxLimit = 100;

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ProductStock)
    private readonly productStockRepository: Repository<ProductStock>,
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
    @InjectRepository(ProductUnit)
    private readonly productUnitRepository: Repository<ProductUnit>,
  ) {}

  async increaseStock(dto: CreateStockMovementDto, createdBy?: string) {
    const inputQty = this.requirePositiveNumber(dto.inputQty ?? dto.qty, 'qty');
    const productUnit = dto.productUnitId
      ? await this.getActiveProductUnit(dto.productId.toString(), dto.productUnitId.toString())
      : null;
    const conversionToBase = productUnit
      ? Number(productUnit.conversion_to_base)
      : this.requirePositiveNumber(dto.conversionToBase ?? 1, 'conversionToBase');

    return this.applyMovement({
      ...dto,
      unitId: productUnit ? Number(productUnit.unit_id) : dto.unitId,
      productUnitId: productUnit ? Number(productUnit.id) : dto.productUnitId,
      inputQty,
      conversionToBase,
      movementType: dto.movementType ?? StockMovementType.PURCHASE_IN,
      unitPrice: dto.unitPrice ?? (productUnit ? Number(productUnit.sale_price) : undefined),
      createdBy,
      qtyChangeBase: inputQty * conversionToBase,
    });
  }

  async decreaseStock(dto: CreateStockMovementDto, createdBy?: string) {
    const inputQty = this.requirePositiveNumber(dto.inputQty ?? dto.qty, 'qty');
    const productUnit = dto.productUnitId
      ? await this.getActiveProductUnit(dto.productId.toString(), dto.productUnitId.toString())
      : null;
    const conversionToBase = productUnit
      ? Number(productUnit.conversion_to_base)
      : this.requirePositiveNumber(dto.conversionToBase ?? 1, 'conversionToBase');

    return this.applyMovement({
      ...dto,
      unitId: productUnit ? Number(productUnit.unit_id) : dto.unitId,
      productUnitId: productUnit ? Number(productUnit.id) : dto.productUnitId,
      inputQty,
      conversionToBase,
      movementType: dto.movementType ?? StockMovementType.SALE_OUT,
      unitPrice: dto.unitPrice ?? (productUnit ? Number(productUnit.sale_price) : undefined),
      createdBy,
      qtyChangeBase: -inputQty * conversionToBase,
    });
  }

  async adjustStock(dto: AdjustStockDto, createdBy?: string) {
    return this.dataSource.transaction(async (manager) => {
      const stock = await this.findOrCreateLockedStock(
        manager,
        dto.productId.toString(),
        (dto.storeId ?? 1).toString(),
      );
      const balanceBefore = Number(stock.stock_base_qty);
      const balanceAfter = this.requireNonNegativeNumber(
        dto.stockBaseQty,
        'stockBaseQty',
      );
      const qtyChangeBase = balanceAfter - balanceBefore;

      if (qtyChangeBase === 0) {
        throw new BadRequestException('Stock adjustment has no quantity change');
      }

      return this.saveMovementAndStock(manager, stock, {
        ...dto,
        inputQty: Math.abs(qtyChangeBase),
        conversionToBase: 1,
        movementType:
          qtyChangeBase > 0
            ? StockMovementType.ADJUSTMENT_IN
            : StockMovementType.ADJUSTMENT_OUT,
        createdBy,
        qtyChangeBase,
      });
    });
  }

  setOpeningStock(dto: AdjustStockDto, createdBy?: string) {
    return this.dataSource.transaction(async (manager) => {
      const stock = await this.findOrCreateLockedStock(
        manager,
        dto.productId.toString(),
        (dto.storeId ?? 1).toString(),
      );
      const balanceBefore = Number(stock.stock_base_qty);
      const balanceAfter = this.requireNonNegativeNumber(
        dto.stockBaseQty,
        'stockBaseQty',
      );
      const qtyChangeBase = balanceAfter - balanceBefore;

      if (qtyChangeBase === 0) {
        throw new BadRequestException('Opening stock has no quantity change');
      }

      return this.saveMovementAndStock(manager, stock, {
        ...dto,
        inputQty: Math.abs(qtyChangeBase),
        conversionToBase: 1,
        movementType: StockMovementType.OPENING_STOCK,
        createdBy,
        qtyChangeBase,
      });
    });
  }

  async reverseMovement(id: string, note?: string, createdBy?: string) {
    return this.dataSource.transaction(async (manager) => {
      const original = await manager.findOne(StockMovement, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!original) {
        throw new NotFoundException('Stock movement not found');
      }

      const existingReverse = await manager.findOne(StockMovement, {
        where: { reversed_movement_id: id },
      });

      if (existingReverse) {
        throw new ConflictException('Stock movement has already been reversed');
      }

      const stock = await this.findOrCreateLockedStock(
        manager,
        original.product_id,
        original.store_id,
      );

      return this.saveMovementAndStock(manager, stock, {
        productId: Number(original.product_id),
        unitId: original.unit_id ? Number(original.unit_id) : undefined,
        storeId: Number(original.store_id),
        movementType: StockMovementType.REVERSAL,
        inputQty: Math.abs(Number(original.qty_change_base)),
        conversionToBase: 1,
        referenceType: original.reference_type ?? undefined,
        referenceId: original.reference_id ?? undefined,
        reasonCode: 'REVERSAL',
        note: note ?? `Reverse movement ${id}`,
        deviceId: original.device_id ?? undefined,
        createdBy,
        qtyChangeBase: -Number(original.qty_change_base),
        reversedMovementId: id,
      });
    });
  }

  async getCurrentStock(productId: string, storeId = 1) {
    const stock = await this.productStockRepository.findOne({
      where: { product_id: productId, store_id: storeId.toString() },
      relations: { product: true },
    });

    if (!stock) {
      throw new NotFoundException('Product stock not found');
    }

    return this.mapStockResponse(stock);
  }

  async getStockByUnits(productId: string, storeId = 1) {
    const stock = await this.productStockRepository.findOne({
      where: { product_id: productId, store_id: storeId.toString() },
      relations: { product: true },
    });

    if (!stock) {
      throw new NotFoundException('Product stock not found');
    }

    const units = await this.productUnitRepository.find({
      where: { product_id: productId, is_active: true },
      relations: { unit: true },
      order: { sort_order: 'ASC', id: 'ASC' },
    });
    const stockBaseQty = Number(stock.stock_base_qty);
    const baseUnit = units.find((item) => item.is_base);

    return {
      productId: Number(productId),
      productName: stock.product?.product_name,
      stockBaseQty,
      baseUnit: baseUnit
        ? {
            unitCode: baseUnit.unit.unit_code,
            unitNameTh: baseUnit.unit.unit_name_th,
          }
        : null,
      units: units.map((item) => {
        const conversionToBase = Number(item.conversion_to_base);

        return {
          productUnitId: Number(item.id),
          unitCode: item.unit.unit_code,
          unitNameTh: item.unit.unit_name_th,
          conversionToBase,
          availableQty: this.roundQty(stockBaseQty / conversionToBase),
          fullUnitQty: Math.floor(stockBaseQty / conversionToBase),
        };
      }),
    };
  }

  async getStocks(query: StockQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, this.maxLimit);
    const storeId = (query.storeId ?? 1).toString();
    const skip = (page - 1) * limit;

    const qb = this.productStockRepository
      .createQueryBuilder('stock')
      .innerJoinAndSelect('stock.product', 'product')
      .where('stock.store_id = :storeId', { storeId });

    if (query.query) {
      const containsSearch = `%${this.escapeLikePattern(query.query)}%`;
      qb.andWhere(
        new Brackets((where) => {
          where
            .where(`product.product_name ILIKE :containsSearch ESCAPE '\\'`)
            .orWhere(`product.barcode ILIKE :containsSearch ESCAPE '\\'`)
            .orWhere(`product.sku ILIKE :containsSearch ESCAPE '\\'`);
        }),
      ).setParameter('containsSearch', containsSearch);
    }

    if (query.lowStock) {
      qb.andWhere('stock.stock_base_qty <= stock.min_stock_base_qty');
    }

    qb.orderBy('product.product_name', 'ASC').skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((item) => this.mapStockResponse(item)),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  async getStockMovements(productId: string, query: StockMovementQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, this.maxLimit);
    const skip = (page - 1) * limit;
    const qb = this.stockMovementRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.unit', 'unit')
      .where('movement.product_id = :productId', { productId })
      .andWhere('movement.store_id = :storeId', {
        storeId: (query.storeId ?? 1).toString(),
      });

    if (query.movementType) {
      qb.andWhere('movement.movement_type = :movementType', {
        movementType: query.movementType,
      });
    }

    if (query.dateFrom) {
      qb.andWhere('movement.created_at >= :dateFrom', {
        dateFrom: query.dateFrom,
      });
    }

    if (query.dateTo) {
      qb.andWhere('movement.created_at <= :dateTo', { dateTo: query.dateTo });
    }

    qb.orderBy('movement.created_at', 'DESC').skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  private applyMovement(input: MovementInput) {
    return this.dataSource.transaction(async (manager) => {
      const stock = await this.findOrCreateLockedStock(
        manager,
        input.productId.toString(),
        (input.storeId ?? 1).toString(),
      );

      return this.saveMovementAndStock(manager, stock, input);
    });
  }

  private async saveMovementAndStock(
    manager: EntityManager,
    stock: ProductStock,
    input: MovementInput,
  ) {
    const balanceBefore = Number(stock.stock_base_qty);
    const balanceAfter = balanceBefore + input.qtyChangeBase;

    if (balanceAfter < 0) {
      throw new BadRequestException('Stock balance cannot be negative');
    }

    stock.stock_base_qty = balanceAfter;
    await manager.save(ProductStock, stock);

    const movement = manager.create(StockMovement, {
      product_id: input.productId.toString(),
      product_unit_id: input.productUnitId ? input.productUnitId.toString() : null,
      unit_id: input.unitId ? input.unitId.toString() : null,
      store_id: (input.storeId ?? 1).toString(),
      movement_type: input.movementType,
      reference_type: input.referenceType ?? null,
      reference_id: input.referenceId ?? null,
      input_qty: input.inputQty,
      conversion_to_base: input.conversionToBase ?? 1,
      qty_change_base: input.qtyChangeBase,
      unit_price: input.unitPrice ?? null,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      reason_code: input.reasonCode ?? null,
      note: input.note ?? null,
      created_by: input.createdBy ?? null,
      approved_by: null,
      device_id: input.deviceId ?? null,
      reversed_movement_id: input.reversedMovementId ?? null,
    });

    return manager.save(StockMovement, movement);
  }

  private async findOrCreateLockedStock(
    manager: EntityManager,
    productId: string,
    storeId: string,
  ) {
    const product = await manager.findOne(Product, { where: { id: productId } });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    let stock = await manager.findOne(ProductStock, {
      where: { product_id: productId, store_id: storeId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!stock) {
      const createdStock = manager.create(ProductStock, {
        product_id: productId,
        store_id: storeId,
        stock_base_qty: 0,
        min_stock_base_qty: 0,
      });
      await manager.save(ProductStock, createdStock);
      stock = await manager.findOne(ProductStock, {
        where: { product_id: productId, store_id: storeId },
        lock: { mode: 'pessimistic_write' },
      });
    }

    if (!stock) {
      throw new ConflictException('Product stock row could not be locked');
    }

    return stock;
  }

  private async getActiveProductUnit(productId: string, productUnitId: string) {
    const productUnit = await this.productUnitRepository.findOne({
      where: { id: productUnitId, product_id: productId },
    });

    if (!productUnit) {
      throw new NotFoundException('Product unit not found');
    }

    if (!productUnit.is_active) {
      throw new ConflictException('Product unit is inactive');
    }

    return productUnit;
  }

  private mapStockResponse(stock: ProductStock) {
    const product = stock.product;

    return {
      productId: Number(stock.product_id),
      productName: product?.product_name,
      stockBaseQty: Number(stock.stock_base_qty),
      minStockBaseQty: Number(stock.min_stock_base_qty),
      baseUnit: product
        ? {
            unitCode: product.unit_code,
          }
        : null,
      isLowStock: Number(stock.stock_base_qty) <= Number(stock.min_stock_base_qty),
    };
  }

  private requirePositiveNumber(value: number | undefined, fieldName: string) {
    if (value === undefined || !Number.isFinite(value) || value <= 0) {
      throw new BadRequestException(`${fieldName} must be greater than 0`);
    }

    return value;
  }

  private requireNonNegativeNumber(value: number, fieldName: string) {
    if (!Number.isFinite(value) || value < 0) {
      throw new BadRequestException(`${fieldName} must be greater than or equal to 0`);
    }

    return value;
  }

  private escapeLikePattern(value: string) {
    return value.replace(/[\\%_]/g, '\\$&');
  }

  private roundQty(value: number) {
    return Math.round(value * 10000) / 10000;
  }
}
