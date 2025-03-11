import { Repository } from "typeorm";
import { ApeEntry } from "./ape_entry.entity";
import { User } from "src/user/user.entity";
export declare class ApeEntryService {
    private apeEntryRepository;
    constructor(apeEntryRepository: Repository<ApeEntry>);
    createApeEntry(apeEntryData: {
        user: User;
        mintAddress: string;
        amount: number;
        value_usd: number;
        value_sol: number;
        price: number;
    }): Promise<ApeEntry>;
    findApeEntriesByUserIdAndMintAddress(userId: number, mintAddress: string): Promise<ApeEntry[]>;
    findAllApeEntriesByUserId(userId: number): Promise<ApeEntry[]>;
    findAllApeEntries(): Promise<ApeEntry[]>;
    findAllApeEntriesByMintAddress(mintAdress: string): Promise<ApeEntry[]>;
    findAllApeEntriesByUserIdAndMintAddress(userId: number, mintAddress: string): Promise<ApeEntry[]>;
    deleteApeEntry(apeEntry: ApeEntry): Promise<void>;
}
