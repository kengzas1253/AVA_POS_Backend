CREATE TABLE IF NOT EXISTS customers (
  id BIGSERIAL PRIMARY KEY,
  customer_code VARCHAR(50) NOT NULL UNIQUE,
  customer_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(30),
  email VARCHAR(255),
  address TEXT,
  total_purchase_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  points_balance INTEGER NOT NULL DEFAULT 0,
  first_purchase_at TIMESTAMP,
  last_purchase_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_customer_name
ON customers (customer_name);

CREATE INDEX IF NOT EXISTS idx_customers_phone_number
ON customers (phone_number);

CREATE INDEX IF NOT EXISTS idx_customers_email
ON customers (email);
