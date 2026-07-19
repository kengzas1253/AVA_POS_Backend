import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('store_settings')
export class StoreSetting {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  store_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  owner_name: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  tax_id: string | null;

  @Column({ type: 'varchar', length: 100, default: 'สำนักงานใหญ่' })
  branch_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  branch_no: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string | null;

  @Column({ type: 'text', nullable: true })
  logo_url: string | null;

  @Column({ type: 'text', nullable: true })
  receipt_image_url: string | null;

  @Column({ type: 'text', nullable: true })
  receipt_header: string | null;

  @Column({ type: 'text', nullable: true })
  receipt_footer: string | null;

  @Column({ type: 'varchar', length: 10, default: '80MM' })
  receipt_paper_size: string;

  @Column({ type: 'boolean', default: true })
  show_logo: boolean;

  @Column({ type: 'boolean', default: true })
  show_receipt_image: boolean;

  @Column({ type: 'boolean', default: true })
  auto_print_receipt: boolean;

  @Column({ type: 'boolean', default: false })
  show_promptpay_qr: boolean;

  @Column({ type: 'boolean', default: false })
  vat_enabled: boolean;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 7.0 })
  vat_rate: string;

  @Column({ type: 'varchar', length: 10, default: 'th' })
  language: string;

  @Column({ type: 'varchar', length: 10, default: 'THB' })
  currency: string;

  @Column({ type: 'varchar', length: 50, default: 'Asia/Bangkok' })
  timezone: string;

  @Column({ type: 'boolean', default: false })
  allow_negative_stock: boolean;

  @Column({ type: 'varchar', length: 100, default: 'ลูกค้าทั่วไป' })
  default_customer_name: string;

  @Column({ type: 'bigint', nullable: true })
  default_payment_account_id: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
