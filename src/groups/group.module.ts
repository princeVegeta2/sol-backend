import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Group } from "./group.entity";
import { GroupService } from "./group.service";
import { UserModule } from "src/user/user.module";
import { HoldingModule } from "src/holdings/holding.module";
import { GroupController } from "./group.controller";

@Module({
    imports: [
        TypeOrmModule.forFeature([Group]),
        UserModule,
        forwardRef(() => HoldingModule),
    ],
    controllers: [GroupController],
    providers: [GroupService],
    exports: [GroupService],
})

export class GroupModule {}