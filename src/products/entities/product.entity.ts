import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { ProductUnit } from '../../product-units/entities/product-unit.entity';

export enum ProductPriceMode {
  FIXED_PRICE = 'FIXED_PRICE',
  OPEN_PRICE = 'OPEN_PRICE',
  WEIGHT_PRICE = 'WEIGHT_PRICE',
  SERVICE_PRICE = 'SERVICE_PRICE',
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  sku: string | null;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  barcode: string | null;

  @Column({ type: 'varchar', length: 255 })
  product_name: string;

  @Column({ type: 'bigint', nullable: true })
  category_id: string | null;

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category: Category | null;

  @Column({ type: 'varchar', length: 20, default: 'PCS' })
  unit_code: string;

  @Column({ type: 'varchar', length: 20, default: ProductPriceMode.FIXED_PRICE })
  price_mode: ProductPriceMode;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  cost_price: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  sale_price: string;

  @Column({ type: 'numeric', precision: 12, scale: 3, default: 0 })
  stock_qty: string;

  @Column({ type: 'numeric', precision: 12, scale: 3, default: 0 })
  min_stock_qty: string;

  @Column({ type: 'boolean', default: true })
  track_stock: boolean;

  @Column({ type: 'boolean', default: true })
  allow_discount: boolean;

  @Column({ type: 'text', nullable: true })
  image_url: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 20, default: ProductStatus.ACTIVE })
  status: ProductStatus;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @OneToMany(() => ProductUnit, (productUnit) => productUnit.product)
  productUnits: ProductUnit[];
}
