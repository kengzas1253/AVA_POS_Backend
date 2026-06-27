import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FavoriteItem } from './favorite-item.entity';

@Entity('favorite_groups')
export class FavoriteGroup {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  group_name: string;

  @Column({ type: 'text', nullable: true })
  icon: string | null;

  @Column({ type: 'integer', default: 0 })
  sort_order: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @OneToMany(() => FavoriteItem, (item) => item.favorite_group)
  items: FavoriteItem[];
}
