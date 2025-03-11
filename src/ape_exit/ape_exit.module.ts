import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ApeExit } from "./ape_exit.entity";
import { ApeExitService } from "./ape_exit.service";

@Module({
    imports: [TypeOrmModule.forFeature([ApeExit])],
    providers: [ApeExitService],
    exports: [ApeExitService],
})

export class ApeExitModule {}