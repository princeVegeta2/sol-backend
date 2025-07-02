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
exports.CryptoController = void 0;
const common_1 = require("@nestjs/common");
const solana_service_1 = require("../solana/solana.service");
const entry_dto_1 = require("../entries/entry.dto");
const exit_dto_1 = require("../exits/exit.dto");
const crypto_service_1 = require("./crypto.service");
const sol_balance_service_1 = require("../balance/sol_balance.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const axios_1 = require("axios");
let CryptoController = class CryptoController {
    constructor(solanaService, cryptoService, solBalanceService) {
        this.solanaService = solanaService;
        this.cryptoService = cryptoService;
        this.solBalanceService = solBalanceService;
    }
    async testPrice(mintAddress) {
        const jupApiUrl = `https://lite-api.jup.ag/price/v3?ids=${mintAddress.trim()},So11111111111111111111111111111111111111112&showExtraInfo=true`;
        const response = await axios_1.default.get(jupApiUrl);
        return response.data;
    }
    async getTokenQuote(outputMint, amount, slippage) {
        const numericAmount = parseFloat(amount);
        const numericSlippage = parseInt(slippage, 10);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            throw new common_1.BadRequestException('Invalid amount parameter');
        }
        if (isNaN(numericSlippage) || numericSlippage <= 0) {
            throw new common_1.BadRequestException('Invalid slippage parameter');
        }
        return this.solanaService.getTokenQuoteSolInputTest(outputMint, numericAmount, numericSlippage);
    }
    async getSolQuote(outputMint, amount, slippage) {
        const numericAmount = parseInt(amount, 10);
        const numericSlippage = parseInt(slippage, 10);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            throw new common_1.BadRequestException('Invalid amount parameter');
        }
        return this.solanaService.getTokenQuoteSolOutputTest(outputMint, numericAmount, numericSlippage);
    }
    async getTokenData(mintAddress) {
        return this.solanaService.getTokenData(mintAddress);
    }
    async getTokenMetadata(mintAddress) {
        return this.solanaService.getTokenMeta(mintAddress);
    }
    async getTokenPrice(mintAddress) {
        return this.solanaService.getTokenPrice(mintAddress);
    }
    async getTokenSellPrice(mintAddress) {
        return this.solanaService.getTokenSellPrice(mintAddress);
    }
    async getBulkTokenData(mintAddresses) {
        return this.solanaService.getBulkTokenData(mintAddresses);
    }
    async getTokenDecimals(mintAddress) {
        return this.solanaService.getTokenDecimals(mintAddress);
    }
    async createEntry(req, createEntryDto) {
        const userId = req.user.userId;
        if (!userId) {
            throw new common_1.BadRequestException('User ID not found');
        }
        if (createEntryDto.amount <= 0) {
            throw new common_1.BadRequestException('Amount must be greater than zero');
        }
        return this.cryptoService.createEntry(userId, createEntryDto);
    }
    async createExit(req, createExitDto) {
        const userId = req.user.userId;
        if (!userId) {
            throw new common_1.BadRequestException('User ID not found');
        }
        if (createExitDto.amount <= 0) {
            throw new common_1.BadRequestException('Amount must be greater than zero');
        }
        return this.cryptoService.createExit(userId, createExitDto);
    }
    async updateHoldings(req) {
        const userId = req.user.userId;
        if (!userId) {
            throw new common_1.BadRequestException('User ID not found');
        }
        return this.cryptoService.updateHoldingsPrice(userId);
    }
    async getBalanceData(req) {
        const userId = req.user.userId;
        if (!userId) {
            throw new common_1.BadRequestException('User ID not found');
        }
        return this.cryptoService.getBalanceData(userId);
    }
    async redeemOneSol(req) {
        const userId = req.user.userId;
        if (!userId) {
            throw new common_1.BadRequestException('User ID not found');
        }
        return this.cryptoService.redeemOneSol(userId);
    }
    async redeemFiveSol(req) {
        const userId = req.user.userId;
        if (!userId) {
            throw new common_1.BadRequestException('User ID not found');
        }
        return this.cryptoService.redeemFiveSol(userId);
    }
    async checkBalanceStatus(req) {
        const userId = req.user.userId;
        if (!userId) {
            throw new common_1.BadRequestException('User ID not found');
        }
        return this.solBalanceService.getRedeemingStatus(userId);
    }
    async getUserStats(req) {
        const userId = req.user.userId;
        if (!userId) {
            throw new common_1.BadRequestException('User ID not found');
        }
        return this.cryptoService.getUserStats(userId);
    }
    async getUserTransactions(req) {
        const userId = req.user.userId;
        if (!userId) {
            throw new common_1.BadRequestException('User ID not found');
        }
        return this.cryptoService.getAllEntriesAndExitsByUserId(userId);
    }
    async deleteHolding(req, mintAddress) {
        const userId = req.user.userId;
        if (!userId) {
            throw new common_1.BadRequestException('User ID not found');
        }
        return this.cryptoService.deleteAHoldingByUserId(userId, mintAddress);
    }
    async getUserHoldings(req) {
        const userId = req.user.userId;
        if (!userId) {
            throw new common_1.BadRequestException('User ID not found');
        }
        return this.cryptoService.getAllUserHoldings(userId);
    }
    async getUserNetworth(req) {
        const userId = req.user.userId;
        if (!userId) {
            throw new common_1.BadRequestException('User ID not found');
        }
        await this.cryptoService.updateHoldingsPrice(userId);
        return this.cryptoService.calculateNetworth(userId);
    }
};
exports.CryptoController = CryptoController;
__decorate([
    (0, common_1.Get)('test-price'),
    __param(0, (0, common_1.Query)('mintAddress')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CryptoController.prototype, "testPrice", null);
__decorate([
    (0, common_1.Get)('token-quote'),
    __param(0, (0, common_1.Query)('outputMint')),
    __param(1, (0, common_1.Query)('amount')),
    __param(2, (0, common_1.Query)('slippage')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CryptoController.prototype, "getTokenQuote", null);
__decorate([
    (0, common_1.Get)('sol-quote'),
    __param(0, (0, common_1.Query)('inputMint')),
    __param(1, (0, common_1.Query)('amount')),
    __param(2, (0, common_1.Query)('slippage')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CryptoController.prototype, "getSolQuote", null);
__decorate([
    (0, common_1.Get)('token-data'),
    __param(0, (0, common_1.Query)('mintAddress')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CryptoController.prototype, "getTokenData", null);
__decorate([
    (0, common_1.Get)('metadata'),
    __param(0, (0, common_1.Query)('mintAddress')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CryptoController.prototype, "getTokenMetadata", null);
__decorate([
    (0, common_1.Get)('token-price'),
    __param(0, (0, common_1.Query)('mintAddress')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CryptoController.prototype, "getTokenPrice", null);
__decorate([
    (0, common_1.Get)('token-sell-price'),
    __param(0, (0, common_1.Query)('mintAddress')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CryptoController.prototype, "getTokenSellPrice", null);
__decorate([
    (0, common_1.Get)('bulk-token-data'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], CryptoController.prototype, "getBulkTokenData", null);
__decorate([
    (0, common_1.Get)('token-decimals/:mintAddress'),
    __param(0, (0, common_1.Param)('mintAddress')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CryptoController.prototype, "getTokenDecimals", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('create-entry'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, entry_dto_1.CreateEntryDto]),
    __metadata("design:returntype", Promise)
], CryptoController.prototype, "createEntry", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('create-exit'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, exit_dto_1.CreateExitDto]),
    __metadata("design:returntype", Promise)
], CryptoController.prototype, "createExit", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('update-holdings'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CryptoController.prototype, "updateHoldings", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('get-balance-data'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CryptoController.prototype, "getBalanceData", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('redeem-one'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CryptoController.prototype, "redeemOneSol", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('redeem-five'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CryptoController.prototype, "redeemFiveSol", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('balance-status'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CryptoController.prototype, "checkBalanceStatus", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('user-stats'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CryptoController.prototype, "getUserStats", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('user-transactions'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CryptoController.prototype, "getUserTransactions", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)('delete-holding'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('mintAddress')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CryptoController.prototype, "deleteHolding", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('user-holdings'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CryptoController.prototype, "getUserHoldings", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('user-networth'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CryptoController.prototype, "getUserNetworth", null);
exports.CryptoController = CryptoController = __decorate([
    (0, common_1.Controller)('crypto'),
    __metadata("design:paramtypes", [solana_service_1.SolanaService,
        crypto_service_1.CryptoService,
        sol_balance_service_1.SolBalanceService])
], CryptoController);
//# sourceMappingURL=crypto.controller.js.map