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
    ){}

    async createEntry(user: User, mintAddress: string, amount: number, price?: number, marketcap?: number, liquidity?: number): Promise<Entry> {
        const newEntry = this.entryRepository.create({
            user,
            mintAddress,
            amount,
            price,
            marketcap,
            liquidity
        });
        return this.entryRepository.save(newEntry);
    }
}