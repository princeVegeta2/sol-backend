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
            price?: number;
            marketcap?: number;
            liquidity?: number;
            value_usd?: number;
        }): Promise<Exit> {
        const newExit = this.exitRepository.create(exitData);
        return this.exitRepository.save(newExit);
    }
}