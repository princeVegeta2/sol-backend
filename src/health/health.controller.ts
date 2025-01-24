import { Controller, Get, Post, Put, Delete, Request, BadRequestException} from '@nestjs/common';
import { HealthService } from './health.service';

@Controller()
export class HealthController {
    constructor(private readonly healthService: HealthService) {

    }

    @Get()
    async checkHealth() {
        return this.healthService.getHealth();
    }

    @Post()
    async createHealth() {
        return this.healthService.createHealth();
    }

    @Put()
    async updateHealth() {
        return this.healthService.updateHealth();
    }

    @Delete()
    async deleteHealth() {
        return this.healthService.deleteHealth();
    }
}
