CREATE TABLE IF NOT EXISTS promotions (
  id bigserial PRIMARY KEY,
  promotion_code varchar(50) NOT NULL UNIQUE,
  promotion_name varchar(255) NOT NULL,
  promotion_type varchar(50) NOT NULL,
  allow_mix boolean NOT NULL DEFAULT false,
  mix_type varchar(20) NOT NULL DEFAULT 'NONE',
  start_date timestamp NULL,
  end_date timestamp NULL,
  priority integer NOT NULL DEFAULT 0,
  can_combine boolean NOT NULL DEFAULT false,
  status varchar(20) NOT NULL DEFAULT 'ACTIVE',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

ALTER TABLE promotions
  ADD COLUMN IF NOT EXISTS allow_mix boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS mix_type varchar(20) NOT NULL DEFAULT 'NONE',
  ADD COLUMN IF NOT EXISTS start_date timestamp NULL,
  ADD COLUMN IF NOT EXISTS end_date timestamp NULL,
  ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS can_combine boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status varchar(20) NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS created_at timestamp NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamp NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS promotion_rules (
  id bigserial PRIMARY KEY,
  promotion_id bigint NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  min_qty integer NOT NULL,
  bundle_price numeric(12,2) NULL,
  unit_price numeric(12,2) NULL,
  discount_percent numeric(5,2) NULL
);

CREATE TABLE IF NOT EXISTS promotion_products (
  id bigserial PRIMARY KEY,
  promotion_id bigint NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  product_id bigint NOT NULL REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_promotion_rules_promotion_id
  ON promotion_rules(promotion_id);

CREATE INDEX IF NOT EXISTS idx_promotion_products_promotion_id
  ON promotion_products(promotion_id);

CREATE INDEX IF NOT EXISTS idx_promotion_products_product_id
  ON promotion_products(product_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_promotion_products_pair
  ON promotion_products(promotion_id, product_id);
