import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { decimalTransformer } from '../decimal.transformer';

@Entity('product_stocks')
@Unique('uq_product_stocks_product_store', ['product_id', 'store_id'])
@Check('chk_product_stocks_stock_base_qty_non_negative', 'stock_base_qty >= 0')
@Check(
  'chk_product_stocks_min_stock_base_qty_non_negative',
  'min_stock_base_qty >= 0',
)
@Index('idx_product_stocks_product_id', ['product_id'])
@Index('idx_product_stocks_store_id', ['store_id'])
@Index('idx_product_stocks_stock_base_qty', ['stock_base_qty'])
@Index('idx_product_stocks_product_store', ['product_id', 'store_id'])
export class ProductStock {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'bigint' })
  product_id: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'bigint', default: 1 })
  store_id: string;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 4,
    default: 0,
    transformer: decimalTransformer,
  })
  stock_base_qty: number;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 4,
    default: 0,
    transformer: decimalTransformer,
  })
  min_stock_base_qty: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
