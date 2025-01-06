import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UsdBalance } from "./usd_balance.entity";
import { User } from "src/user/user.entity";

@Injectable()
export class UsdBalanceService {
    constructor(
        @InjectRepository(UsdBalance)
        private usdBalanceRepository: Repository<UsdBalance>,
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
        total_redeemed: number;
        hundred_redeemable: boolean;
        thousand_redeemable: boolean;
        last_hundred_redeemed_at: Date | null;
        last_thousand_redeemed_at: Date | null;
    }): Promise<UsdBalance> {
        const newUsdBalance = this.usdBalanceRepository.create(balanceData);
        return this.usdBalanceRepository.save(newUsdBalance);
    }

    // Get balance data by user id
    async getBalanceDataByUserId(userId: number): Promise<UsdBalance> {
        return this.usdBalanceRepository.findOne({ where: { user: { id: userId } } });
    }

    // Redeem 100$
    async redeemHundred(userId: number): Promise<UsdBalance> {
        const balance = await this.usdBalanceRepository.findOne({ where: { user: { id: userId } } });
    
        if (!balance) {
            throw new BadRequestException("Balance record not found for this user.");
        }
    
        if (!balance.hundred_redeemable) {
            throw new BadRequestException("You cannot redeem $100 right now. Please wait for the cooldown to expire.");
        }
    
        // Ensure proper numeric conversion
        const currentBalance = typeof balance.balance === 'string' ? parseFloat(balance.balance) : balance.balance;
        const currentTotalRedeemed = typeof balance.total_redeemed === 'string' ? parseFloat(balance.total_redeemed) : balance.total_redeemed;
    
        // Update balance and total redeemed
        balance.balance = this.formatToTwoDecimals(currentBalance + 100);
        balance.total_redeemed = this.formatToTwoDecimals(currentTotalRedeemed + 100);
    
        // Update cooldown flags and timestamps
        balance.hundred_redeemable = false;
        balance.last_hundred_redeemed_at = new Date();
    
        return this.usdBalanceRepository.save(balance);
    }
    
    // Redeem 1000$
    async redeemThousand(userId: number): Promise<UsdBalance> {
        const balance = await this.usdBalanceRepository.findOne({ where: { user: { id: userId } } });
    
        if (!balance) {
            throw new BadRequestException("Balance record not found for this user.");
        }
    
        if (!balance.thousand_redeemable) {
            throw new BadRequestException("You cannot redeem $1000 right now. Please wait for the cooldown to expire.");
        }
    
        // Ensure proper numeric conversion
        const currentBalance = typeof balance.balance === 'string' ? parseFloat(balance.balance) : balance.balance;
        const currentTotalRedeemed = typeof balance.total_redeemed === 'string' ? parseFloat(balance.total_redeemed) : balance.total_redeemed;
    
        // Update balance and total redeemed
        balance.balance = this.formatToTwoDecimals(currentBalance + 1000);
        balance.total_redeemed = this.formatToTwoDecimals(currentTotalRedeemed + 1000);
    
        // Update cooldown flags and timestamps
        balance.thousand_redeemable = false;
        balance.last_thousand_redeemed_at = new Date();
    
        return this.usdBalanceRepository.save(balance);
    }
}