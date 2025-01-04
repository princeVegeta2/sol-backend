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
        source: string;
        price?: number;
        marketcap?: number;
        liquidity?: number;
        value_usd?: number;
    }): Promise<Entry> {
        const newEntry = this.entryRepository.create(entryData);
        return this.entryRepository.save(newEntry);
    }

}