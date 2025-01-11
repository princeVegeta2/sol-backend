import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Exit } from "./exit.entity";
import { User } from "src/user/user.entity";

@Injectable()
export class ExitService {
    constructor(
        @InjectRepository(Exit)
        private exitRepository: Repository<Exit>,
    ){}

    async createExit(exitData:
        {
            user: User;
            mintAddress: string;
            amount: number;
            value_usd: number;
            value_sol: number;
            price: number;
            marketcap: number;
            liquidity: number;
            pnl: number;
        }): Promise<Exit> {
        const newExit = this.exitRepository.create(exitData);
        return this.exitRepository.save(newExit);
    }
}