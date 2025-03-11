import { User } from 'src/user/user.entity';
export declare class ApeExit {
    id: number;
    user: User;
    mintAddress: string;
    amount: number;
    value_usd: number;
    value_sol: number;
    price: number;
    pnl: number;
    createdAt: Date;
    updatedAt: Date;
}
