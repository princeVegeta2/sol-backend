import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SolBalance } from "./sol_balance.entity";
import { User } from "src/user/user.entity";

@Injectable()
export class SolBalanceService {
    constructor(
        @InjectRepository(SolBalance)
        private solBalanceRepository: Repository<SolBalance>,
    ) { }

    formatToTwoDecimals(value: any): number {
        const numericValue = typeof value === 'number' ? value : parseFloat(value);
        if (isNaN(numericValue)) {
            throw new Error(`Invalid value provided: ${value}`);
        }
        return parseFloat(numericValue.toFixed(2));
    }    

    // Create a new balance (called on user creation)
    async createBalance(balanceData: {
        user: User;
        balance: number;
        balance_usd: number;
        total_redeemed: number;
        total_usd_redeemed: number;
        one_redeemable: boolean;
        five_redeemable: boolean;
        last_one_redeemed_at: Date | null;
        last_five_redeemed_at: Date | null;
    }): Promise<SolBalance> {
        const newSolBalance = this.solBalanceRepository.create(balanceData);
        return this.solBalanceRepository.save(newSolBalance);
    }

    // Get balance data by user id
    async getBalanceDataByUserId(userId: number): Promise<SolBalance> {
        return this.solBalanceRepository.findOne({ where: { user: { id: userId } } });
    }

    // Redeem 100$
    async redeemOne(userId: number): Promise<SolBalance> {
        const balance = await this.solBalanceRepository.findOne({ where: { user: { id: userId } } });
    
        if (!balance) {
            throw new BadRequestException("Balance record not found for this user.");
        }
    
        if (!balance.one_redeemable) {
            throw new BadRequestException("You cannot redeem $100 right now. Please wait for the cooldown to expire.");
        }
    
        // Ensure proper numeric conversion
        const currentBalance = typeof balance.balance === 'string' ? parseFloat(balance.balance) : balance.balance;
        const currentTotalRedeemed = typeof balance.total_redeemed === 'string' ? parseFloat(balance.total_redeemed) : balance.total_redeemed;
    
        // Update balance and total redeemed
        balance.balance = this.formatToTwoDecimals(currentBalance + 100);
        balance.total_redeemed = this.formatToTwoDecimals(currentTotalRedeemed + 100);
    
        // Update cooldown flags and timestamps
        balance.one_redeemable = false;
        balance.last_one_redeemed_at = new Date();
    
        return this.solBalanceRepository.save(balance);
    }
    
    // Redeem 1000$
    async redeemFive(userId: number): Promise<SolBalance> {
        const balance = await this.solBalanceRepository.findOne({ where: { user: { id: userId } } });
    
        if (!balance) {
            throw new BadRequestException("Balance record not found for this user.");
        }
    
        if (!balance.five_redeemable) {
            throw new BadRequestException("You cannot redeem $1000 right now. Please wait for the cooldown to expire.");
        }
    
        // Ensure proper numeric conversion
        const currentBalance = typeof balance.balance === 'string' ? parseFloat(balance.balance) : balance.balance;
        const currentTotalRedeemed = typeof balance.total_redeemed === 'string' ? parseFloat(balance.total_redeemed) : balance.total_redeemed;
    
        // Update balance and total redeemed
        balance.balance = this.formatToTwoDecimals(currentBalance + 1000);
        balance.total_redeemed = this.formatToTwoDecimals(currentTotalRedeemed + 1000);
    
        // Update cooldown flags and timestamps
        balance.five_redeemable = false;
        balance.last_five_redeemed_at = new Date();
    
        return this.solBalanceRepository.save(balance);
    }
}