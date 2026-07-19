import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { PosDevice } from '../../pos-devices/entities/pos-device.entity';
import { ProductUnit } from '../../product-units/entities/product-unit.entity';
import { Product } from '../../products/entities/product.entity';
import { Unit } from '../../units/entities/unit.entity';
import { decimalTransformer } from '../decimal.transformer';
import { StockMovementType } from './stock-movement-type.enum';

@Entity('stock_movements')
@Check('chk_stock_movements_input_qty_positive', 'input_qty > 0')
@Check(
  'chk_stock_movements_conversion_to_base_positive',
  'conversion_to_base > 0',
)
@Check('chk_stock_movements_qty_change_base_non_zero', 'qty_change_base <> 0')
@Check('chk_stock_movements_balance_before_non_negative', 'balance_before >= 0')
@Check('chk_stock_movements_balance_after_non_negative', 'balance_after >= 0')
@Check(
  'chk_stock_movements_balance_calculation',
  'balance_after = balance_before + qty_change_base',
)
@Index('idx_stock_movements_product_created_at', ['product_id', 'created_at'])
@Index('idx_stock_movements_store_created_at', ['store_id', 'created_at'])
@Index('idx_stock_movements_type_created_at', ['movement_type', 'created_at'])
@Index('idx_stock_movements_reference', ['reference_type', 'reference_id'])
@Index('idx_stock_movements_unit_id', ['unit_id'])
@Index('idx_stock_movements_product_unit_id', ['product_unit_id'])
@Index('idx_stock_movements_device_id', ['device_id'])
@Index('idx_stock_movements_reversed_movement_id', ['reversed_movement_id'])
export class StockMovement {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'bigint' })
  product_id: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'bigint', nullable: true })
  unit_id: string | null;

  @ManyToOne(() => Unit, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'unit_id' })
  unit: Unit | null;

  @Column({ type: 'bigint', nullable: true })
  product_unit_id: string | null;

  @ManyToOne(() => ProductUnit, (productUnit) => productUnit.stockMovements, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'product_unit_id' })
  productUnit: ProductUnit | null;

  @Column({ type: 'bigint', default: 1 })
  store_id: string;

  @Column({ type: 'varchar', length: 30 })
  movement_type: StockMovementType;

  @Column({ type: 'varchar', length: 30, nullable: true })
  reference_type: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reference_id: string | null;

  @Column({ type: 'numeric', precision: 18, scale: 4, transformer: decimalTransformer })
  input_qty: number;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 4,
    default: 1,
    transformer: decimalTransformer,
  })
  conversion_to_base: number;

  @Column({ type: 'numeric', precision: 18, scale: 4, transformer: decimalTransformer })
  qty_change_base: number;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  unit_price: number | null;

  @Column({ type: 'numeric', precision: 18, scale: 4, transformer: decimalTransformer })
  balance_before: number;

  @Column({ type: 'numeric', precision: 18, scale: 4, transformer: decimalTransformer })
  balance_after: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  reason_code: string | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'uuid', nullable: true })
  created_by: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by', referencedColumnName: 'user_id' })
  createdBy: User | null;

  @Column({ type: 'uuid', nullable: true })
  approved_by: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'approved_by', referencedColumnName: 'user_id' })
  approvedBy: User | null;

  @Column({ type: 'integer', nullable: true })
  device_id: number | null;

  @ManyToOne(() => PosDevice, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'device_id' })
  device: PosDevice | null;

  @Column({ type: 'bigint', nullable: true })
  reversed_movement_id: string | null;

  @ManyToOne(() => StockMovement, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reversed_movement_id' })
  reversed_movement: StockMovement | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
