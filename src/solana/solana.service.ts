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

    async getBulkTokenData(mintAddresses: string[]): Promise<any[]> {
        try {
            const MAX_MINT_ADDRESSES = 30; // Maximum addresses allowed per API request
            const results = [];

            // Split mintAddresses into batches of up to 30
            for (let i = 0; i < mintAddresses.length; i += MAX_MINT_ADDRESSES) {
                const batch = mintAddresses.slice(i, i + MAX_MINT_ADDRESSES);
                const mintAddressQuery = batch.join(',');

                // Construct the API URL for this batch
                const apiUrl = `https://api.dexscreener.com/latest/dex/tokens/${mintAddressQuery}`;

                // Make the API call
                const response = await axios.get(apiUrl);

                // Add the response data to the results array
                results.push(response.data);
            }

            // Return all results combined
            return results;
        } catch (error) {
            console.error('Error fetching bulk token data:', error.message);
            throw new Error(`Failed to fetch bulk token data: ${error.message}`);
        }
    }

    async getTokenPrice(mintAddress: string): Promise<any> {
        try {
            const jupApiUrl = `https://api.jup.ag/price/v2?ids=${mintAddress.trim()},So11111111111111111111111111111111111111112`;
            const response = await axios.get(jupApiUrl);

            if (!response.data) {
                throw new Error('No price data found for the provided mint address');
            }

            const price = parseFloat(response.data.data[mintAddress.trim()].price);

            if (isNaN(price)) {
                throw new Error('Invalid price data found for the provided mint address');
            }

            return price;
        } catch (error) {
            console.error('Error fetching price:', error.message);
            throw new Error(`Failed to fetch token price: ${error.message}`);
        }
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
