import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HealthService } from "./health.service";

@Module({
    imports: [TypeOrmModule.forFeature([])],
    providers: [HealthService],
    exports: [HealthService],
})

export class HealthModule {}