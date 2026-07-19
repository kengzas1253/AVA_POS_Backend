import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { HeldBill } from './held-bill.entity';

const numericTransformer = {
  to: (value?: number | string | null) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};

@Entity('held_bill_items')
export class HeldBillItem {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'bigint' })
  held_bill_id: string;

  @ManyToOne(() => HeldBill, (heldBill) => heldBill.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'held_bill_id' })
  held_bill: HeldBill;

  @Column({ type: 'bigint' })
  product_id: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  sku: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  barcode: string | null;

  @Column({ type: 'varchar', length: 255 })
  product_name: string;

  @Column({ type: 'bigint', nullable: true })
  category_id: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  unit_code: string | null;

  @Column({ type: 'varchar', length: 20 })
  price_mode: string;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    transformer: numericTransformer,
  })
  qty: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  cost_price: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  sale_price: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  unit_price: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  discount_amount: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  total_amount: number;

  @Column({ type: 'boolean', default: true })
  track_stock: boolean;

  @Column({ type: 'boolean', default: true })
  allow_discount: boolean;

  @Column({ type: 'text', nullable: true })
  image_url: string | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => "timezone('Asia/Bangkok', now())",
  })
  created_at: Date;
}
