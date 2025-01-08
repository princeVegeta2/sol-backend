import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SolBalance } from "./sol_balance.entity";
import { SolBalanceService } from "./sol_balance.service";

@Module({
    imports: [TypeOrmModule.forFeature([SolBalance])],
    providers: [SolBalanceService],
    exports: [SolBalanceService],
})
export class SolBalanceModule {}