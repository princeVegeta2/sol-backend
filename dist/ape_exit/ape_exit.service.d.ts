import { Repository } from "typeorm";
import { ApeExit } from "./ape_exit.entity";
import { User } from "src/user/user.entity";
export declare class ApeExitService {
    private apeExitRepository;
    constructor(apeExitRepository: Repository<ApeExit>);
    createApeExit(apeExitData: {
        user: User;
        mintAddress: string;
        amount: number;
        value_usd: number;
        value_sol: number;
        price: number;
        pnl: number;
    }): Promise<ApeExit>;
    findApeExitsByUserId(userId: number): Promise<ApeExit[]>;
    findApeExitsByUserIdAndMintAddress(userId: number, mintAddress: string): Promise<ApeExit[]>;
    findAllApeExitWinsByUserId(userId: number): Promise<ApeExit[]>;
    findAllApeExitsByMintAddress(mintAddress: string): Promise<ApeExit[]>;
    findAllApeExits(): Promise<ApeExit[]>;
    findAllApeExitsByUserId(userId: number): Promise<ApeExit[]>;
    deleteApeExit(apeExit: ApeExit): Promise<void>;
}
