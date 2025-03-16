import { CreateApeExitDto } from './../ape_exit/ape_exit.dto';
import { TokenMetadataService } from './../metadata/token_metadata.service';
import { SolBalanceService } from "src/balance/sol_balance.service";
import { UserService } from "src/user/user.service";
import { SolanaService } from "src/solana/solana.service";
import { ApeHoldingService } from "src/ape_holdings/ape_holding.service";
import { ApeEntryService } from "src/ape_entry/ape_entry.service";
import { ApeExitService } from "src/ape_exit/ape_exit.service";
import { StatService } from "src/stats/stats.service";
import { CreateApeEntryDto } from "src/ape_entry/ape_entry.dto";
export declare class ApeService {
    private readonly solBalanceService;
    private readonly userService;
    private readonly solanaService;
    private readonly apeHoldingService;
    private readonly apeEntryService;
    private readonly apeExitService;
    private readonly statService;
    private readonly tokenMetadataService;
    private readonly solMint;
    constructor(solBalanceService: SolBalanceService, userService: UserService, solanaService: SolanaService, apeHoldingService: ApeHoldingService, apeEntryService: ApeEntryService, apeExitService: ApeExitService, statService: StatService, tokenMetadataService: TokenMetadataService);
    createApeEntry(userId: number, createApeEntryDto: CreateApeEntryDto): Promise<{
        id: number;
        solBalance: number;
        usdBalance: number;
        mintAddress: string;
        amount: number;
        value_usd: number;
        value_sol: number;
        inValueUsd: any;
        pnl: number;
        price: number;
        name: any;
        ticker: any;
        image: any;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createApeExit(userId: number, createApeExitDto: CreateApeExitDto): Promise<{
        exit: {
            id: number;
            mintAddress: string;
            amount: number;
            value_usd: number;
            value_sol: number;
            price: number;
            pnl: number;
            createdAt: Date;
            updatedAt: Date;
        };
        updatedHolding: {
            id: number;
            mintAddress: string;
            amount: number;
            price: number;
            average_price: number;
            value_usd: number;
            value_sol: number;
            pnl: number;
            createdAt: Date;
            updatedAt: Date;
        };
        stats: {
            totalExits: number;
            currentHoldings: number;
            totalPnl: number;
            realizedPnl: number;
            winrate: number;
            createdAt: Date;
            updatedAt: Date;
        };
        metadata: {
            name: string;
            image: string;
        };
        newBalance: number;
        newBalanceUsd: number;
    }>;
    updateApeHoldingsPrice(userId: number): Promise<{
        holdings: {
            name: string;
            ticker: string;
            image: string;
            mintAddress: string;
            amount: number;
            price: number;
            average_price: number;
            value_usd: number;
            value_sol: number;
            pnl: number;
            createdAt: Date;
            updatedAt: Date;
        }[];
        errors: {
            mintAddress: string;
            message: string;
        }[];
    }>;
    getAllUserApeHoldings(userId: number): Promise<{
        name: string;
        ticker: string;
        image: string;
        mintAddress: string;
        amount: number;
        price: number;
        average_price: number;
        value_usd: number;
        value_sol: number;
        pnl: number;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getUserApeHistory(userId: number): Promise<{
        entries: {
            mintAddress: string;
            amount: number;
            value_usd: number;
            value_sol: number;
            price: number;
            createdAt: Date;
            updatedAt: Date;
        }[];
        exits: {
            mintAddress: string;
            amount: number;
            value_usd: number;
            value_sol: number;
            price: number;
            createdAt: Date;
            updatedAt: Date;
        }[];
    }>;
}
