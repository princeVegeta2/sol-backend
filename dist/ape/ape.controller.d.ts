import { ApeService } from "./ape.service";
import { CreateApeEntryDto } from "src/ape_entry/ape_entry.dto";
import { CreateApeExitDto } from "src/ape_exit/ape_exit.dto";
export declare class ApeController {
    private readonly apeService;
    constructor(apeService: ApeService);
    createApeEntry(req: any, createApeEntryDto: CreateApeEntryDto): Promise<{
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
    createApeExit(req: any, createApeExitDto: CreateApeExitDto): Promise<{
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
    updateApeHoldings(req: any): Promise<any[] | {
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
}
