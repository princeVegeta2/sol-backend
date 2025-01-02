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
        value_usd: number;
    }): Promise<Holding> {
        const newHolding = this.holdingRepository.create(holdingData);
        return this.holdingRepository.save(newHolding);
    }

    async findHoldingByUserIdAndMintAddress(userId: number, mintAddress: string): Promise<Holding> {
        const user = await this.userService.findUserById(userId);

        if (!user) {
            throw new Error("User not found");
        }

        return this.holdingRepository.findOne({
            where: {
                user: user,
                mintAddress,
            },
        });
    }
}