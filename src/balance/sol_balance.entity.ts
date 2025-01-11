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

@Entity('sol_balance')
export class SolBalance {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User) // Many balances can belong to one user
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'numeric', precision: 30, scale: 4, default: 0 })
    balance: number;

    @Column({ type: 'numeric', precision: 30, scale: 4, default: 0 })
    balance_usd: number;

    @Column({ type: 'numeric', precision: 30, scale: 4, default: 0 })
    total_redeemed: number;

    @Column({ type: 'numeric', precision: 30, scale: 4, default: 0 })
    total_usd_redeemed: number;

    @Column({ type: 'boolean', default: true })
    one_redeemable: boolean;

    @Column({ type: 'boolean', default: true })
    five_redeemable: boolean;

    @Column({ name: 'last_one_redeemed_at', type: 'timestamptz', nullable: true })
    last_one_redeemed_at: Date | null;

    @Column({ name: 'last_five_redeemed_at', type: 'timestamptz', nullable: true })
    last_five_redeemed_at: Date | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;
}
