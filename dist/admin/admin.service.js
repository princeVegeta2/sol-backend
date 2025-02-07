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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const user_service_1 = require("./../user/user.service");
const holding_service_1 = require("../holdings/holding.service");
const entry_service_1 = require("../entries/entry.service");
const exit_service_1 = require("../exits/exit.service");
const sol_balance_service_1 = require("../balance/sol_balance.service");
const stats_service_1 = require("../stats/stats.service");
const group_service_1 = require("../groups/group.service");
let AdminService = class AdminService {
    constructor(userService, holdingService, entryService, exitService, solBalanceService, statService, groupService) {
        this.userService = userService;
        this.holdingService = holdingService;
        this.entryService = entryService;
        this.exitService = exitService;
        this.solBalanceService = solBalanceService;
        this.statService = statService;
        this.groupService = groupService;
    }
    async fetchAllUsers() {
        const users = await this.userService.findAllUsers();
        return users;
    }
    async fetchAllHoldings() {
        const holdings = await this.holdingService.findAllHoldings();
        return holdings;
    }
    async fetchAllEntries() {
        const entries = await this.entryService.findAllEntries();
    }
    async fetchAllExits() {
        const exits = await this.exitService.findAllExits();
        return exits;
    }
    async fetchAllBalances() {
        const balances = await this.solBalanceService.findAllBalances();
        return balances;
    }
    async fetchAllStats() {
        const stats = await this.statService.findAllStats();
        return stats;
    }
    async fetchAllHoldingsByUserId(userId) {
        const holdings = await this.holdingService.findAllUserHoldingsByUserId(userId);
        return holdings;
    }
    async fetchAllHoldingsByMintAddress(mintAddress) {
        const holdings = await this.holdingService.findAllHoldingsByMintAddress(mintAddress);
        return holdings;
    }
    async fetchAllEntriesByUserId(userId) {
        const entries = await this.entryService.findAllEntriesByUserId(userId);
        return entries;
    }
    async fetchAllEntriesByMintAddress(mintAddress) {
        const entries = await this.entryService.findAllEntriesByMintAddress(mintAddress);
        return entries;
    }
    async fetchAllExitsByUserId(userId) {
        const exits = await this.exitService.findExitsByUserId(userId);
        return exits;
    }
    async fetchAllExitsByMintAddress(mintAddress) {
        const exits = await this.exitService.findAllExitsByMintAddress(mintAddress);
        return exits;
    }
    async fetchBalanceByUserId(userId) {
        const balance = await this.solBalanceService.findBalanceByUserId(userId);
    }
    async fetchStatByUserId(userId) {
        const stats = await this.statService.findStatByUserId(userId);
        return stats;
    }
    async fetchAllGroups() {
        const groups = await this.groupService.findAllGroups();
    }
    async deleteHoldingsByUserId(userId) {
        const holdings = await this.holdingService.findAllUserHoldingsByUserId(userId);
        for (const holding of holdings) {
            await this.holdingService.deleteHolding(holding);
        }
    }
    async deleteHoldingsByMintAddress(mintAddress) {
        const holdings = await this.holdingService.findAllHoldingsByMintAddress(mintAddress);
        for (const holding of holdings) {
            await this.holdingService.deleteHolding(holding);
        }
    }
    async deleteHoldingByUserIdAndMintAddress(userId, mintAddress) {
        const holding = await this.holdingService.findHoldingByUserIdAndMintAddress(userId, mintAddress);
        await this.holdingService.deleteHolding(holding);
    }
    async deleteEntriesByUserId(userId) {
        const entries = await this.entryService.findAllEntriesByUserId(userId);
        for (const entry of entries) {
            await this.entryService.deleteEntry(entry);
        }
    }
    async deleteEntriesByMintAddress(mintAddress) {
        const entries = await this.entryService.findAllEntriesByMintAddress(mintAddress);
        for (const entry of entries) {
            await this.entryService.deleteEntry(entry);
        }
    }
    async deleteEntriesByUserIdAndMintAddress(userId, mintAddress) {
        const entries = await this.entryService.findEntriesByUserIdAndMintAddress(userId, mintAddress);
        for (const entry of entries) {
            await this.entryService.deleteEntry(entry);
        }
    }
    async deleteExitsByUserId(userId) {
        const exits = await this.exitService.findExitsByUserId(userId);
        for (const exit of exits) {
            await this.exitService.deleteExit(exit);
        }
    }
    async deleteExitsByMintAddress(mintAddress) {
        const exits = await this.exitService.findAllExitsByMintAddress(mintAddress);
        for (const exit of exits) {
            await this.exitService.deleteExit(exit);
        }
    }
    async deleteExitsByUserIdAndMintAddress(userId, mintAddress) {
        const exits = await this.exitService.findExitsByUserIdAndMintAddress(userId, mintAddress);
        for (const exit of exits) {
            await this.exitService.deleteExit(exit);
        }
    }
    async deleteBalanceByUserId(userId) {
        const balance = await this.solBalanceService.findBalanceByUserId(userId);
        await this.solBalanceService.deleteBalance(balance);
    }
    async deleteStatByUserId(userId) {
        const stat = await this.statService.findStatByUserId(userId);
        await this.statService.deleteStat(stat);
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_service_1.UserService,
        holding_service_1.HoldingService,
        entry_service_1.EntryService,
        exit_service_1.ExitService,
        sol_balance_service_1.SolBalanceService,
        stats_service_1.StatService,
        group_service_1.GroupService])
], AdminService);
//# sourceMappingURL=admin.service.js.map