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
    async getBalanceDataByUserId(userId: number, solPrice: number): Promise<SolBalance> {
        const userBalance =  await this.solBalanceRepository.findOne({ where: { user: { id: userId } } });
        const solBalance = typeof userBalance.balance === 'string' ? parseFloat(userBalance.balance) : userBalance.balance;
        const totalSolRedeemed = typeof userBalance.total_redeemed === 'string' ? parseFloat(userBalance.total_redeemed) : userBalance.total_redeemed;
        const usdBalance = typeof userBalance.balance_usd === 'string' ? parseFloat(userBalance.balance_usd) : userBalance.balance_usd;
        const totalUsdRedeemed = typeof userBalance.total_usd_redeemed === 'string' ? parseFloat(userBalance.total_usd_redeemed) : userBalance.total_usd_redeemed;
        const newTotalUsdRedeemed = solPrice ? totalSolRedeemed * solPrice : totalUsdRedeemed;
        const newUsdBal = solPrice ? solBalance * solPrice : usdBalance;
        const roundedUsdBalance = parseFloat(newUsdBal.toFixed(4));
        const roundedTotalUsdRedeemed = parseFloat(newTotalUsdRedeemed.toFixed(4));
        userBalance.balance_usd = roundedUsdBalance;
        userBalance.total_usd_redeemed = roundedTotalUsdRedeemed;

        return await this.solBalanceRepository.save(userBalance);
    }

    // Get redeemable status
    async getRedeemingStatus(userId: number): Promise<any> {
        const balance = await this.solBalanceRepository.findOne({ where: { user: { id: userId } } });

        if (!balance) {
            throw new BadRequestException("Balance record not found for this user.");
        }

        // Check cooldowns
        const now = new Date();
        const oneHourInMs = 60 * 60 * 1000; // 1 hour in milliseconds
        const twentyFourHoursInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

        let timeLeftOneRedeem = null;
        let timeLeftFiveRedeem = null;

        if (balance.last_one_redeemed_at) {
            const timeSinceLastOneRedeem = now.getTime() - new Date(balance.last_one_redeemed_at).getTime();
            if (timeSinceLastOneRedeem >= oneHourInMs) {
                balance.one_redeemable = true; // Cooldown expired
            } else {
                balance.one_redeemable = false; // Cooldown still active
                timeLeftOneRedeem = Math.ceil((oneHourInMs - timeSinceLastOneRedeem) / (60 * 1000)); // Time left in minutes
            }
        }

        if (balance.last_five_redeemed_at) {
            const timeSinceLastFiveRedeem = now.getTime() - new Date(balance.last_five_redeemed_at).getTime();
            if (timeSinceLastFiveRedeem >= twentyFourHoursInMs) {
                balance.five_redeemable = true; // Cooldown expired
            } else {
                balance.five_redeemable = false; // Cooldown still active
                timeLeftFiveRedeem = Math.ceil((twentyFourHoursInMs - timeSinceLastFiveRedeem) / (60 * 1000)); // Time left in minutes
            }
        }

        // Save balance only if redeemable statuses were updated
        await this.solBalanceRepository.save(balance);

        // Return status object
        return {
            oneRedeemable: balance.one_redeemable,
            fiveRedeemable: balance.five_redeemable,
            timeLeftOneRedeem, // Time left in minutes (null if cooldown expired)
            timeLeftFiveRedeem, // Time left in minutes (null if cooldown expired)
            lastOneRedeemedAt: balance.last_one_redeemed_at,
            lastFiveRedeemedAt: balance.last_five_redeemed_at,
        };
    }


    // Redeem 100$
    async redeemOne(userId: number, solPrice: number): Promise<SolBalance> {
        const balance = await this.solBalanceRepository.findOne({ where: { user: { id: userId } } });

        if (!balance) {
            throw new BadRequestException("Balance record not found for this user.");
        }

        // Check cooldown dynamically
        const now = new Date();
        const oneHourInMs = 60 * 60 * 1000; // 1 hour in milliseconds

        if (balance.last_one_redeemed_at) {
            const timeSinceLastRedeem = now.getTime() - new Date(balance.last_one_redeemed_at).getTime();
            if (timeSinceLastRedeem < oneHourInMs) {
                throw new BadRequestException(
                    `You cannot redeem 1 SOL right now. Please wait ${Math.ceil(
                        (oneHourInMs - timeSinceLastRedeem) / (60 * 1000),
                    )} minutes for the cooldown to expire.`
                );
            }
        }

        const redeemedSolValue = 1 * solPrice;

        // Ensure proper numeric conversion
        const currentBalance = typeof balance.balance === 'string' ? parseFloat(balance.balance) : balance.balance;
        const currentBalanceUsd = typeof balance.balance_usd === 'string' ? parseFloat(balance.balance_usd) : balance.balance_usd;
        const currentTotalRedeemed = typeof balance.total_redeemed === 'string' ? parseFloat(balance.total_redeemed) : balance.total_redeemed;
        const currentTotalRedeemedUsd = typeof balance.total_usd_redeemed === 'string' ? parseFloat(balance.total_usd_redeemed) : balance.total_usd_redeemed;

        // Update balance and total redeemed
        balance.balance = this.formatToTwoDecimals(currentBalance + 1);
        balance.balance_usd = this.formatToTwoDecimals(currentBalanceUsd + redeemedSolValue);
        balance.total_redeemed = this.formatToTwoDecimals(currentTotalRedeemed + 1);
        balance.total_usd_redeemed = this.formatToTwoDecimals(currentTotalRedeemedUsd + redeemedSolValue);

        // Update cooldown flags and timestamps
        balance.one_redeemable = false;
        balance.last_one_redeemed_at = now;

        return this.solBalanceRepository.save(balance);
    }

    // Redeem 1000$
    async redeemFive(userId: number, solPrice: number): Promise<SolBalance> {
        const balance = await this.solBalanceRepository.findOne({ where: { user: { id: userId } } });

        if (!balance) {
            throw new BadRequestException("Balance record not found for this user.");
        }

        // Check cooldown dynamically
        const now = new Date();
        const twentyFourHoursInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

        if (balance.last_five_redeemed_at) {
            const timeSinceLastRedeem = now.getTime() - new Date(balance.last_five_redeemed_at).getTime();
            if (timeSinceLastRedeem < twentyFourHoursInMs) {
                throw new BadRequestException(
                    `You cannot redeem 5 SOL right now. Please wait ${Math.ceil(
                        (twentyFourHoursInMs - timeSinceLastRedeem) / (60 * 1000),
                    )} minutes for the cooldown to expire.`
                );
            }
        }

        const redeemedSolValue = 5 * solPrice;

        // Ensure proper numeric conversion
        const currentBalance = typeof balance.balance === 'string' ? parseFloat(balance.balance) : balance.balance;
        const currentBalanceUsd = typeof balance.balance_usd === 'string' ? parseFloat(balance.balance_usd) : balance.balance_usd;
        const currentTotalRedeemed = typeof balance.total_redeemed === 'string' ? parseFloat(balance.total_redeemed) : balance.total_redeemed;
        const currentTotalRedeemedUsd = typeof balance.total_usd_redeemed === 'string' ? parseFloat(balance.total_usd_redeemed) : balance.total_usd_redeemed;

        // Update balance and total redeemed
        balance.balance = this.formatToTwoDecimals(currentBalance + 5);
        balance.balance_usd = this.formatToTwoDecimals(currentBalanceUsd + redeemedSolValue);
        balance.total_redeemed = this.formatToTwoDecimals(currentTotalRedeemed + 5);
        balance.total_usd_redeemed = this.formatToTwoDecimals(currentTotalRedeemedUsd + redeemedSolValue);

        // Update cooldown flags and timestamps
        balance.five_redeemable = false;
        balance.last_five_redeemed_at = now;

        return this.solBalanceRepository.save(balance);
    }

    async updateBalanceSubtract(balance: SolBalance, amount: number, solPrice: number): Promise<SolBalance> {
        const currentSolBalance = balance.balance;
        if (!currentSolBalance) {
            throw new Error('Balance not found');
        }
        const newBalance = currentSolBalance - amount;
        const newBalanceUsd = newBalance * solPrice;
        balance.balance = newBalance;
        balance.balance_usd = newBalanceUsd;

        return this.solBalanceRepository.save(balance);
    }

    async updateBalanceAdd(
        balance: SolBalance,
        amount: number | string,
        usdValue: number | string
    ): Promise<SolBalance> {
        // Convert to float
        const oldSol = parseFloat(balance.balance.toString());
        const oldUsd = parseFloat(balance.balance_usd.toString());
        console.log(`Converting to float: ${oldSol}, ${oldUsd}`);

        const addSol = parseFloat(amount.toString());
        const addUsd = parseFloat(usdValue.toString());
        console.log(`Converting to float(added sol and usd) ${addSol}, ${addUsd}`);

        const newSolBal = oldSol + addSol;   // numeric sum
        const newUsdBal = oldUsd + addUsd;   // numeric sum
        console.log(`Summing oldSol + addSol and oldUsd + addUsd: ${newSolBal}, ${newUsdBal}`);

        // Round as needed
        const roundedSolBal = parseFloat(newSolBal.toFixed(4));
        const roundedUsdBal = parseFloat(newUsdBal.toFixed(4));
        console.log(`Rounding to 4 decimals: ${roundedSolBal}, ${roundedUsdBal}`);


        balance.balance = roundedSolBal;
        balance.balance_usd = roundedUsdBal;

        return this.solBalanceRepository.save(balance);
    }

    async updateUsdBalance(balance: SolBalance, solPrice: number) {
        const currentBalance = typeof balance.balance === 'string' ? parseFloat(balance.balance) : balance.balance;
        const newUsdBalance = this.formatToTwoDecimals(currentBalance * solPrice);
        const currentTotalRedeemed = typeof balance.total_redeemed === 'string' ? parseFloat(balance.total_redeemed) : balance.total_redeemed;
        const newUsdTotalRedeemed = this.formatToTwoDecimals(currentTotalRedeemed * solPrice);

        balance.balance_usd = newUsdBalance;
        balance.total_usd_redeemed = newUsdTotalRedeemed;

        return this.solBalanceRepository.save(balance);
    }

}