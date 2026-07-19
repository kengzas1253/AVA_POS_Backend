import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('pos_devices')
export class PosDevice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  device_name: string;

  @Column({ unique: true })
  machine_id: string;

  @Column()
  hostname: string;

  @Column()
  ip_address: string;

  @Column()
  os_platform: string;

  @Column()
  os_release: string;

  @Column()
  app_version: string;

  @Column({ nullable: true })
  printer_name?: string;

  @Column({ nullable: true })
  printer_type?: string;

  @Column({ nullable: true })
  printer_slip?: string;

  @Column({ nullable: true })
  paper_slip_size?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
