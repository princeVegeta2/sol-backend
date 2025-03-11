import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
export declare class PerpService implements OnModuleInit, OnModuleDestroy {
    private currentSolPrice;
    private priceInterval;
    constructor();
    getSolPrice(): Promise<number>;
    getCurrentSolPrice(): number;
    onModuleInit(): void;
    onModuleDestroy(): void;
}
