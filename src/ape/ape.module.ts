import { Module } from "@nestjs/common";
import { ApeController } from "./ape.controller";
import { SolanaModule } from "src/solana/solana.module";
import { ApeHoldingModule } from "src/ape_holdings/ape_holding.module";
import { ApeEntryModule } from "src/ape_entry/ape_entry.module";
import { ApeExitModule } from "src/ape_exit/ape_exit.module";
import { StatModule } from "src/stats/stats.module";
import { SolBalanceModule } from "src/balance/sol_balance.module";
import { UserModule } from "src/user/user.module";
import { TokenMetadataModule } from "src/metadata/token_metadata.module";
import { ApeService } from "./ape.service";

@Module({
    imports: [SolanaModule, ApeHoldingModule, ApeEntryModule, ApeExitModule, StatModule, SolBalanceModule, UserModule, TokenMetadataModule],
    controllers: [ApeController],
    providers: [ApeService],
    exports: [ApeService],
})

export class ApeModule {}