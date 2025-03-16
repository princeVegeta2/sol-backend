import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApeExit } from "./ape_exit.entity";
import { User } from "src/user/user.entity";

@Injectable()
export class ApeExitService {
    constructor(
        @InjectRepository(ApeExit)
        private apeExitRepository: Repository<ApeExit>,
    ) {}

    async createApeExit(apeExitData: {
        user: User,
        mintAddress: string,
        amount: number,
        value_usd: number,
        value_sol: number,
        price: number,
        pnl: number,
    }): Promise<ApeExit> {
        const newApeExit = await this.apeExitRepository.create(apeExitData);
        return this.apeExitRepository.save(newApeExit);
    }

    async findApeExitsByUserId(userId: number): Promise<ApeExit[]> {
        const query = `
            SELECT *
            FROM ape_exits
            WHERE user_id = $1
        `;
        const result = await this.apeExitRepository.query(query, [userId]);
        return result;
    }

    async findApeExitsByUserIdAndMintAddress(userId: number, mintAddress: string): Promise<ApeExit[]> {
        const query = `
            SELECT *
            FROM ape_exits
            WHERE user_id = $1
                AND mint_address = $2
        `;
        const result = await this.apeExitRepository.query(query, [userId, mintAddress]);
        return result;
    }

    async findAllApeExitWinsByUserId(userId: number): Promise<ApeExit[]> {
        const query = `
            SELECT *
            FROM ape_exits
            WHERE user_id = $1
             AND pnl > 0
        `
        const result = await this.apeExitRepository.query(query, [userId]);
        return result;
    }

    async findAllApeExitsByMintAddress(mintAddress: string): Promise<ApeExit[]> {
        const query = `
            SELECT *
            FROM ape_exits
            WHERE mint_address = $1
        `;
        
        const result = await this.apeExitRepository.query(query, [mintAddress]);
        return result;
    }

    async findAllApeExits(): Promise<ApeExit[]> {
        return this.apeExitRepository.find();
    }

    async findAllApeExitsByUserId(userId: number): Promise<ApeExit[]> {
        const exits = await this.apeExitRepository.find({
            where: { user: { id: userId } },
            // you can also specify relations if needed: relations: ['user'],
          });
        
        return exits;
    }

    async deleteApeExit(apeExit: ApeExit): Promise<void> {
        await this.apeExitRepository.remove(apeExit);
    }
}