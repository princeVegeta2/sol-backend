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
        name: string,
        ticker: string,
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

    async updateTokenMetadata(
        ticker: string, 
        name: string, 
        image: string, 
        metadata: TokenMetadata
    ): Promise<TokenMetadata> {
        if (!metadata) {
            throw new Error("Token metadata not found.");
        }
        // Update fields
        metadata.ticker = ticker;
        metadata.name = name;
        metadata.image = image;

        // Save the updated metadata
        return this.tokenMetadataRepository.save(metadata);
    }
}