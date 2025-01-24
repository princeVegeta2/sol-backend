import { HealthService } from './health.service';
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthService);
    checkHealth(): Promise<string>;
    createHealth(): Promise<string>;
    updateHealth(): Promise<string>;
    deleteHealth(): Promise<string>;
}
