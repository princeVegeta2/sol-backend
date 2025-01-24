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
exports.StatService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const stats_entity_1 = require("./stats.entity");
const typeorm_2 = require("typeorm");
let StatService = class StatService {
    constructor(statRepository) {
        this.statRepository = statRepository;
    }
    async createStat(statData) {
        const newStat = this.statRepository.create(statData);
        return this.statRepository.save(newStat);
    }
    async findStatByUserId(userId) {
        return this.statRepository.findOne({ where: { user: { id: userId } } });
    }
    async updateStatOnEntry(stat, newHolding, uniqueUserToken) {
        stat.total_entries += 1;
        if (uniqueUserToken) {
            stat.tokens_purchased += 1;
        }
        if (newHolding) {
            stat.current_holdings += 1;
        }
        return this.statRepository.save(stat);
    }
    async updateStatOnExit(stat, totalWins, exitPnl, holdingDeleted) {
        stat.total_exits += 1;
        const userWinrate = parseFloat(((totalWins / stat.total_exits) * 100).toFixed(2));
        stat.winrate = userWinrate;
        const oldRealized = parseFloat(stat.realized_pnl.toString());
        stat.realized_pnl = oldRealized + exitPnl;
        const oldTotal = parseFloat(stat.total_pnl.toString());
        stat.total_pnl = oldTotal + exitPnl;
        if (holdingDeleted) {
            stat.current_holdings -= 1;
        }
        return this.statRepository.save(stat);
    }
    async updateStatOnHoldingUpdate(stat, newUnrealizedPnl) {
        const newUnrealizedPnlFormatted = parseFloat(newUnrealizedPnl.toString());
        const oldRealizedPnl = parseFloat(stat.realized_pnl.toString());
        const newTotalPnl = oldRealizedPnl + newUnrealizedPnlFormatted;
        stat.unrealized_pnl = newUnrealizedPnlFormatted;
        stat.total_pnl = newTotalPnl;
        return await this.statRepository.save(stat);
    }
    async updateStatOnHoldingDelete(stat, holdingPnl) {
        const holdingPnlFormatted = parseFloat(holdingPnl.toString());
        const oldUnrealizedPnl = parseFloat(stat.unrealized_pnl.toString());
        const oldRealizedPnl = parseFloat(stat.realized_pnl.toString());
        const newUnrealizedPnl = oldUnrealizedPnl - holdingPnlFormatted;
        const newTotalPnl = oldRealizedPnl + holdingPnlFormatted;
        const oldTotalHoldings = stat.current_holdings;
        const newTotalHoldings = oldTotalHoldings - 1;
        stat.unrealized_pnl = newUnrealizedPnl;
        stat.total_pnl = newTotalPnl;
        stat.current_holdings = newTotalHoldings;
        return await this.statRepository.save(stat);
    }
};
exports.StatService = StatService;
exports.StatService = StatService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(stats_entity_1.Stat)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], StatService);
//# sourceMappingURL=stats.service.js.map