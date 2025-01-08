import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Holding } from "./holding.entity";
import { User } from "src/user/user.entity";
import { UserService } from "src/user/user.service";

@Injectable()
export class HoldingService {
    constructor(
        @InjectRepository(Holding)
        private holdingRepository: Repository<Holding>,
        private userService: UserService,
    ) { }

    async createHolding(holdingData: {
        user: User;
        mintAddress: string;
        amount: number;
        price: number;
        value_usd: number;
        value_sol: number;
        pnl: number;
    }): Promise<Holding> {
        const newHolding = this.holdingRepository.create(holdingData);
        return this.holdingRepository.save(newHolding);
    }

    async findHoldingByUserIdAndMintAddress(userId: number, mintAddress: string): Promise<Holding | null> {
        const query = `
            SELECT * 
            FROM holdings 
            WHERE user_id = $1 AND mint_address = $2
        `;
        const result = await this.holdingRepository.query(query, [userId, mintAddress]);
        return result[0] || null;
    }


    async updateHoldingEntry(holding: Holding, amount: number, newUsdValue: number, newSolValue: number,
        additionalUsdValue: number, additionalSolValue: number
    ): Promise<Holding> {
        const holdingAmount = parseFloat(holding.amount.toString()); // Ensure holding.amount is a number
        const additionalAmount = parseFloat(amount.toString()); // Ensure amount is a number

        holding.amount = parseFloat((holdingAmount + additionalAmount).toFixed(6)); // Add precise tokens
        holding.value_usd = newUsdValue + additionalUsdValue; // Update USD value
        holding.value_sol = newSolValue + additionalSolValue;
        return this.holdingRepository.save(holding);
    }

    async updateHoldingExit(holding: Holding, amount: number, newUsdValue: number, newSolValue: number,
        subtractedUsdValue: number, subtractedSolValue: number
    ): Promise<Holding> {
        const holdingAmount = parseFloat(holding.amount.toString()); // Ensure holding.amount is a number
        const exitAmount = parseFloat(amount.toString()); // Ensure amount is a number
        const newHoldingValueUsd = newUsdValue - subtractedUsdValue;
        const newHoldingValueSol = newSolValue - subtractedSolValue;

        if (newHoldingValueUsd <= 0 || newHoldingValueSol <= 0) {
            await this.deleteHolding(holding);
        } 

        holding.amount = parseFloat((holdingAmount - exitAmount).toFixed(6)); // Subtract precise tokens
        holding.value_usd = newUsdValue - subtractedUsdValue; // Update USD value
        holding.value_sol = newSolValue - subtractedSolValue;
        return this.holdingRepository.save(holding);
    }


    async updateHoldingPnl(holding: Holding, newUsdValue: number): Promise<Holding> {
        const entryValue = holding.value_usd;
        const pnl = newUsdValue - entryValue;
        holding.pnl = pnl;
        return this.holdingRepository.save(holding);
    }

    async updateHoldingPrice(holding: Holding, price: number, newUsdValue: number, newSolValue: number): Promise<Holding> {
        holding.price = price;
        holding.value_usd = newUsdValue;
        holding.value_sol = newSolValue;
        // Pnl updated in crypto.service.ts
        return this.holdingRepository.save(holding);
    }

    async deleteHolding(holding: Holding): Promise<void> {
        await this.holdingRepository.remove(holding);
    }

    async findAllUserHoldingsByUserId(userId: number): Promise<Holding[]> {
        return this.holdingRepository
            .createQueryBuilder('holding')
            .where('holding.user_id = :userId', { userId })
            .getMany();
    }
}