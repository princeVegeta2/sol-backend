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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApeExitService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const ape_exit_entity_1 = require("./ape_exit.entity");
let ApeExitService = class ApeExitService {
    constructor(apeExitRepository) {
        this.apeExitRepository = apeExitRepository;
    }
    async createApeExit(apeExitData) {
        const newApeExit = await this.apeExitRepository.create(apeExitData);
        return this.apeExitRepository.save(newApeExit);
    }
    async findApeExitsByUserId(userId) {
        const query = `
            SELECT *
            FROM ape_exits
            WHERE user_id = $1
        `;
        const result = await this.apeExitRepository.query(query, [userId]);
        return result;
    }
    async findApeExitsByUserIdAndMintAddress(userId, mintAddress) {
        const query = `
            SELECT *
            FROM ape_exits
            WHERE user_id = $1
                AND mint_address = $2
        `;
        const result = await this.apeExitRepository.query(query, [userId, mintAddress]);
        return result;
    }
    async findAllApeExitWinsByUserId(userId) {
        const query = `
            SELECT *
            FROM ape_exits
            WHERE user_id = $1
             AND pnl > 0
        `;
        const result = await this.apeExitRepository.query(query, [userId]);
        return result;
    }
    async findAllApeExitsByMintAddress(mintAddress) {
        const query = `
            SELECT *
            FROM ape_exits
            WHERE mint_address = $1
        `;
        const result = await this.apeExitRepository.query(query, [mintAddress]);
        return result;
    }
    async findAllApeExits() {
        return this.apeExitRepository.find();
    }
    async deleteApeExit(apeExit) {
        await this.apeExitRepository.remove(apeExit);
    }
};
exports.ApeExitService = ApeExitService;
exports.ApeExitService = ApeExitService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(ape_exit_entity_1.ApeExit)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ApeExitService);
//# sourceMappingURL=ape_exit.service.js.map