import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApeEntry } from "./ape_entry.entity";
import { User } from "src/user/user.entity";

@Injectable()
export class ApeEntryService {
    constructor(
        @InjectRepository(ApeEntry)
        private apeEntryRepository: Repository<ApeEntry>,
    ){}

    async createApeEntry(apeEntryData: {
        user: User,
        mintAddress: string,
        amount: number,
        value_usd: number,
        value_sol: number,
        price: number,
    }): Promise<ApeEntry> {
        const newApeEntry = this.apeEntryRepository.create(apeEntryData);
        return this.apeEntryRepository.save(newApeEntry);
    }

    async findApeEntriesByUserIdAndMintAddress(userId: number, mintAddress: string): Promise<ApeEntry[]> {
        const query = `
            SELECT * 
            FROM ape_entries 
            WHERE user_id = $1 AND mint_address = $2
        `;

        const result = await this.apeEntryRepository.query(query, [userId, mintAddress]);
        return result; // Always return an array
    }

    async findAllApeEntriesByUserId(userId: number): Promise<ApeEntry[]> {
        const entries = await this.apeEntryRepository.find({
            where: { user: { id: userId } },
            // you can also specify relations if needed: relations: ['user'],
          });
        
        return entries;
    }

    async findAllApeEntries(): Promise<ApeEntry[]> {
        return this.apeEntryRepository.find();
    }

    async findAllApeEntriesByMintAddress(mintAdress: string): Promise<ApeEntry[]> {
        const query = `
            SELECT * 
            FROM ape_entries
            WHERE mint_address = $1
        `;
        const result = await this.apeEntryRepository.query(query, [mintAdress]);
        return result;
    }

    async findAllApeEntriesByUserIdAndMintAddress(userId: number, mintAddress: string): Promise<ApeEntry[]> {
        const query = `
            SELECT *
            FROM ape_entries
            WHERE user_id = $1 AND mint_address = $2
        `;
        const result = await this.apeEntryRepository.query(query, [userId, mintAddress]);
        return result;
    }

    async deleteApeEntry(apeEntry: ApeEntry): Promise<void> {
        await this.apeEntryRepository.remove(apeEntry);
    }
}