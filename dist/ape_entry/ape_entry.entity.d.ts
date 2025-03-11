import { User } from 'src/user/user.entity';
export declare class ApeEntry {
    id: number;
    user: User;
    mintAddress: string;
    amount: number;
    value_usd: number;
    value_sol: number;
    price: number;
    createdAt: Date;
    updatedAt: Date;
}
