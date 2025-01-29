"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolBalanceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const sol_balance_entity_1 = require("./sol_balance.entity");
let SolBalanceService = class SolBalanceService {
    constructor(solBalanceRepository) {
        this.solBalanceRepository = solBalanceRepository;
    }
    formatToTwoDecimals(value) {
        const numericValue = typeof value === 'number' ? value : parseFloat(value);
        if (isNaN(numericValue)) {
            throw new Error(`Invalid value provided: ${value}`);
        }
        return parseFloat(numericValue.toFixed(2));
    }
    async createBalance(balanceData) {
        const newSolBalance = this.solBalanceRepository.create(balanceData);
        return this.solBalanceRepository.save(newSolBalance);
    }
    async getBalanceDataByUserId(userId, solPrice) {
        const userBalance = await this.solBalanceRepository.findOne({ where: { user: { id: userId } } });
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
    async getRedeemingStatus(userId) {
        const balance = await this.solBalanceRepository.findOne({ where: { user: { id: userId } } });
        if (!balance) {
            throw new common_1.BadRequestException("Balance record not found for this user.");
        }
        const now = new Date();
        const oneHourInMs = 60 * 60 * 1000;
        const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
        let timeLeftOneRedeem = null;
        let timeLeftFiveRedeem = null;
        if (balance.last_one_redeemed_at) {
            const timeSinceLastOneRedeem = now.getTime() - new Date(balance.last_one_redeemed_at).getTime();
            if (timeSinceLastOneRedeem >= oneHourInMs) {
                balance.one_redeemable = true;
            }
            else {
                balance.one_redeemable = false;
                timeLeftOneRedeem = Math.ceil((oneHourInMs - timeSinceLastOneRedeem) / (60 * 1000));
            }
        }
        if (balance.last_five_redeemed_at) {
            const timeSinceLastFiveRedeem = now.getTime() - new Date(balance.last_five_redeemed_at).getTime();
            if (timeSinceLastFiveRedeem >= twentyFourHoursInMs) {
                balance.five_redeemable = true;
            }
            else {
                balance.five_redeemable = false;
                timeLeftFiveRedeem = Math.ceil((twentyFourHoursInMs - timeSinceLastFiveRedeem) / (60 * 1000));
            }
        }
        await this.solBalanceRepository.save(balance);
        return {
            oneRedeemable: balance.one_redeemable,
            fiveRedeemable: balance.five_redeemable,
            timeLeftOneRedeem,
            timeLeftFiveRedeem,
            lastOneRedeemedAt: balance.last_one_redeemed_at,
            lastFiveRedeemedAt: balance.last_five_redeemed_at,
        };
    }
    async redeemOne(userId, solPrice) {
        const balance = await this.solBalanceRepository.findOne({ where: { user: { id: userId } } });
        if (!balance) {
            throw new common_1.BadRequestException("Balance record not found for this user.");
        }
        const now = new Date();
        const oneHourInMs = 60 * 60 * 1000;
        if (balance.last_one_redeemed_at) {
            const timeSinceLastRedeem = now.getTime() - new Date(balance.last_one_redeemed_at).getTime();
            if (timeSinceLastRedeem < oneHourInMs) {
                throw new common_1.BadRequestException(`You cannot redeem 1 SOL right now. Please wait ${Math.ceil((oneHourInMs - timeSinceLastRedeem) / (60 * 1000))} minutes for the cooldown to expire.`);
            }
        }
        const redeemedSolValue = 1 * solPrice;
        const currentBalance = typeof balance.balance === 'string' ? parseFloat(balance.balance) : balance.balance;
        const currentBalanceUsd = typeof balance.balance_usd === 'string' ? parseFloat(balance.balance_usd) : balance.balance_usd;
        const currentTotalRedeemed = typeof balance.total_redeemed === 'string' ? parseFloat(balance.total_redeemed) : balance.total_redeemed;
        const currentTotalRedeemedUsd = typeof balance.total_usd_redeemed === 'string' ? parseFloat(balance.total_usd_redeemed) : balance.total_usd_redeemed;
        balance.balance = this.formatToTwoDecimals(currentBalance + 1);
        balance.balance_usd = this.formatToTwoDecimals(currentBalanceUsd + redeemedSolValue);
        balance.total_redeemed = this.formatToTwoDecimals(currentTotalRedeemed + 1);
        balance.total_usd_redeemed = this.formatToTwoDecimals(currentTotalRedeemedUsd + redeemedSolValue);
        balance.one_redeemable = false;
        balance.last_one_redeemed_at = now;
        return this.solBalanceRepository.save(balance);
    }
    async redeemFive(userId, solPrice) {
        const balance = await this.solBalanceRepository.findOne({ where: { user: { id: userId } } });
        if (!balance) {
            throw new common_1.BadRequestException("Balance record not found for this user.");
        }
        const now = new Date();
        const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
        if (balance.last_five_redeemed_at) {
            const timeSinceLastRedeem = now.getTime() - new Date(balance.last_five_redeemed_at).getTime();
            if (timeSinceLastRedeem < twentyFourHoursInMs) {
                throw new common_1.BadRequestException(`You cannot redeem 5 SOL right now. Please wait ${Math.ceil((twentyFourHoursInMs - timeSinceLastRedeem) / (60 * 1000))} minutes for the cooldown to expire.`);
            }
        }
        const redeemedSolValue = 5 * solPrice;
        const currentBalance = typeof balance.balance === 'string' ? parseFloat(balance.balance) : balance.balance;
        const currentBalanceUsd = typeof balance.balance_usd === 'string' ? parseFloat(balance.balance_usd) : balance.balance_usd;
        const currentTotalRedeemed = typeof balance.total_redeemed === 'string' ? parseFloat(balance.total_redeemed) : balance.total_redeemed;
        const currentTotalRedeemedUsd = typeof balance.total_usd_redeemed === 'string' ? parseFloat(balance.total_usd_redeemed) : balance.total_usd_redeemed;
        balance.balance = this.formatToTwoDecimals(currentBalance + 5);
        balance.balance_usd = this.formatToTwoDecimals(currentBalanceUsd + redeemedSolValue);
        balance.total_redeemed = this.formatToTwoDecimals(currentTotalRedeemed + 5);
        balance.total_usd_redeemed = this.formatToTwoDecimals(currentTotalRedeemedUsd + redeemedSolValue);
        balance.five_redeemable = false;
        balance.last_five_redeemed_at = now;
        return this.solBalanceRepository.save(balance);
    }
    async updateBalanceSubtract(balance, amount, solPrice) {
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
    async updateBalanceAdd(balance, amount, usdValue) {
        const oldSol = parseFloat(balance.balance.toString());
        const oldUsd = parseFloat(balance.balance_usd.toString());
        console.log(`Converting to float: ${oldSol}, ${oldUsd}`);
        const addSol = parseFloat(amount.toString());
        const addUsd = parseFloat(usdValue.toString());
        console.log(`Converting to float(added sol and usd) ${addSol}, ${addUsd}`);
        const newSolBal = oldSol + addSol;
        const newUsdBal = oldUsd + addUsd;
        console.log(`Summing oldSol + addSol and oldUsd + addUsd: ${newSolBal}, ${newUsdBal}`);
        const roundedSolBal = parseFloat(newSolBal.toFixed(4));
        const roundedUsdBal = parseFloat(newUsdBal.toFixed(4));
        console.log(`Rounding to 4 decimals: ${roundedSolBal}, ${roundedUsdBal}`);
        balance.balance = roundedSolBal;
        balance.balance_usd = roundedUsdBal;
        return this.solBalanceRepository.save(balance);
    }
    async updateUsdBalance(balance, solPrice) {
        const currentBalance = typeof balance.balance === 'string' ? parseFloat(balance.balance) : balance.balance;
        const newUsdBalance = this.formatToTwoDecimals(currentBalance * solPrice);
        const currentTotalRedeemed = typeof balance.total_redeemed === 'string' ? parseFloat(balance.total_redeemed) : balance.total_redeemed;
        const newUsdTotalRedeemed = this.formatToTwoDecimals(currentTotalRedeemed * solPrice);
        balance.balance_usd = newUsdBalance;
        balance.total_usd_redeemed = newUsdTotalRedeemed;
        return this.solBalanceRepository.save(balance);
    }
    async findAllBalances() {
        return this.solBalanceRepository.find();
    }
    async findBalanceByUserId(userId) {
        return this.solBalanceRepository.findOne({ where: { user: { id: userId } } });
    }
    async deleteBalance(solBalance) {
        await this.solBalanceRepository.remove(solBalance);
    }
};
exports.SolBalanceService = SolBalanceService;
exports.SolBalanceService = SolBalanceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sol_balance_entity_1.SolBalance)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SolBalanceService);
//# sourceMappingURL=sol_balance.service.js.map