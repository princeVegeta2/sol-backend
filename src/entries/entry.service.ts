import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Entry } from "./entry.entity";
import { User } from "src/user/user.entity";

@Injectable()
export class EntryService {
    constructor(
        @InjectRepository(Entry)
        private entryRepository: Repository<Entry>,
    ) { }

    async createEntry(entryData: {
        user: User;
        mintAddress: string;
        amount: number;
        value_usd: number;
        value_sol: number;
        price: number;
        marketcap: number;
        liquidity: number;
        source: string;
    }): Promise<Entry> {
        const newEntry = this.entryRepository.create(entryData);
        return this.entryRepository.save(newEntry);
    }

    async findEntriesByUserIdAndMintAddress(userId: number, mintAddress: string): Promise<Entry[]> {
        const query = `
            SELECT * 
            FROM entries 
            WHERE user_id = $1 AND mint_address = $2
        `;
        const result = await this.entryRepository.query(query, [userId, mintAddress]);
        return result; // Always return an array
    }

    async findAllEntriesByUserId(userId: number): Promise<Entry[]> {
        const query = `
            SELECT *
            FROM entries
            WHERE user_id = $1
        `;
        const result = await this.entryRepository.query(query, [userId]);
        return result;
    }

    async findAllEntries(): Promise<Entry[]> {
        return this.entryRepository.find();
    }

    async findAllEntriesByMintAddress(mintAddress: string): Promise<Entry[]> {
        const query = `
            SELECT *
            FROM entries
            WHERE mint_address = $1
        `;
        const result = await this.entryRepository.query(query, [mintAddress]);
        return result;
    }

    async deleteEntry(entry: Entry): Promise<void> {
        await this.entryRepository.remove(entry);
    }
}