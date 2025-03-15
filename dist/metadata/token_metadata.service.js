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
exports.TokenMetadataService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const token_metadata_entity_1 = require("./token_metadata.entity");
const typeorm_2 = require("@nestjs/typeorm");
let TokenMetadataService = class TokenMetadataService {
    constructor(tokenMetadataRepository) {
        this.tokenMetadataRepository = tokenMetadataRepository;
    }
    async createTokenMetadata(tokenMetadata) {
        const newTokenMetadata = this.tokenMetadataRepository.create(tokenMetadata);
        return this.tokenMetadataRepository.save(newTokenMetadata);
    }
    async findTokenDataByMintAddress(mintAddress) {
        return this.tokenMetadataRepository.findOne({ where: { mint_address: mintAddress } });
    }
    async updateTokenMetadata(ticker, name, image, metadata) {
        if (!metadata) {
            throw new Error("Token metadata not found.");
        }
        metadata.ticker = ticker;
        metadata.name = name;
        metadata.image = image;
        return this.tokenMetadataRepository.save(metadata);
    }
};
exports.TokenMetadataService = TokenMetadataService;
exports.TokenMetadataService = TokenMetadataService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_2.InjectRepository)(token_metadata_entity_1.TokenMetadata)),
    __metadata("design:paramtypes", [typeorm_1.Repository])
], TokenMetadataService);
//# sourceMappingURL=token_metadata.service.js.map