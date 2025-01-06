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

@Entity('usd_balance')
export class UsdBalance {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User) // Many balances can belong to one user
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'numeric', precision: 30, scale: 2, default: 0 })
    balance: number;

    @Column({ type: 'numeric', precision: 30, scale: 2, default: 0 })
    total_redeemed: number;

    @Column({ type: 'boolean', default: true })
    hundred_redeemable: boolean;

    @Column({ type: 'boolean', default: true })
    thousand_redeemable: boolean;

    @Column({ name: 'last_hundred_redeemed_at', type: 'timestamptz', nullable: true })
    last_hundred_redeemed_at: Date | null;

    @Column({ name: 'last_thousand_redeemed_at', type: 'timestamptz', nullable: true })
    last_thousand_redeemed_at: Date | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;
}
