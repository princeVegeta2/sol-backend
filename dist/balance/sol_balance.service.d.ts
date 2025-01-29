import { Repository } from "typeorm";
import { SolBalance } from "./sol_balance.entity";
import { User } from "src/user/user.entity";
export declare class SolBalanceService {
    private solBalanceRepository;
    constructor(solBalanceRepository: Repository<SolBalance>);
    formatToTwoDecimals(value: any): number;
    createBalance(balanceData: {
        user: User;
        balance: number;
        balance_usd: number;
        total_redeemed: number;
        total_usd_redeemed: number;
        one_redeemable: boolean;
        five_redeemable: boolean;
        last_one_redeemed_at: Date | null;
        last_five_redeemed_at: Date | null;
    }): Promise<SolBalance>;
    getBalanceDataByUserId(userId: number, solPrice: number): Promise<SolBalance>;
    getRedeemingStatus(userId: number): Promise<any>;
    redeemOne(userId: number, solPrice: number): Promise<SolBalance>;
    redeemFive(userId: number, solPrice: number): Promise<SolBalance>;
    updateBalanceSubtract(balance: SolBalance, amount: number, solPrice: number): Promise<SolBalance>;
    updateBalanceAdd(balance: SolBalance, amount: number | string, usdValue: number | string): Promise<SolBalance>;
    updateUsdBalance(balance: SolBalance, solPrice: number): Promise<SolBalance>;
    findAllBalances(): Promise<SolBalance[]>;
    findBalanceByUserId(userId: number): Promise<SolBalance>;
    deleteBalance(solBalance: SolBalance): Promise<void>;
}
