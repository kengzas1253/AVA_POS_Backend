import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PromotionProduct } from './promotion-product.entity';
import { PromotionRule } from './promotion-rule.entity';

export enum PromotionType {
  FIXED_BUNDLE_PRICE = 'FIXED_BUNDLE_PRICE',
  TIER_UNIT_PRICE = 'TIER_UNIT_PRICE',
  PERCENT_DISCOUNT = 'PERCENT_DISCOUNT',
}

export enum PromotionMixType {
  NONE = 'NONE',
  PRODUCT = 'PRODUCT',
}

export enum PromotionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Entity('promotions')
export class Promotion {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  promotion_code: string;

  @Column({ type: 'varchar', length: 255 })
  promotion_name: string;

  @Column({ type: 'varchar', length: 50 })
  promotion_type: PromotionType;

  @Column({ type: 'boolean', default: false })
  allow_mix: boolean;

  @Column({ type: 'varchar', length: 20, default: PromotionMixType.NONE })
  mix_type: PromotionMixType;

  @Column({ type: 'timestamp', nullable: true })
  start_date: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  end_date: Date | null;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'boolean', default: false })
  can_combine: boolean;

  @Column({ type: 'varchar', length: 20, default: PromotionStatus.ACTIVE })
  status: PromotionStatus;

  @OneToMany(() => PromotionRule, (rule) => rule.promotion, { cascade: false })
  rules: PromotionRule[];

  @OneToMany(() => PromotionProduct, (product) => product.promotion, {
    cascade: false,
  })
  products: PromotionProduct[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
