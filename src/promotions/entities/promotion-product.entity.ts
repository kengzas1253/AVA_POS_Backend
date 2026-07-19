import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { Promotion } from './promotion.entity';

@Entity('promotion_products')
export class PromotionProduct {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'bigint' })
  promotion_id: string;

  @ManyToOne(() => Promotion, (promotion) => promotion.products, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'promotion_id' })
  promotion: Promotion;

  @Column({ type: 'bigint' })
  product_id: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
