import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdatePosMachineSettingDto {
  @IsOptional()
  @IsString()
  receipt_printer_name?: string | null;

  @IsOptional()
  @IsString()
  receipt_paper_size?: string | null;

  @IsOptional()
  @IsNumber()
  receipt_font_size?: number | null;

  @IsOptional()
  @IsString()
  receipt_font_family?: string | null;

  @IsOptional()
  @IsNumber()
  receipt_copies?: number;

  @IsOptional()
  @IsBoolean()
  auto_print_receipt?: boolean;

  @IsOptional()
  @IsBoolean()
  auto_open_cash_drawer?: boolean;

  @IsOptional()
  @IsString()
  a4_printer_name?: string | null;

  @IsOptional()
  @IsNumber()
  a4_copies?: number;

  @IsOptional()
  @IsString()
  label_printer_name?: string | null;

  @IsOptional()
  @IsNumber()
  label_width_mm?: number | null;

  @IsOptional()
  @IsNumber()
  label_height_mm?: number | null;

  @IsOptional()
  @IsBoolean()
  customer_display_enabled?: boolean;

  @IsOptional()
  @IsString()
  customer_display_monitor?: string | null;

  @IsOptional()
  @IsBoolean()
  barcode_scanner_enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  allow_below_cost?: boolean;

  @IsOptional()
  @IsNumber()
  min_profit_amount?: number;

  @IsOptional()
  @IsBoolean()
  require_manager_approval?: boolean;

  @IsOptional()
  @IsBoolean()
  manager_pin_required?: boolean;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  theme?: string;
}
