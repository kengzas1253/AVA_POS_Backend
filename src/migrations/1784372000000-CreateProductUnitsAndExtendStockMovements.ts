import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductUnitsAndExtendStockMovements1784372000000
  implements MigrationInterface
{
  name = 'CreateProductUnitsAndExtendStockMovements1784372000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS product_units (
        id BIGSERIAL PRIMARY KEY,
        product_id BIGINT NOT NULL,
        unit_id BIGINT NOT NULL,
        barcode VARCHAR(100) NOT NULL,
        conversion_to_base NUMERIC(18,4) NOT NULL DEFAULT 1,
        sale_price NUMERIC(18,2) NOT NULL DEFAULT 0,
        cost_price NUMERIC(18,2) NOT NULL DEFAULT 0,
        is_base BOOLEAN NOT NULL DEFAULT FALSE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_product_units_product
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        CONSTRAINT fk_product_units_unit
          FOREIGN KEY (unit_id) REFERENCES units(id),
        CONSTRAINT uq_product_units_barcode UNIQUE (barcode),
        CONSTRAINT uq_product_units_product_unit UNIQUE (product_id, unit_id),
        CONSTRAINT chk_product_units_conversion CHECK (conversion_to_base > 0),
        CONSTRAINT chk_product_units_price CHECK (sale_price >= 0 AND cost_price >= 0)
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS idx_product_units_product_id ON product_units(product_id)',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS idx_product_units_unit_id ON product_units(unit_id)',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS idx_product_units_active ON product_units(is_active)',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS uq_product_units_one_base_per_product ON product_units(product_id) WHERE is_base = true',
    );

    await queryRunner.query(
      'ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS product_unit_id BIGINT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS unit_price NUMERIC(18,2) NULL',
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_stock_movements_product_unit'
        ) THEN
          ALTER TABLE stock_movements
          ADD CONSTRAINT fk_stock_movements_product_unit
          FOREIGN KEY (product_unit_id) REFERENCES product_units(id);
        END IF;
      END
      $$;
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS idx_stock_movements_product_unit_id ON stock_movements(product_unit_id)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_stock_movements_product_unit_id');
    await queryRunner.query(
      'ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS fk_stock_movements_product_unit',
    );
    await queryRunner.query('ALTER TABLE stock_movements DROP COLUMN IF EXISTS unit_price');
    await queryRunner.query(
      'ALTER TABLE stock_movements DROP COLUMN IF EXISTS product_unit_id',
    );
    await queryRunner.query('DROP INDEX IF EXISTS uq_product_units_one_base_per_product');
    await queryRunner.query('DROP INDEX IF EXISTS idx_product_units_active');
    await queryRunner.query('DROP INDEX IF EXISTS idx_product_units_unit_id');
    await queryRunner.query('DROP INDEX IF EXISTS idx_product_units_product_id');
    await queryRunner.query('DROP TABLE IF EXISTS product_units');
  }
}
