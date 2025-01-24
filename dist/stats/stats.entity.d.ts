import { User } from '../user/user.entity';
export declare class Stat {
    id: number;
    user: User;
    tokens_purchased: number;
    total_entries: number;
    total_exits: number;
    current_holdings: number;
    total_pnl: number;
    unrealized_pnl: number;
    realized_pnl: number;
    winrate: number;
    createdAt: Date;
    updatedAt: Date;
}
