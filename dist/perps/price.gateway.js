"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const perps_service_1 = require("./perps.service");
let PriceGateway = class PriceGateway {
    constructor(perpService) {
        this.perpService = perpService;
    }
    afterInit() {
        console.log('PriceGateway initialized');
        this.intervalId = setInterval(() => {
            const currentPrice = this.perpService.getCurrentSolPrice();
            this.server.emit('priceUpdate', { solPrice: currentPrice });
        }, 3000);
    }
    handleConnection(client) {
        console.log('New client connected:', client.id);
        const currentPrice = this.perpService.getCurrentSolPrice();
        client.emit('priceUpdate', { solPrice: currentPrice });
    }
    handleDisconnect(client) {
        console.log('Client disconnected:', client.id);
    }
    beforeApplicationShutdown() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }
};
exports.PriceGateway = PriceGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], PriceGateway.prototype, "server", void 0);
exports.PriceGateway = PriceGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: true,
    }),
    __metadata("design:paramtypes", [perps_service_1.PerpService])
], PriceGateway);
//# sourceMappingURL=price.gateway.js.map