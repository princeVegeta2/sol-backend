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

@Entity('stats')
export class Stat {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'tokens_purchased', type: 'int', default: 0})
    tokens_purchased: number;

    @Column({ name: 'total_entries', type: 'int', default: 0 })
    total_entries: number;

    @Column({ name: 'total_exits', type: 'int', default: 0 })
    total_exits: number;

    @Column({ name: 'current_holdings', type: 'int', default: 0 })
    current_holdings: number;

    @Column({ type: 'numeric', precision: 30, scale: 4, default: 0 })
    total_pnl: number;

    @Column({ type: 'numeric', precision: 30, scale: 4, default: 0 })
    unrealized_pnl: number;

    @Column({ type: 'numeric', precision: 30, scale: 4, default: 0})
    realized_pnl: number;

    @Column({ type: 'numeric', precision: 5, scale: 2, default: 0})
    winrate: number;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;
}
