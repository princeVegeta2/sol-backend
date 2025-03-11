import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { PerpService } from './perps.service';
export declare class PriceGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly perpService;
    server: Server;
    private intervalId;
    constructor(perpService: PerpService);
    afterInit(): void;
    handleConnection(client: any): void;
    handleDisconnect(client: any): void;
    beforeApplicationShutdown(): void;
}
