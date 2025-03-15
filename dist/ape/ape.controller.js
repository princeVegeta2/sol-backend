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
exports.ApeController = void 0;
const common_1 = require("@nestjs/common");
const ape_service_1 = require("./ape.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const ape_entry_dto_1 = require("../ape_entry/ape_entry.dto");
const ape_exit_dto_1 = require("../ape_exit/ape_exit.dto");
let ApeController = class ApeController {
    constructor(apeService) {
        this.apeService = apeService;
    }
    async createApeEntry(req, createApeEntryDto) {
        const userId = req.user.userId;
        if (!userId) {
            throw new common_1.UnauthorizedException("User ID not found");
        }
        if (createApeEntryDto.amount <= 0) {
            throw new common_1.BadRequestException("Amount must be larger than 0");
        }
        return this.apeService.createApeEntry(userId, createApeEntryDto);
    }
    async createApeExit(req, createApeExitDto) {
        const userId = req.user.userId;
        if (!userId) {
            throw new common_1.UnauthorizedException("User ID not found");
        }
        if (createApeExitDto.amount <= 0) {
            throw new common_1.BadRequestException("Amount must be larger than 0");
        }
        return this.apeService.createApeExit(userId, createApeExitDto);
    }
    async updateApeHoldings(req) {
        const userId = req.user.userId;
        if (!userId) {
            throw new common_1.UnauthorizedException("User ID not found");
        }
        return this.apeService.updateApeHoldingsPrice(userId);
    }
};
exports.ApeController = ApeController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('create-ape-entry'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ape_entry_dto_1.CreateApeEntryDto]),
    __metadata("design:returntype", Promise)
], ApeController.prototype, "createApeEntry", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('create-ape-exit'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ape_exit_dto_1.CreateApeExitDto]),
    __metadata("design:returntype", Promise)
], ApeController.prototype, "createApeExit", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('update-ape-holdings'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ApeController.prototype, "updateApeHoldings", null);
exports.ApeController = ApeController = __decorate([
    (0, common_1.Controller)('ape'),
    __metadata("design:paramtypes", [ape_service_1.ApeService])
], ApeController);
//# sourceMappingURL=ape.controller.js.map