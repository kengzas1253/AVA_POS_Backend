import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { StockMovement } from '../../stocks/entities/stock-movement.entity';
import { Unit } from '../../units/entities/unit.entity';
import { decimalTransformer } from '../../stocks/decimal.transformer';

@Entity('product_units')
@Unique('uq_product_units_barcode', ['barcode'])
@Unique('uq_product_units_product_unit', ['product_id', 'unit_id'])
@Check('chk_product_units_conversion', 'conversion_to_base > 0')
@Check('chk_product_units_price', 'sale_price >= 0 AND cost_price >= 0')
@Index('idx_product_units_product_id', ['product_id'])
@Index('idx_product_units_unit_id', ['unit_id'])
@Index('idx_product_units_active', ['is_active'])
export class ProductUnit {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'bigint' })
  product_id: string;

  @ManyToOne(() => Product, (product) => product.productUnits, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'bigint' })
  unit_id: string;

  @ManyToOne(() => Unit, (unit) => unit.productUnits, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'unit_id' })
  unit: Unit;

  @Column({ type: 'varchar', length: 100 })
  barcode: string;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 4,
    default: 1,
    transformer: decimalTransformer,
  })
  conversion_to_base: number;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  sale_price: number;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  cost_price: number;

  @Column({ type: 'boolean', default: false })
  is_base: boolean;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'integer', default: 0 })
  sort_order: number;

  @OneToMany(() => StockMovement, (movement) => movement.productUnit)
  stockMovements: StockMovement[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
