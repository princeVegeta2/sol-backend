import { Repository } from "typeorm";
import { ApeHolding } from "./ape_holding.entity";
import { User } from "src/user/user.entity";
export declare class ApeHoldingService {
    private apeHoldingRepository;
    constructor(apeHoldingRepository: Repository<ApeHolding>);
    createApeHolding(apeHoldingData: {
        user: User;
        mintAddress: string;
        amount: number;
        price: number;
        average_price: number;
        value_usd: number;
        value_sol: number;
        pnl: number;
    }): Promise<ApeHolding>;
    findApeHoldingsByUserId(userId: number): Promise<ApeHolding[] | null>;
    findApeHoldingByUserIdAndMintAddress(userId: number, mintAddress: string): Promise<ApeHolding | null>;
    updateApeHoldingEntry(holding: ApeHolding, amount: number, price: number, newUsdValue: number | string, newSolValue: number | string, additionalUsdValue: number | string, additionalSolValue: number | string): Promise<ApeHolding>;
    updateApeHoldingExit(holding: ApeHolding, amount: number, oldUsdValue: number, oldSolValue: number, subtractedUsdValue: number, subtractedSolValue: number): Promise<ApeHolding>;
    updateApeHoldingPrice(holding: ApeHolding, price: number, solPrice: number): Promise<ApeHolding>;
    updateApeHoldingPnl(holding: ApeHolding, newMarketPrice: number): Promise<ApeHolding>;
    deleteApeHolding(holding: ApeHolding): Promise<void>;
    calculateApeHoldingsValueByUserId(userId: number): Promise<{
        apeHoldingsSolValue: number;
        apeHoldingsUsdValue: number;
    }>;
}
