import { Injectable } from '@nestjs/common';
import { Connection, PublicKey } from '@solana/web3.js';
import axios from 'axios';

@Injectable()
export class SolanaService {
    private readonly connection: Connection;

    constructor() {
        // Initialize a connection to the Solana blockchain using QuickNode RPC URL
        const rpcUrl = process.env.QUICKNODE_RPC_URL; // Make sure this is in your .env file
        this.connection = new Connection(rpcUrl, 'confirmed');
    }

    async getTokenData(mintAddress: string): Promise<any> {
        try {
            const tokenData = await this.getTokenMetadata(mintAddress);

            return tokenData;
        } catch (error) {
            console.error('Error fetching token data:', error.message);
            throw new Error(`Failed to fetch token data: ${error.message}`);
        }
    }

    private decodeTokenAccount(data: Buffer): any {
        // Decode the account data (e.g., decimals, supply, etc.)
        const layout = require('@solana/spl-token').MintLayout;
        const decoded = layout.decode(data);
        return {
            decimals: decoded.decimals,
            supply: decoded.supply.toString(),
        };
    }

    private async getTokenMetadata(mintAddress: string): Promise<any> {
        try {
            // Rate limit: 300req/min
            const apiUrl = `https://api.dexscreener.com/latest/dex/tokens/${mintAddress}`;

            // Make the API call to Dex Screener
            const response = await axios.get(apiUrl);

            if (!response.data || !response.data.pairs || response.data.pairs.length === 0) {
                throw new Error('No pair data found for the provided mint address');
            }

            // Extract the first pair (assuming one exists) and pick required fields
            const pair = response.data.pairs[0];

            return {
                quoteToken: {
                    address: pair.quoteToken.address,
                    name: pair.quoteToken.name,
                    symbol: pair.quoteToken.symbol,
                },
                priceNative: pair.priceNative,
                priceUsd: pair.priceUsd,
                liquidity: {
                    usd: pair.liquidity.usd,
                    base: pair.liquidity.base,
                    quote: pair.liquidity.quote,
                },
                fdv: pair.fdv,
                marketCap: pair.marketCap,
                pairCreatedAt: pair.pairCreatedAt,
                info: {
                    imageUrl: pair.info.imageUrl,
                    websites: pair.info.websites || [],
                    socials: pair.info.socials || [],
                },
                boosts: {
                    active: pair.boosts?.active || 0,
                },
            };
        } catch (error) {
            console.error('Error fetching metadata:', error.message);
            throw new Error(`Failed to fetch token metadata: ${error.message}`);
        }
    }
}
