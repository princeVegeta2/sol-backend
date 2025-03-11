import { User } from '../user/user.entity';
export declare class ApeHolding {
    id: number;
    user: User;
    mintAddress: string;
    amount: number;
    price: number;
    average_price: number;
    value_usd: number;
    value_sol: number;
    pnl: number;
    createdAt: Date;
    updatedAt: Date;
}
