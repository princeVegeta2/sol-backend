import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsdBalance } from "./usd_balance.entity";
import { UsdBalanceService } from "./usd_balance.service";

@Module({
    imports: [TypeOrmModule.forFeature([UsdBalance])],
    providers: [UsdBalanceService],
    exports: [UsdBalanceService],
})
export class UsdBalanceModule {}