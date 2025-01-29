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

    async updateStatOnEntry(stat: Stat, newHolding: boolean, uniqueUserToken: boolean): Promise<Stat> {

        // increment total_entries
        stat.total_entries += 1;

        // if we discovered user never had that mint => tokens_purchased++
        if (uniqueUserToken) {
            stat.tokens_purchased += 1;
        }

        // if new holding => current_holdings++
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
        // just handle realized stuff:
        stat.total_exits += 1;
        const userWinrate = parseFloat(((totalWins / stat.total_exits) * 100).toFixed(2));
        stat.winrate = userWinrate;

        // add realized
        const oldRealized = parseFloat(stat.realized_pnl.toString());
        stat.realized_pnl = oldRealized + exitPnl;

        // add total_pnl
        const oldTotal = parseFloat(stat.total_pnl.toString());
        stat.total_pnl = oldTotal + exitPnl; // not subtracting from unrealized
        // if you want to keep old logic about removing from unrealized, omit it
        // because we'll recalc with updateHoldingsPrice anyway

        if (holdingDeleted) {
            stat.current_holdings -= 1;
        }

        return this.statRepository.save(stat);
    }

    async updateStatOnHoldingUpdate(stat: Stat, newUnrealizedPnl: number): Promise<Stat> {
        const newUnrealizedPnlFormatted = parseFloat(newUnrealizedPnl.toString());
        const oldRealizedPnl = parseFloat(stat.realized_pnl.toString());
        const newTotalPnl = oldRealizedPnl + newUnrealizedPnlFormatted;

        stat.unrealized_pnl = newUnrealizedPnlFormatted;
        stat.total_pnl = newTotalPnl;

        return await this.statRepository.save(stat);
    }

    async reduceStatRealizedPnl(stat: Stat, reduceBy: number): Promise<Stat> {
        const reduceByFormatted = parseFloat(reduceBy.toString());
        const oldRealizedPnl = parseFloat(stat.realized_pnl.toString());
        const oldUnrealizedPnl = parseFloat(stat.unrealized_pnl.toString());
        const newRealizedPnl = oldRealizedPnl - reduceByFormatted;
        const newTotalPnl = oldUnrealizedPnl + newRealizedPnl;
        stat.realized_pnl = newRealizedPnl;
        stat.total_pnl = newRealizedPnl;

        return await this.statRepository.save(stat);
    }

    async updateStatOnHoldingDelete(stat: Stat, holdingPnl): Promise<Stat> {
        const holdingPnlFormatted = parseFloat(holdingPnl.toString());
        const oldUnrealizedPnl = parseFloat(stat.unrealized_pnl.toString());
        const oldRealizedPnl = parseFloat(stat.realized_pnl.toString());
        const newUnrealizedPnl = oldUnrealizedPnl - holdingPnlFormatted;
        const newTotalPnl = oldRealizedPnl + holdingPnlFormatted;
        const oldTotalHoldings = stat.current_holdings;
        const newTotalHoldings = oldTotalHoldings - 1;

        stat.unrealized_pnl = newUnrealizedPnl;
        stat.total_pnl = newTotalPnl;
        stat.current_holdings = newTotalHoldings;

        return await this.statRepository.save(stat);
    }

    async findAllStats(): Promise<Stat[]> {
        return this.statRepository.find();
    }

    async deleteStat(stat: Stat): Promise<void> {
        await this.statRepository.remove(stat);
    }
}