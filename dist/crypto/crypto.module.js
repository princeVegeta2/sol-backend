"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoModule = void 0;
const common_1 = require("@nestjs/common");
const crypto_controller_1 = require("./crypto.controller");
const solana_module_1 = require("../solana/solana.module");
const crypto_service_1 = require("./crypto.service");
const entry_module_1 = require("../entries/entry.module");
const user_module_1 = require("../user/user.module");
const holding_module_1 = require("../holdings/holding.module");
const token_metadata_module_1 = require("../metadata/token_metadata.module");
const exit_module_1 = require("../exits/exit.module");
const sol_balance_module_1 = require("../balance/sol_balance.module");
const stats_module_1 = require("../stats/stats.module");
const ape_holding_module_1 = require("../ape_holdings/ape_holding.module");
let CryptoModule = class CryptoModule {
};
exports.CryptoModule = CryptoModule;
exports.CryptoModule = CryptoModule = __decorate([
    (0, common_1.Module)({
        imports: [solana_module_1.SolanaModule, entry_module_1.EntryModule, user_module_1.UserModule, holding_module_1.HoldingModule, token_metadata_module_1.TokenMetadataModule, exit_module_1.ExitModule, sol_balance_module_1.SolBalanceModule, stats_module_1.StatModule, ape_holding_module_1.ApeHoldingModule],
        controllers: [crypto_controller_1.CryptoController],
        providers: [crypto_service_1.CryptoService],
        exports: [crypto_service_1.CryptoService],
    })
], CryptoModule);
//# sourceMappingURL=crypto.module.js.map