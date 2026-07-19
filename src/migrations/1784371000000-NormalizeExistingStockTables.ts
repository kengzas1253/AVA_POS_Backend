import { MigrationInterface, QueryRunner } from 'typeorm';

export class NormalizeExistingStockTables1784371000000
  implements MigrationInterface
{
  name = 'NormalizeExistingStockTables1784371000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE product_stocks
      SET store_id = 1
      WHERE store_id IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE product_stocks
      ALTER COLUMN store_id SET DEFAULT 1,
      ALTER COLUMN store_id SET NOT NULL,
      ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'Asia/Bangkok',
      ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'Asia/Bangkok'
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'stock_movements'
            AND column_name = 'product_unit_id'
        ) AND NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'stock_movements'
            AND column_name = 'unit_id'
        ) THEN
          ALTER TABLE stock_movements RENAME COLUMN product_unit_id TO unit_id;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE stock_movements
      ADD COLUMN IF NOT EXISTS reversed_movement_id BIGINT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_stock_movements_unit_id
      ON stock_movements (unit_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_stock_movements_reversed_movement_id
      ON stock_movements (reversed_movement_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_stock_movements_reversed_movement_id
    `);
    await queryRunner.query(`
      ALTER TABLE stock_movements
      DROP COLUMN IF EXISTS reversed_movement_id
    `);
  }
}
