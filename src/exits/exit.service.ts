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
    ) { }

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

    async findExitsByUserId(userId: number): Promise<Exit[]> {
        const query = `
        SELECT * 
        FROM exits 
        WHERE user_id = $1
    `;
        const result = await this.exitRepository.query(query, [userId]);
        return result; // Always return an array
    }

    async findAllExitWinsByUserId(userId: number): Promise<Exit[]> {
        const query = `
        SELECT *
        FROM EXITS
        WHERE user_id = $1
            AND pnl > 0
        `

        const result = await this.exitRepository.query(query, [userId]);
        return result;
    }
}