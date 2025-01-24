import { Stat } from "./stats.entity";
import { Repository } from "typeorm";
import { User } from "src/user/user.entity";
export declare class StatService {
    private statRepository;
    constructor(statRepository: Repository<Stat>);
    createStat(statData: {
        user: User;
        tokens_purchased: number;
        total_entries: number;
        total_exits: number;
        current_holdings: number;
        total_pnl: number;
        unrealized_pnl: number;
        realized_pnl: number;
        winrate: number;
    }): Promise<Stat>;
    findStatByUserId(userId: number): Promise<Stat>;
    updateStatOnEntry(stat: Stat, newHolding: boolean, uniqueUserToken: boolean): Promise<Stat>;
    updateStatOnExit(stat: Stat, totalWins: number, exitPnl: number, holdingDeleted: boolean): Promise<Stat>;
    updateStatOnHoldingUpdate(stat: Stat, newUnrealizedPnl: number): Promise<Stat>;
    updateStatOnHoldingDelete(stat: Stat, holdingPnl: any): Promise<Stat>;
}
