import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';

export enum CategoryStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  category_name: string;

  @Column({ type: 'integer', default: 0 })
  sort_order: number;

  @Column({ type: 'varchar', length: 20, default: CategoryStatus.ACTIVE })
  status: CategoryStatus;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];

  product_count?: number;
}
