import { randomUUID } from 'crypto';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryColumn('uuid')
  user_id: string;

  @Column({ unique: true })
  username: string;

  @Column({ type: 'text' })
  password_hash: string;

  @Column()
  full_name: string;

  @Column({ nullable: true })
  phone_number?: string;

  @Column({ default: 'cashier' })
  role: string;

  @Column({ type: 'text', nullable: true })
  pin_code?: string;

  @Column({ type: 'text', nullable: true, unique: true })
  pin_lookup_hash?: string;

  @Column({ default: true, nullable: true })
  is_active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_login_at?: Date;

  @Column({ type: 'text', nullable: true, select: false })
  refresh_token_hash?: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @BeforeInsert()
  setUserId() {
    if (!this.user_id) {
      this.user_id = randomUUID();
    }
  }
}
