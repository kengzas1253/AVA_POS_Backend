import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Unit } from './unit.entity';

@Entity('unit_groups')
export class UnitGroup {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  group_code: string;

  @Column({ type: 'varchar', length: 255 })
  group_name_th: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  group_name_en: string | null;

  @OneToMany(() => Unit, (unit) => unit.unit_group)
  units: Unit[];
}
