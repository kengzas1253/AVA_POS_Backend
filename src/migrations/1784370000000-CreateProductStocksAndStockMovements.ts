import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductStocksAndStockMovements1784370000000
  implements MigrationInterface
{
  name = 'CreateProductStocksAndStockMovements1784370000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS product_stocks (
        id BIGSERIAL PRIMARY KEY,
        product_id BIGINT NOT NULL,
        store_id BIGINT NOT NULL DEFAULT 1,
        stock_base_qty NUMERIC(18,4) NOT NULL DEFAULT 0,
        min_stock_base_qty NUMERIC(18,4) NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_product_stocks_product_store UNIQUE (product_id, store_id),
        CONSTRAINT fk_product_stocks_product_id
          FOREIGN KEY (product_id) REFERENCES products(id)
          ON UPDATE CASCADE ON DELETE RESTRICT,
        CONSTRAINT chk_product_stocks_stock_base_qty_non_negative
          CHECK (stock_base_qty >= 0),
        CONSTRAINT chk_product_stocks_min_stock_base_qty_non_negative
          CHECK (min_stock_base_qty >= 0)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_product_stocks_product_id
      ON product_stocks (product_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_product_stocks_store_id
      ON product_stocks (store_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_product_stocks_stock_base_qty
      ON product_stocks (stock_base_qty)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_product_stocks_product_store
      ON product_stocks (product_id, store_id)
    `);

    await queryRunner.query(`
      INSERT INTO product_stocks (product_id, store_id, stock_base_qty, min_stock_base_qty)
      SELECT id, 1, 0, 0
      FROM products
      ON CONFLICT (product_id, store_id) DO NOTHING
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id BIGSERIAL PRIMARY KEY,
        product_id BIGINT NOT NULL,
        unit_id BIGINT NULL,
        store_id BIGINT NOT NULL DEFAULT 1,
        movement_type VARCHAR(30) NOT NULL,
        reference_type VARCHAR(30) NULL,
        reference_id VARCHAR(100) NULL,
        input_qty NUMERIC(18,4) NOT NULL,
        conversion_to_base NUMERIC(18,4) NOT NULL DEFAULT 1,
        qty_change_base NUMERIC(18,4) NOT NULL,
        balance_before NUMERIC(18,4) NOT NULL,
        balance_after NUMERIC(18,4) NOT NULL,
        reason_code VARCHAR(50) NULL,
        note TEXT NULL,
        created_by UUID NULL,
        approved_by UUID NULL,
        device_id INTEGER NULL,
        reversed_movement_id BIGINT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_stock_movements_product_id
          FOREIGN KEY (product_id) REFERENCES products(id)
          ON DELETE RESTRICT,
        CONSTRAINT fk_stock_movements_unit_id
          FOREIGN KEY (unit_id) REFERENCES units(id)
          ON DELETE RESTRICT,
        CONSTRAINT fk_stock_movements_created_by
          FOREIGN KEY (created_by) REFERENCES users(user_id)
          ON DELETE SET NULL,
        CONSTRAINT fk_stock_movements_approved_by
          FOREIGN KEY (approved_by) REFERENCES users(user_id)
          ON DELETE SET NULL,
        CONSTRAINT fk_stock_movements_device_id
          FOREIGN KEY (device_id) REFERENCES pos_devices(id)
          ON DELETE SET NULL,
        CONSTRAINT fk_stock_movements_reversed_movement_id
          FOREIGN KEY (reversed_movement_id) REFERENCES stock_movements(id)
          ON DELETE RESTRICT,
        CONSTRAINT chk_stock_movements_type
          CHECK (movement_type IN (
            'OPENING_STOCK',
            'PURCHASE_IN',
            'PURCHASE_RETURN_OUT',
            'SALE_OUT',
            'SALE_RETURN_IN',
            'CANCEL_SALE_IN',
            'ADJUSTMENT_IN',
            'ADJUSTMENT_OUT',
            'STOCK_COUNT',
            'DAMAGED_OUT',
            'EXPIRED_OUT',
            'LOST_OUT',
            'INTERNAL_USE_OUT',
            'TRANSFER_IN',
            'TRANSFER_OUT',
            'REVERSAL'
          )),
        CONSTRAINT chk_stock_movements_input_qty_positive
          CHECK (input_qty > 0),
        CONSTRAINT chk_stock_movements_conversion_to_base_positive
          CHECK (conversion_to_base > 0),
        CONSTRAINT chk_stock_movements_qty_change_base_non_zero
          CHECK (qty_change_base <> 0),
        CONSTRAINT chk_stock_movements_balance_before_non_negative
          CHECK (balance_before >= 0),
        CONSTRAINT chk_stock_movements_balance_after_non_negative
          CHECK (balance_after >= 0),
        CONSTRAINT chk_stock_movements_balance_calculation
          CHECK (balance_after = balance_before + qty_change_base)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_stock_movements_product_created_at
      ON stock_movements (product_id, created_at DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_stock_movements_store_created_at
      ON stock_movements (store_id, created_at DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_stock_movements_type_created_at
      ON stock_movements (movement_type, created_at DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_stock_movements_reference
      ON stock_movements (reference_type, reference_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_stock_movements_unit_id
      ON stock_movements (unit_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_stock_movements_device_id
      ON stock_movements (device_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_stock_movements_reversed_movement_id
      ON stock_movements (reversed_movement_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS stock_movements');
    await queryRunner.query('DROP TABLE IF EXISTS product_stocks');
  }
}
