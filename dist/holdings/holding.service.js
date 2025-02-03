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
exports.HoldingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const holding_entity_1 = require("./holding.entity");
const user_service_1 = require("../user/user.service");
let HoldingService = class HoldingService {
    constructor(holdingRepository, userService) {
        this.holdingRepository = holdingRepository;
        this.userService = userService;
    }
    async createHolding(holdingData) {
        const newHolding = this.holdingRepository.create(holdingData);
        return this.holdingRepository.save(newHolding);
    }
    async findHoldingByUserIdAndMintAddress(userId, mintAddress) {
        const query = `
            SELECT * 
            FROM holdings 
            WHERE user_id = $1 AND mint_address = $2
        `;
        const result = await this.holdingRepository.query(query, [userId, mintAddress]);
        return result[0] || null;
    }
    async updateHoldingEntry(holding, amount, price, newUsdValue, newSolValue, additionalUsdValue, additionalSolValue) {
        const holdingAmount = parseFloat(holding.amount.toString());
        const oldAvgPrice = parseFloat(holding.average_price?.toString() || '0');
        const purchaseAmount = parseFloat(amount.toString());
        const combinedAmount = holdingAmount + purchaseAmount;
        const roundedAmount = parseFloat(combinedAmount.toFixed(12));
        let newAvgPrice = oldAvgPrice;
        if (purchaseAmount > 0 && combinedAmount > 0) {
            const oldTotalCost = holdingAmount * oldAvgPrice;
            const newPurchaseCost = purchaseAmount * price;
            const totalCost = oldTotalCost + newPurchaseCost;
            newAvgPrice = totalCost / combinedAmount;
        }
        const roundedAvgPrice = parseFloat(newAvgPrice.toFixed(15));
        const oldUsdVal = Number(newUsdValue);
        const oldSolVal = Number(newSolValue);
        const addUsdVal = Number(additionalUsdValue);
        const addSolVal = Number(additionalSolValue);
        const finalUsdVal = oldUsdVal + addUsdVal;
        const finalSolVal = oldSolVal + addSolVal;
        const roundedUsdValue = parseFloat(finalUsdVal.toFixed(4));
        const roundedSolValue = parseFloat(finalSolVal.toFixed(4));
        try {
            holding.price = price;
        }
        catch (err) {
            throw new Error(`Failed to update holding price of ${holding.id}. Error: ${err}`);
        }
        holding.amount = roundedAmount;
        holding.value_usd = roundedUsdValue;
        holding.value_sol = roundedSolValue;
        holding.average_price = roundedAvgPrice;
        return this.holdingRepository.save(holding);
    }
    async updateHoldingExit(holding, amount, oldUsdValue, oldSolValue, subtractedUsdValue, subtractedSolValue) {
        const holdingAmount = parseFloat(holding.amount.toString());
        const exitAmount = parseFloat(amount.toString());
        const combinedAmount = holdingAmount - exitAmount;
        const finalAmount = parseFloat(combinedAmount.toFixed(12));
        const oldUsd = parseFloat(oldUsdValue.toString());
        const oldSol = parseFloat(oldSolValue.toString());
        const subtractUsd = parseFloat(subtractedUsdValue.toString());
        const subtractSol = parseFloat(subtractedSolValue.toString());
        const leftoverUsd = oldUsd - subtractUsd;
        const leftoverSol = oldSol - subtractSol;
        const finalUsd = parseFloat(leftoverUsd.toFixed(4));
        const finalSol = parseFloat(leftoverSol.toFixed(4));
        holding.amount = finalAmount;
        holding.value_usd = finalUsd;
        holding.value_sol = finalSol;
        return this.holdingRepository.save(holding);
    }
    async updateHoldingPnl(holding, newMarketPrice) {
        const costBasis = parseFloat(holding.average_price.toString());
        const holdingAmount = parseFloat(holding.amount.toString());
        const newPnL = (newMarketPrice - costBasis) * holdingAmount;
        holding.pnl = parseFloat(newPnL.toFixed(4));
        return this.holdingRepository.save(holding);
    }
    async updateHoldingPrice(holding, price, solPrice) {
        const usdValue = holding.amount * price;
        holding.price = price;
        holding.value_usd = usdValue;
        holding.value_sol = usdValue / solPrice;
        return this.holdingRepository.save(holding);
    }
    async deleteHolding(holding) {
        await this.holdingRepository.remove(holding);
    }
    async findAllUserHoldingsByUserId(userId) {
        return this.holdingRepository
            .createQueryBuilder('holding')
            .where('holding.user_id = :userId', { userId })
            .getMany();
    }
    async findAllHoldingsByMintAddress(mintAddress) {
        return this.holdingRepository
            .createQueryBuilder('holding')
            .where('holding.mint_address = :mintAddress', { mintAddress })
            .getMany();
    }
    async calculateHoldingsValueByUserId(userId) {
        const holdings = await this.findAllUserHoldingsByUserId(userId);
        const holdingsSolValue = holdings.reduce((acc, holding) => {
            const val = typeof holding.value_sol === 'string'
                ? parseFloat(holding.value_sol) : holding.value_sol;
            return acc + val;
        }, 0);
        const holdingsUsdValue = holdings.reduce((acc, holding) => {
            const val = typeof holding.value_usd === 'string'
                ? parseFloat(holding.value_usd) : holding.value_usd;
            return acc + val;
        }, 0);
        return ({
            holdingsSolValue,
            holdingsUsdValue
        });
    }
    async findAllHoldings() {
        return this.holdingRepository.find();
    }
};
exports.HoldingService = HoldingService;
exports.HoldingService = HoldingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(holding_entity_1.Holding)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        user_service_1.UserService])
], HoldingService);
//# sourceMappingURL=holding.service.js.map