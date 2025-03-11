import { Controller, Get } from "@nestjs/common";
import { PerpService } from "./perps.service";

@Controller("perps")
export class PerpController {
    constructor(private readonly perpService: PerpService) {}

    @Get("sol-price")
    async getSolPrice() {
        return this.perpService.getSolPrice();
    }
}