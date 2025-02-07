import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { UserModule } from "src/user/user.module";
import { HoldingModule } from "src/holdings/holding.module";
import { EntryModule } from "src/entries/entry.module";
import { ExitModule } from "src/exits/exit.module";
import { SolBalanceModule } from "src/balance/sol_balance.module";
import { StatModule } from "src/stats/stats.module";
import { GroupModule } from "src/groups/group.module";

@Module({
    imports: [UserModule, HoldingModule, EntryModule, ExitModule, SolBalanceModule, StatModule, GroupModule],
    controllers: [AdminController],
    providers: [AdminService],
})

export class AdminModule {}