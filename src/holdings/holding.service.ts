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
        private userService : UserService,
    ) {}

    async createHolding(holdingData: {
        user: User;
        mintAddress: string;
        amount: number;
        price: number;
        marketcap: number;
        liquidity: number;
        value_usd: number;
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
    

    async updateHoldingEntry(holding: Holding, amount: number): Promise<Holding> {
        holding.amount = holding.amount + amount;
        holding.value_usd = holding.price * holding.amount;
        return this.holdingRepository.save(holding);
    }

    async updateHoldingExit(holding: Holding, amount: number): Promise<Holding> {
        holding.amount = holding.amount - amount;
        holding.value_usd = holding.price * holding.amount;
        return this.holdingRepository.save(holding);
    }

    async updateHoldingPnl(holding: Holding, currentPrice: number): Promise<Holding> {
        const entryValue = holding.amount * holding.price;
        const currentValue = holding.amount * currentPrice;
        const pnl = currentValue - entryValue;
        holding.pnl = pnl;
        return this.holdingRepository.save(holding);
    }

    async updateHoldingPrice(holding: Holding, price: number): Promise<Holding> {
        holding.price = price;
        holding.value_usd = holding.amount * price;
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