import { Module } from "@nestjs/common";
import { Holding } from "src/holdings/holding.entity";
import { HoldingService } from "src/holdings/holding.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ApeHolding } from "./ape_holding.entity";
import { ApeHoldingService } from "./ape_holding.service";

@Module({
    imports: [TypeOrmModule.forFeature([ApeHolding])],
    providers: [ApeHoldingService],
    exports: [ApeHoldingService],
})

export class ApeHoldingModule {}