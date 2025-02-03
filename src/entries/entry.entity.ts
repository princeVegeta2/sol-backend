import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity('entries') // Map this class to the 'entries' table
export class Entry {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User) // Many entries can belong to one user
  @JoinColumn({ name: 'user_id' }) // Maps the foreign key column to the user table
  user: User;

  @Column({ name: 'mint_address', type: 'varchar', length: 255 })
  mintAddress: string;

  @Column({ type: 'numeric', precision: 30, scale: 6, nullable: false })
  amount: number;

  @Column({ type: 'numeric', precision: 30, scale: 4, default: 0 })
  value_usd: number;

  @Column({ type: 'numeric', precision: 30, scale: 4, default: 0 })
  value_sol: number;

  @Column({ type: 'numeric', precision: 30, scale: 12, default: 0 })
  price: number;

  @Column({ type: 'numeric', precision: 32, scale: 4, nullable: true })
  marketcap: number;

  @Column({ type: 'numeric', precision: 32, scale: 4, nullable: true })
  liquidity: number;

  @Column({ name: 'source', type: 'varchar', length: 255 })
  source: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
