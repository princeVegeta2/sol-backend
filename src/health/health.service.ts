import { Injectable } from "@nestjs/common";

@Injectable()
export class HealthService {
    async getHealth(): Promise<string> {
        return "OK";
    }

    async createHealth(): Promise<string> {
        return "OK";
    }

    async updateHealth(): Promise<string> {
        return "OK";
    }

    async deleteHealth(): Promise<string> {
        return "OK";
    }
}

