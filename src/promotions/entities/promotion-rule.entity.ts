import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Promotion } from './promotion.entity';

@Entity('promotion_rules')
export class PromotionRule {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'bigint' })
  promotion_id: string;

  @ManyToOne(() => Promotion, (promotion) => promotion.rules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'promotion_id' })
  promotion: Promotion;

  @Column({ type: 'int' })
  min_qty: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  bundle_price: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  unit_price: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  discount_percent: string | null;
}
