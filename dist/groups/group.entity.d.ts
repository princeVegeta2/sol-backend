import { User } from '../user/user.entity';
export declare class Group {
    id: number;
    user: User;
    name: string;
    value_usd: number;
    value_sol: number;
    pnl: number;
    createdAt: Date;
    updatedAt: Date;
}
