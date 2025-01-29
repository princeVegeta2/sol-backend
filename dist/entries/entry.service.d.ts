import { Repository } from "typeorm";
import { Entry } from "./entry.entity";
import { User } from "src/user/user.entity";
export declare class EntryService {
    private entryRepository;
    constructor(entryRepository: Repository<Entry>);
    createEntry(entryData: {
        user: User;
        mintAddress: string;
        amount: number;
        value_usd: number;
        value_sol: number;
        price: number;
        marketcap: number;
        liquidity: number;
        source: string;
    }): Promise<Entry>;
    findEntriesByUserIdAndMintAddress(userId: number, mintAddress: string): Promise<Entry[]>;
    findAllEntriesByUserId(userId: number): Promise<Entry[]>;
    findAllEntries(): Promise<Entry[]>;
    findAllEntriesByMintAddress(mintAddress: string): Promise<Entry[]>;
    deleteEntry(entry: Entry): Promise<void>;
}
