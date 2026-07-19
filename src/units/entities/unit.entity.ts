import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductUnit } from '../../product-units/entities/product-unit.entity';
import { UnitGroup } from './unit-group.entity';

@Entity('units')
export class Unit {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'bigint' })
  unit_group_id: string;

  @ManyToOne(() => UnitGroup, (unitGroup) => unitGroup.units, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'unit_group_id' })
  unit_group: UnitGroup;

  @Column({ type: 'varchar', length: 50, unique: true })
  unit_code: string;

  @Column({ type: 'varchar', length: 255 })
  unit_name_th: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  unit_name_en: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  symbol: string | null;

  @Column({ type: 'boolean', default: false })
  is_decimal: boolean;

  @OneToMany(() => ProductUnit, (productUnit) => productUnit.unit)
  productUnits: ProductUnit[];
}
