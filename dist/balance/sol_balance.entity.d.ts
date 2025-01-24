import { User } from '../user/user.entity';
export declare class SolBalance {
    id: number;
    user: User;
    balance: number;
    balance_usd: number;
    total_redeemed: number;
    total_usd_redeemed: number;
    one_redeemable: boolean;
    five_redeemable: boolean;
    last_one_redeemed_at: Date | null;
    last_five_redeemed_at: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
