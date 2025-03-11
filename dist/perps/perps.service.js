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
exports.PerpService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
let PerpService = class PerpService {
    constructor() {
        this.currentSolPrice = 0;
        this.priceInterval = null;
    }
    async getSolPrice() {
        const res = await axios_1.default.get('https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112');
        const price = parseFloat(res.data.data['So11111111111111111111111111111111111111112'].price);
        return price;
    }
    getCurrentSolPrice() {
        return this.currentSolPrice;
    }
    onModuleInit() {
        this.priceInterval = setInterval(async () => {
            try {
                const newPrice = await this.getSolPrice();
                this.currentSolPrice = newPrice;
            }
            catch (err) {
                console.error('Failed to fetch SOL price:', err);
            }
        }, 3000);
    }
    onModuleDestroy() {
        if (this.priceInterval) {
            clearInterval(this.priceInterval);
        }
    }
};
exports.PerpService = PerpService;
exports.PerpService = PerpService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PerpService);
//# sourceMappingURL=perps.service.js.map