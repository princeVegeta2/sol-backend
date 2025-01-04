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
}