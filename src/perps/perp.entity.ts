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

@Entity('perps')
export class Perp {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User) // Many entries can belong to one user
    @JoinColumn({ name: 'user_id' }) // Maps the foreign key column to the user table
    user: User;

    @Column({ type: 'varchar', length: 10 })
    side: string;

    @Column({ type: 'numeric', precision: 6, scale: 2, nullable: false })
    leverage: number;

    @Column({ type: 'numeric', precision: 30, scale: 6, nullable: false })
    amount: number;

    @Column({ type: 'numeric', precision: 15, scale: 15, nullable: false })
    price: number;

    @Column({ type: 'numeric', precision: 30, scale: 4, nullable: false })
    value_usd: number;

    @Column({ type: 'numeric', precision: 15, scale: 15, nullable: false })
    entry_price: number;

    @Column({ type: 'numeric', precision: 15, scale: 15, nullable: false })
    exit_price: number;

    @Column({ name: 'quantity', type: 'numeric', precision: 30, scale: 18, nullable: false})
    quantity: number;

    @Column({ type: 'numeric', precision: 15, scale: 15, nullable: false })
    liquidation_price: number;

    @Column({ type: 'numeric', precision: 30, scale: 4, nullable: false, default: 0 })
    pnl: number;

    @Column({ type: 'boolean', nullable: false, default: false })
    is_closed: boolean;

    @Column({ type: 'numeric', precision: 15, scale: 15, nullable: true })
    stop_loss?: number | null;

    @Column({ type: 'numeric', precision: 15, scale: 15, nullable: true })
    take_profit?: number | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;

    @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
    closedAt?: Date | null;
}