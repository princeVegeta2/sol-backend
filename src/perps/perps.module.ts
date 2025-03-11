import { Module } from "@nestjs/common";
import { PerpService } from "./perps.service";
import { PerpController } from "./perps.controller";
import { PriceGateway } from "./price.gateway";

@Module({
    controllers: [PerpController],
    providers: [PerpService, PriceGateway],
    exports: [PerpService],
})

export class PerpModule {}