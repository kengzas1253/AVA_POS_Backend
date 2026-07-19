import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PosDevice } from '../../pos-devices/entities/pos-device.entity';

@Entity('barcode_print_settings')
export class BarcodePrintSetting {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'integer', nullable: true })
  device_id: number | null;

  @ManyToOne(() => PosDevice, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'device_id' })
  device: PosDevice | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  machine_id: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  printer_name: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  paper_size: string | null;

  @Column({ type: 'varchar', length: 50, default: 'CODE128' })
  barcode_format: string;

  @Column({ type: 'integer', default: 4 })
  items_per_row: number;

  @Column({ type: 'boolean', default: true })
  show_product_name: boolean;

  @Column({ type: 'boolean', default: true })
  show_price: boolean;

  @Column({ type: 'boolean', default: true })
  show_barcode_text: boolean;

  @Column({ type: 'integer', default: 10 })
  font_size: number;

  @Column({ type: 'integer', default: 1 })
  copies: number;

  @Column({ type: 'numeric', precision: 6, scale: 2, default: 2 })
  label_margin: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
