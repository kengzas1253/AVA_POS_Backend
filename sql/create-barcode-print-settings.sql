CREATE TABLE IF NOT EXISTS barcode_print_settings (
  id BIGSERIAL PRIMARY KEY,
  device_id INTEGER
    REFERENCES pos_devices(id) ON DELETE SET NULL,
  machine_id VARCHAR(255),
  printer_name VARCHAR(255),
  paper_size VARCHAR(50),
  barcode_format VARCHAR(50) NOT NULL DEFAULT 'CODE128',
  items_per_row INTEGER NOT NULL DEFAULT 4,
  show_product_name BOOLEAN NOT NULL DEFAULT true,
  show_price BOOLEAN NOT NULL DEFAULT true,
  show_barcode_text BOOLEAN NOT NULL DEFAULT true,
  font_size INTEGER NOT NULL DEFAULT 10,
  copies INTEGER NOT NULL DEFAULT 1,
  label_margin NUMERIC(6, 2) NOT NULL DEFAULT 2.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE barcode_print_settings
ADD COLUMN IF NOT EXISTS machine_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_barcode_print_settings_device
ON barcode_print_settings (device_id);

CREATE INDEX IF NOT EXISTS idx_barcode_print_settings_machine
ON barcode_print_settings (machine_id);
