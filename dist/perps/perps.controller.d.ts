import { PerpService } from "./perps.service";
export declare class PerpController {
    private readonly perpService;
    constructor(perpService: PerpService);
    getSolPrice(): Promise<number>;
}
