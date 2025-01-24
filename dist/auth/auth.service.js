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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const user_service_1 = require("../user/user.service");
const jwt_1 = require("@nestjs/jwt");
const sol_balance_service_1 = require("../balance/sol_balance.service");
const stats_service_1 = require("../stats/stats.service");
let AuthService = class AuthService {
    constructor(userService, jwtService, solBalanceService, statService) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.solBalanceService = solBalanceService;
        this.statService = statService;
    }
    async validateUser(email, password) {
        const user = await this.userService.validateUser(email, password);
        if (user) {
            const { password_hash, ...result } = user;
            return result;
        }
        return null;
    }
    async login(user, staySignedIn) {
        const payload = { sub: user.id, email: user.email };
        const options = {
            expiresIn: staySignedIn ? '30d' : '24h',
        };
        return {
            access_token: this.jwtService.sign(payload, options),
        };
    }
    async createUser(username, email, password) {
        const emailExists = await this.userService.userEmailExists(email);
        if (emailExists) {
            throw new common_1.BadRequestException('Email already taken');
        }
        const usernameExists = await this.userService.userUsernameExists(username);
        if (usernameExists) {
            throw new common_1.BadRequestException('Username already taken');
        }
        const newUser = await this.userService.createUser(username, email, password);
        await this.solBalanceService.createBalance({
            user: newUser,
            balance: 0,
            balance_usd: 0,
            total_redeemed: 0,
            total_usd_redeemed: 0,
            one_redeemable: true,
            five_redeemable: true,
            last_one_redeemed_at: null,
            last_five_redeemed_at: null,
        });
        await this.statService.createStat({
            user: newUser,
            tokens_purchased: 0,
            total_entries: 0,
            total_exits: 0,
            current_holdings: 0,
            total_pnl: 0,
            unrealized_pnl: 0,
            realized_pnl: 0,
            winrate: 0,
        });
        return {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            created_at: newUser.created_at,
        };
    }
    async getUserData(userId) {
        const user = await this.userService.findUserById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return {
            username: user.username,
            email: user.email,
            createdAt: user.created_at
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_service_1.UserService,
        jwt_1.JwtService,
        sol_balance_service_1.SolBalanceService,
        stats_service_1.StatService])
], AuthService);
//# sourceMappingURL=auth.service.js.map