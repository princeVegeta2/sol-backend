import { Injectable, BadRequestException, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Stat } from "./stats.entity";
import { Repository } from "typeorm";
import { User } from "src/user/user.entity";

@Injectable()
export class StatService {
    constructor(
        @InjectRepository(Stat)
        private statRepository: Repository<Stat>,
    ) { }

    async createStat(statData: {
        user: User,
        tokens_purchased: number,
        total_entries: number,
        total_exits: number,
        current_holdings: number,
        total_pnl: number,
        unrealized_pnl: number,
        realized_pnl: number,
        winrate: number
    }): Promise<Stat> {
        const newStat = this.statRepository.create(statData);
        return this.statRepository.save(newStat);
    }

    async findStatByUserId(userId: number): Promise<Stat> {
        return this.statRepository.findOne({ where: { user: { id: userId } } });
    }

    async updateStatOnEntry(stat: Stat, newHoldingPnl: number, newHolding: boolean, uniqueUserToken: boolean): Promise<Stat> {

        // Convert stat.total_pnl to a float. Also ensure newHoldingPnl is a float.
        const currentTotalPnl = parseFloat(stat.total_pnl.toString());
        const additionalPnl = parseFloat(newHoldingPnl.toString());

        stat.total_pnl = currentTotalPnl + additionalPnl;
        stat.total_entries += 1;
        if (uniqueUserToken) {
            stat.tokens_purchased += 1;
        }

        const currentUnrealized = parseFloat(stat.unrealized_pnl.toString());
        stat.unrealized_pnl = currentUnrealized + additionalPnl;
        if (newHolding) {
            stat.current_holdings += 1;
        }

        return this.statRepository.save(stat);
    }

    async updateStatOnExit(
        stat: Stat,
        totalWins: number,
        exitPnl: number,
        holdingDeleted: boolean
    ): Promise<Stat> {
        // Calculate winrate
        const totalExits = stat.total_exits += 1;
        const userWinrate = parseFloat(((totalWins / totalExits) * 100).toFixed(2));

        const oldTotalPnl = parseFloat(stat.total_pnl.toString());
        const newExitPnl = parseFloat(exitPnl.toString());
        stat.total_pnl = oldTotalPnl + newExitPnl;
        const oldRealizedPnl = parseFloat(stat.realized_pnl.toString());
        stat.realized_pnl = oldRealizedPnl + newExitPnl;
        if (holdingDeleted) {
            stat.current_holdings -= 1;
        }
        stat.winrate = userWinrate;

        return this.statRepository.save(stat);
    }
}