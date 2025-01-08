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
    ) {}

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

}