import { Repository } from "typeorm";
import { Exit } from "./exit.entity";
import { User } from "src/user/user.entity";
export declare class ExitService {
    private exitRepository;
    constructor(exitRepository: Repository<Exit>);
    createExit(exitData: {
        user: User;
        mintAddress: string;
        amount: number;
        value_usd: number;
        value_sol: number;
        price: number;
        marketcap: number;
        liquidity: number;
        pnl: number;
    }): Promise<Exit>;
    findExitsByUserId(userId: number): Promise<Exit[]>;
    findExitsByUserIdAndMintAddress(userId: number, mintAddress: string): Promise<Exit[]>;
    findAllExitWinsByUserId(userId: number): Promise<Exit[]>;
    findAllExitsByMintAddress(mintAddress: string): Promise<Exit[]>;
    findAllExits(): Promise<Exit[]>;
    deleteExit(exit: Exit): Promise<void>;
}
