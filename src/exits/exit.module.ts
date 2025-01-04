import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Exit } from "./exit.entity";
import { ExitService } from "./exit.service";

@Module({
    imports: [TypeOrmModule.forFeature([Exit])],
    providers: [ExitService],
    exports: [ExitService],
})

export class ExitModule {}