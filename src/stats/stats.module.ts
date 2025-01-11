import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Stat } from "./stats.entity";
import { StatService } from "./stats.service";

@Module({
    imports: [TypeOrmModule.forFeature([Stat])],
    providers: [StatService],
    exports: [StatService],
})

export class StatModule {}