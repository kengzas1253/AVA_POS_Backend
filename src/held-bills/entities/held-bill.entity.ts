import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { HeldBillItem } from './held-bill-item.entity';

export enum HeldBillStatus {
  HELD = 'HELD',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

const numericTransformer = {
  to: (value?: number | string | null) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};

@Entity('held_bills')
export class HeldBill {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  hold_no: string;

  @Column({ type: 'varchar', length: 100 })
  hold_name: string;

  @Column({ type: 'varchar', nullable: true })
  customer_id: string | null;

  @Column({ type: 'varchar' })
  machine_id: string;

  @Column({ type: 'varchar' })
  user_id: string;

  @Column({ type: 'integer', default: 0 })
  item_count: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    default: 0,
    transformer: numericTransformer,
  })
  total_qty: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  subtotal_amount: number;

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
  tax_amount: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  total_amount: number;

  @Column({ type: 'varchar', length: 20, default: HeldBillStatus.HELD })
  status: HeldBillStatus;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => "timezone('Asia/Bangkok', now())",
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => "timezone('Asia/Bangkok', now())",
  })
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  paid_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  cancelled_at: Date | null;

  @OneToMany(() => HeldBillItem, (item) => item.held_bill)
  items: HeldBillItem[];
}
