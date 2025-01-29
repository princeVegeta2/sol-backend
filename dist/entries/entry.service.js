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
exports.EntryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entry_entity_1 = require("./entry.entity");
let EntryService = class EntryService {
    constructor(entryRepository) {
        this.entryRepository = entryRepository;
    }
    async createEntry(entryData) {
        const newEntry = this.entryRepository.create(entryData);
        return this.entryRepository.save(newEntry);
    }
    async findEntriesByUserIdAndMintAddress(userId, mintAddress) {
        const query = `
            SELECT * 
            FROM entries 
            WHERE user_id = $1 AND mint_address = $2
        `;
        const result = await this.entryRepository.query(query, [userId, mintAddress]);
        return result;
    }
    async findAllEntriesByUserId(userId) {
        const query = `
            SELECT *
            FROM entries
            WHERE user_id = $1
        `;
        const result = await this.entryRepository.query(query, [userId]);
        return result;
    }
    async findAllEntries() {
        return this.entryRepository.find();
    }
    async findAllEntriesByMintAddress(mintAddress) {
        const query = `
            SELECT *
            FROM entries
            WHERE mint_address = $1
        `;
        const result = await this.entryRepository.query(query, [mintAddress]);
        return result;
    }
    async deleteEntry(entry) {
        await this.entryRepository.remove(entry);
    }
};
exports.EntryService = EntryService;
exports.EntryService = EntryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entry_entity_1.Entry)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], EntryService);
//# sourceMappingURL=entry.service.js.map