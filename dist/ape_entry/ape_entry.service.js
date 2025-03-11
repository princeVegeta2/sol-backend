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
exports.ApeEntryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const ape_entry_entity_1 = require("./ape_entry.entity");
let ApeEntryService = class ApeEntryService {
    constructor(apeEntryRepository) {
        this.apeEntryRepository = apeEntryRepository;
    }
    async createApeEntry(apeEntryData) {
        const newApeEntry = this.apeEntryRepository.create(apeEntryData);
        return this.apeEntryRepository.save(newApeEntry);
    }
    async findApeEntriesByUserIdAndMintAddress(userId, mintAddress) {
        const query = `
            SELECT * 
            FROM ape_entries 
            WHERE user_id = $1 AND mint_address = $2
        `;
        const result = await this.apeEntryRepository.query(query, [userId, mintAddress]);
        return result;
    }
    async findAllApeEntriesByUserId(userId) {
        const query = `
            SELECT *
            FROM ape_entries
            WHERE user_id = $1
        `;
        const result = await this.apeEntryRepository.query(query, [userId]);
        return result;
    }
    async findAllApeEntries() {
        return this.apeEntryRepository.find();
    }
    async findAllApeEntriesByMintAddress(mintAdress) {
        const query = `
            SELECT * 
            FROM ape_entries
            WHERE mint_address = $1
        `;
        const result = await this.apeEntryRepository.query(query, [mintAdress]);
        return result;
    }
    async findAllApeEntriesByUserIdAndMintAddress(userId, mintAddress) {
        const query = `
            SELECT *
            FROM ape_entries
            WHERE user_id = $1 AND mint_address = $2
        `;
        const result = await this.apeEntryRepository.query(query, [userId, mintAddress]);
        return result;
    }
    async deleteApeEntry(apeEntry) {
        await this.apeEntryRepository.remove(apeEntry);
    }
};
exports.ApeEntryService = ApeEntryService;
exports.ApeEntryService = ApeEntryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(ape_entry_entity_1.ApeEntry)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ApeEntryService);
//# sourceMappingURL=ape_entry.service.js.map