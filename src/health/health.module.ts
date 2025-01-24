import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HealthService } from "./health.service";
import { HealthController } from "./health.controller";

@Module({
    imports: [TypeOrmModule.forFeature([])],
    providers: [HealthService],
    controllers: [HealthController],
    exports: [HealthService],
})

export class HealthModule {}