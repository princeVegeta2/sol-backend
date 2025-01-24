import { Repository } from "typeorm";
import { Holding } from "./holding.entity";
import { User } from "src/user/user.entity";
import { UserService } from "src/user/user.service";
export declare class HoldingService {
    private holdingRepository;
    private userService;
    constructor(holdingRepository: Repository<Holding>, userService: UserService);
    createHolding(holdingData: {
        user: User;
        mintAddress: string;
        amount: number;
        price: number;
        average_price: number;
        value_usd: number;
        value_sol: number;
        pnl: number;
    }): Promise<Holding>;
    findHoldingByUserIdAndMintAddress(userId: number, mintAddress: string): Promise<Holding | null>;
    updateHoldingEntry(holding: Holding, amount: number, price: number, newUsdValue: number | string, newSolValue: number | string, additionalUsdValue: number | string, additionalSolValue: number | string): Promise<Holding>;
    updateHoldingExit(holding: Holding, amount: number, oldUsdValue: number, oldSolValue: number, subtractedUsdValue: number, subtractedSolValue: number): Promise<Holding>;
    updateHoldingPnl(holding: Holding, newMarketPrice: number): Promise<Holding>;
    updateHoldingPrice(holding: Holding, price: number, solPrice: number): Promise<Holding>;
    deleteHolding(holding: Holding): Promise<void>;
    findAllUserHoldingsByUserId(userId: number): Promise<Holding[]>;
}
