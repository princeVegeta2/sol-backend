import { Repository } from "typeorm";
import { TokenMetadata } from './token_metadata.entity';
export declare class TokenMetadataService {
    private tokenMetadataRepository;
    constructor(tokenMetadataRepository: Repository<TokenMetadata>);
    createTokenMetadata(tokenMetadata: {
        name: string;
        ticker: string;
        mint_address: string;
        image?: string;
        website?: string;
        x_page?: string;
        telegram?: string;
    }): Promise<TokenMetadata>;
    findTokenDataByMintAddress(mintAddress: string): Promise<TokenMetadata>;
    updateTokenMetadata(ticker: string, name: string, image: string, metadata: TokenMetadata): Promise<TokenMetadata>;
}
