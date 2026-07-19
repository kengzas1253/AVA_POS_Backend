import { BadRequestException, ConflictException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ProductUnit } from '../product-units/entities/product-unit.entity';
import { Product } from '../products/entities/product.entity';
import { ProductStock } from './entities/product-stock.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { StockMovementType } from './entities/stock-movement-type.enum';
import { StockService } from './stock.service';

describe('StockService', () => {
  function createService(stockQty = 10) {
    const stock: ProductStock = {
      id: '1',
      product_id: '1',
      product: {} as Product,
      store_id: '1',
      stock_base_qty: stockQty,
      min_stock_base_qty: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };
    const movements: StockMovement[] = [];
    const manager = {
      findOne: jest.fn((entity, options?: { where?: Record<string, string> }) => {
        if (entity === Product) {
          return Promise.resolve({ id: options?.where?.id });
        }

        if (entity === ProductStock) {
          return Promise.resolve(stock);
        }

        return Promise.resolve(null);
      }),
      create: jest.fn((_entity, data) => data),
      save: jest.fn((entity, data) => {
        if (entity === StockMovement) {
          movements.push(data);
        }

        return Promise.resolve(data);
      }),
    };
    const dataSource = {
      transaction: jest.fn((callback) => callback(manager)),
    } as unknown as DataSource;

    const productUnitRepository = {
      findOne: jest.fn(({ where }) =>
        Promise.resolve({
          id: where.id,
          product_id: where.product_id,
          unit_id: '2',
          conversion_to_base: 6,
          sale_price: 210,
          is_active: true,
        }),
      ),
    } as unknown as Repository<ProductUnit>;

    return {
      service: new StockService(
        dataSource,
        {} as Repository<ProductStock>,
        {} as Repository<StockMovement>,
        productUnitRepository,
      ),
      stock,
      movements,
      manager,
      productUnitRepository,
    };
  }

  it('increases stock and records movement in one transaction', async () => {
    const { service, stock, movements } = createService(10);

    await service.increaseStock(
      {
        productId: 1,
        unitId: 1,
        storeId: 1,
        movementType: StockMovementType.PURCHASE_IN,
        inputQty: 2,
        conversionToBase: 6,
      },
      '7ad80ebe-1c81-4abf-a530-43327f681c0d',
    );

    expect(stock.stock_base_qty).toBe(22);
    expect(movements[0]).toMatchObject({
      qty_change_base: 12,
      balance_before: 10,
      balance_after: 22,
      created_by: '7ad80ebe-1c81-4abf-a530-43327f681c0d',
    });
  });

  it('decreases stock using conversion_to_base', async () => {
    const { service, stock, movements } = createService(20);

    await service.decreaseStock({
      productId: 1,
      storeId: 1,
      movementType: StockMovementType.SALE_OUT,
      inputQty: 2,
      conversionToBase: 6,
    });

    expect(stock.stock_base_qty).toBe(8);
    expect(movements[0].qty_change_base).toBe(-12);
  });

  it('decreases stock using product unit conversion from backend', async () => {
    const { service, stock, movements } = createService(20);

    await service.decreaseStock({
      productId: 1,
      productUnitId: 102,
      storeId: 1,
      qty: 2,
      reasonCode: 'SALE',
      referenceType: 'SALE',
      referenceId: '5001',
    });

    expect(stock.stock_base_qty).toBe(8);
    expect(movements[0]).toMatchObject({
      product_unit_id: '102',
      unit_id: '2',
      input_qty: 2,
      conversion_to_base: 6,
      qty_change_base: -12,
      unit_price: 210,
    });
  });

  it('prevents negative stock', async () => {
    const { service } = createService(5);

    await expect(
      service.decreaseStock({
        productId: 1,
        storeId: 1,
        movementType: StockMovementType.SALE_OUT,
        inputQty: 2,
        conversionToBase: 6,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('prevents duplicate reversal', async () => {
    const stock = { product_id: '1', store_id: '1', stock_base_qty: 10 };
    const original = {
      id: '1',
      product_id: '1',
      unit_id: null,
      store_id: '1',
      qty_change_base: 5,
      reference_type: null,
      reference_id: null,
      device_id: null,
    };
    const manager = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce(original)
        .mockResolvedValueOnce({ id: '2' })
        .mockResolvedValue(stock),
    };
    const dataSource = {
      transaction: jest.fn((callback) => callback(manager)),
    } as unknown as DataSource;
    const service = new StockService(
      dataSource,
      {} as Repository<ProductStock>,
      {} as Repository<StockMovement>,
      {} as Repository<ProductUnit>,
    );

    await expect(service.reverseMovement('1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
