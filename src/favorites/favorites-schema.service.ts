import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class FavoritesSchemaService implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS favorite_groups (
        id BIGSERIAL PRIMARY KEY,
        group_name VARCHAR(255) NOT NULL,
        icon TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await this.dataSource.query(`
      ALTER TABLE favorite_groups
      ADD COLUMN IF NOT EXISTS icon TEXT
    `);
    await this.dataSource.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_favorite_groups_name_ci
      ON favorite_groups (LOWER(TRIM(group_name)))
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS favorite_items (
        id BIGSERIAL PRIMARY KEY,
        favorite_group_id BIGINT NOT NULL
          REFERENCES favorite_groups(id) ON DELETE CASCADE,
        product_id BIGINT NOT NULL
          REFERENCES products(id) ON DELETE CASCADE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_favorite_items_group_product
          UNIQUE (favorite_group_id, product_id)
      )
    `);
    await this.dataSource.query(`
      CREATE INDEX IF NOT EXISTS idx_favorite_items_group_sort
      ON favorite_items (favorite_group_id, sort_order, id)
    `);
  }
}
