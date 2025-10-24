"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const auth_module_1 = require("./auth/auth.module");
const crypto_module_1 = require("./crypto/crypto.module");
const holding_module_1 = require("./holdings/holding.module");
const user_module_1 = require("./user/user.module");
const token_metadata_module_1 = require("./metadata/token_metadata.module");
const exit_module_1 = require("./exits/exit.module");
const sol_balance_module_1 = require("./balance/sol_balance.module");
const stats_module_1 = require("./stats/stats.module");
const health_module_1 = require("./health/health.module");
const admin_module_1 = require("./admin/admin.module");
const group_module_1 = require("./groups/group.module");
const ape_entry_module_1 = require("./ape_entry/ape_entry.module");
const ape_exit_module_1 = require("./ape_exit/ape_exit.module");
const ape_holding_module_1 = require("./ape_holdings/ape_holding.module");
const ape_module_1 = require("./ape/ape.module");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const path_1 = require("path");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot(),
            auth_module_1.AuthModule,
            crypto_module_1.CryptoModule,
            holding_module_1.HoldingModule,
            user_module_1.UserModule,
            token_metadata_module_1.TokenMetadataModule,
            exit_module_1.ExitModule,
            sol_balance_module_1.SolBalanceModule,
            stats_module_1.StatModule,
            health_module_1.HealthModule,
            admin_module_1.AdminModule,
            group_module_1.GroupModule,
            ape_entry_module_1.ApeEntryModule,
            ape_exit_module_1.ApeExitModule,
            ape_holding_module_1.ApeHoldingModule,
            ape_module_1.ApeModule,
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    type: 'postgres',
                    url: config.get('DATABASE_URL'),
                    entities: [(0, path_1.join)(process.cwd(), 'dist/**/*.entity.js')],
                    synchronize: false,
                    ssl: false,
                })
            })
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map