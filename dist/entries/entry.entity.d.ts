import { User } from '../user/user.entity';
export declare class Entry {
    id: number;
    user: User;
    mintAddress: string;
    amount: number;
    value_usd: number;
    value_sol: number;
    price: number;
    marketcap: number;
    liquidity: number;
    source: string;
    createdAt: Date;
    updatedAt: Date;
}
