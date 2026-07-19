CREATE TABLE IF NOT EXISTS device_settings (
  id SERIAL PRIMARY KEY,
  machine_id UUID NOT NULL UNIQUE,
  receipt_printer_name VARCHAR(255),
  receipt_paper_size VARCHAR(50),
  receipt_font_size INTEGER,
  receipt_font_family VARCHAR(255),
  receipt_copies INTEGER NOT NULL DEFAULT 1,
  auto_print_receipt BOOLEAN NOT NULL DEFAULT true,
  auto_open_cash_drawer BOOLEAN NOT NULL DEFAULT false,
  a4_printer_name VARCHAR(255),
  a4_copies INTEGER NOT NULL DEFAULT 1,
  label_printer_name VARCHAR(255),
  label_width_mm INTEGER,
  label_height_mm INTEGER,
  customer_display_enabled BOOLEAN NOT NULL DEFAULT false,
  customer_display_monitor VARCHAR(255),
  barcode_scanner_enabled BOOLEAN NOT NULL DEFAULT true,
  allow_below_cost BOOLEAN NOT NULL DEFAULT false,
  min_profit_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  require_manager_approval BOOLEAN NOT NULL DEFAULT false,
  manager_pin_required BOOLEAN NOT NULL DEFAULT false,
  language VARCHAR(10) NOT NULL DEFAULT 'th',
  theme VARCHAR(20) NOT NULL DEFAULT 'light',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS
idx_device_settings_machine_id
ON device_settings(machine_id);
