ALTER TABLE products
  DROP CONSTRAINT IF EXISTS chk_products_price_mode;

ALTER TABLE products
  ADD CONSTRAINT chk_products_price_mode
  CHECK (
    price_mode IN (
      'FIXED_PRICE',
      'OPEN_PRICE',
      'WEIGHT_PRICE',
      'SERVICE_PRICE'
    )
  );

UPDATE products
SET
  track_stock = false,
  stock_qty = 0,
  min_stock_qty = 0
WHERE price_mode = 'SERVICE_PRICE';
