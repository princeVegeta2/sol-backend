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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    async getAllUsers() {
        return this.adminService.fetchAllUsers();
    }
    async getAllHoldings(userId, mintAddress) {
        if (userId)
            return this.adminService.fetchAllHoldingsByUserId(userId);
        if (mintAddress)
            return this.adminService.fetchAllHoldingsByMintAddress(mintAddress);
        return this.adminService.fetchAllHoldings();
    }
    async getAllEntries(userId, mintAddress) {
        if (userId)
            return this.adminService.fetchAllEntriesByUserId(userId);
        if (mintAddress)
            return this.adminService.fetchAllEntriesByMintAddress(mintAddress);
        return this.adminService.fetchAllEntries();
    }
    async getAllExits(userId, mintAddress) {
        if (userId)
            return this.adminService.fetchAllExitsByUserId(userId);
        if (mintAddress)
            return this.adminService.fetchAllExitsByMintAddress(mintAddress);
        return this.adminService.fetchAllExits();
    }
    async getAllBalances(userId) {
        if (userId)
            return this.adminService.fetchBalanceByUserId(userId);
        return this.adminService.fetchAllBalances();
    }
    async getAllStats(userId) {
        if (userId)
            return this.adminService.fetchStatByUserId(userId);
        return this.adminService.fetchAllStats();
    }
    async deleteHoldings(userId, mintAddress) {
        if (userId && mintAddress)
            return this.adminService.deleteHoldingByUserIdAndMintAddress(userId, mintAddress);
        if (userId)
            return this.adminService.deleteHoldingsByUserId(userId);
        if (mintAddress)
            return this.adminService.deleteHoldingsByMintAddress(mintAddress);
    }
    async deleteEntries(userId, mintAddress) {
        if (userId && mintAddress)
            return this.adminService.deleteEntriesByUserIdAndMintAddress(userId, mintAddress);
        if (userId)
            return this.adminService.deleteEntriesByUserId(userId);
        if (mintAddress)
            return this.adminService.deleteEntriesByMintAddress(mintAddress);
    }
    async deleteExits(userId, mintAddress) {
        if (userId && mintAddress)
            return this.adminService.deleteExitsByUserIdAndMintAddress(userId, mintAddress);
        if (userId)
            return this.adminService.deleteExitsByUserId(userId);
        if (mintAddress)
            return this.adminService.deleteExitsByMintAddress(mintAddress);
    }
    async deleteBalanceByUserId(userId) {
        return this.adminService.deleteBalanceByUserId(userId);
    }
    async deleteStatByUserId(userId) {
        return this.adminService.deleteStatByUserId(userId);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('users'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllUsers", null);
__decorate([
    (0, common_1.Get)('holdings'),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('mintAddress')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllHoldings", null);
__decorate([
    (0, common_1.Get)('entries'),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('mintAddress')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllEntries", null);
__decorate([
    (0, common_1.Get)('exits'),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('mintAddress')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllExits", null);
__decorate([
    (0, common_1.Get)('balances'),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllBalances", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllStats", null);
__decorate([
    (0, common_1.Delete)('holdings'),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('mintAddress')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteHoldings", null);
__decorate([
    (0, common_1.Delete)('entries'),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('mintAddress')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteEntries", null);
__decorate([
    (0, common_1.Delete)('exits'),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('mintAddress')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteExits", null);
__decorate([
    (0, common_1.Delete)('balance'),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteBalanceByUserId", null);
__decorate([
    (0, common_1.Delete)('stats'),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteStatByUserId", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map