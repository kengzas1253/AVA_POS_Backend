import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('device_settings')
export class PosMachineSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'machine_id',
    type: 'uuid',
    unique: true,
  })
  machineId: string;

  @Column({
    name: 'receipt_printer_name',
    type: 'varchar',
    nullable: true,
  })
  receiptPrinterName: string | null;

  @Column({
    name: 'receipt_paper_size',
    type: 'varchar',
    nullable: true,
  })
  receiptPaperSize: string | null;

  @Column({
    name: 'receipt_font_size',
    type: 'integer',
    nullable: true,
  })
  receiptFontSize: number | null;

  @Column({
    name: 'receipt_font_family',
    type: 'varchar',
    nullable: true,
  })
  receiptFontFamily: string | null;

  @Column({
    name: 'receipt_copies',
    type: 'integer',
    default: 1,
  })
  receiptCopies: number;

  @Column({
    name: 'auto_print_receipt',
    type: 'boolean',
    default: true,
  })
  autoPrintReceipt: boolean;

  @Column({
    name: 'auto_open_cash_drawer',
    type: 'boolean',
    default: false,
  })
  autoOpenCashDrawer: boolean;

  @Column({
    name: 'a4_printer_name',
    type: 'varchar',
    nullable: true,
  })
  a4PrinterName: string | null;

  @Column({
    name: 'a4_copies',
    type: 'integer',
    default: 1,
  })
  a4Copies: number;

  @Column({
    name: 'label_printer_name',
    type: 'varchar',
    nullable: true,
  })
  labelPrinterName: string | null;

  @Column({
    name: 'label_width_mm',
    type: 'integer',
    nullable: true,
  })
  labelWidthMm: number | null;

  @Column({
    name: 'label_height_mm',
    type: 'integer',
    nullable: true,
  })
  labelHeightMm: number | null;

  @Column({
    name: 'customer_display_enabled',
    type: 'boolean',
    default: false,
  })
  customerDisplayEnabled: boolean;

  @Column({
    name: 'customer_display_monitor',
    type: 'varchar',
    nullable: true,
  })
  customerDisplayMonitor: string | null;

  @Column({
    name: 'barcode_scanner_enabled',
    type: 'boolean',
    default: true,
  })
  barcodeScannerEnabled: boolean;

  @Column({
    name: 'allow_below_cost',
    type: 'boolean',
    default: false,
  })
  allowBelowCost: boolean;

  @Column({
    name: 'min_profit_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
  })
  minProfitAmount: string;

  @Column({
    name: 'require_manager_approval',
    type: 'boolean',
    default: false,
  })
  requireManagerApproval: boolean;

  @Column({
    name: 'manager_pin_required',
    type: 'boolean',
    default: false,
  })
  managerPinRequired: boolean;

  @Column({
    default: 'th',
  })
  language: string;

  @Column({
    default: 'light',
  })
  theme: string;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;
}
