"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApeModule = void 0;
const common_1 = require("@nestjs/common");
const ape_controller_1 = require("./ape.controller");
const solana_module_1 = require("../solana/solana.module");
const ape_holding_module_1 = require("../ape_holdings/ape_holding.module");
const ape_entry_module_1 = require("../ape_entry/ape_entry.module");
const ape_exit_module_1 = require("../ape_exit/ape_exit.module");
const stats_module_1 = require("../stats/stats.module");
const sol_balance_module_1 = require("../balance/sol_balance.module");
const user_module_1 = require("../user/user.module");
const token_metadata_module_1 = require("../metadata/token_metadata.module");
const ape_service_1 = require("./ape.service");
let ApeModule = class ApeModule {
};
exports.ApeModule = ApeModule;
exports.ApeModule = ApeModule = __decorate([
    (0, common_1.Module)({
        imports: [solana_module_1.SolanaModule, ape_holding_module_1.ApeHoldingModule, ape_entry_module_1.ApeEntryModule, ape_exit_module_1.ApeExitModule, stats_module_1.StatModule, sol_balance_module_1.SolBalanceModule, user_module_1.UserModule, token_metadata_module_1.TokenMetadataModule],
        controllers: [ape_controller_1.ApeController],
        providers: [ape_service_1.ApeService],
        exports: [ape_service_1.ApeService],
    })
], ApeModule);
//# sourceMappingURL=ape.module.js.map