import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { FavoriteGroup } from './favorite-group.entity';

@Entity('favorite_items')
@Unique('uq_favorite_items_group_product', [
  'favorite_group_id',
  'product_id',
])
export class FavoriteItem {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'bigint' })
  favorite_group_id: string;

  @ManyToOne(() => FavoriteGroup, (group) => group.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'favorite_group_id' })
  favorite_group: FavoriteGroup;

  @Column({ type: 'bigint' })
  product_id: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'integer', default: 0 })
  sort_order: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
