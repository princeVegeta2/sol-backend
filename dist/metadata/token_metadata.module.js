"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenMetadataModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const token_metadata_entity_1 = require("./token_metadata.entity");
const token_metadata_service_1 = require("./token_metadata.service");
let TokenMetadataModule = class TokenMetadataModule {
};
exports.TokenMetadataModule = TokenMetadataModule;
exports.TokenMetadataModule = TokenMetadataModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([token_metadata_entity_1.TokenMetadata])],
        providers: [token_metadata_service_1.TokenMetadataService],
        exports: [token_metadata_service_1.TokenMetadataService],
    })
], TokenMetadataModule);
//# sourceMappingURL=token_metadata.module.js.map