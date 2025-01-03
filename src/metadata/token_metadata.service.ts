import { Injectable } from '@nestjs/common';
import { Repository } from "typeorm";
import { TokenMetadata } from './token_metadata.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TokenMetadataService {
    constructor(
        @InjectRepository(TokenMetadata)
        private tokenMetadataRepository: Repository<TokenMetadata>,
    ) {
    }

    async createTokenMetadata(tokenMetadata: {
        mint_address: string;
        image?: string;
        website?: string;
        x_page?: string;
        telegram?: string;
    }): Promise<TokenMetadata> {
        const newTokenMetadata = this.tokenMetadataRepository.create(tokenMetadata);
        return this.tokenMetadataRepository.save(newTokenMetadata);
    }

    async findTokenDataByMintAddress(mintAddress: string): Promise<TokenMetadata> {
        return this.tokenMetadataRepository.findOne({where: { mint_address: mintAddress }});
    }
}