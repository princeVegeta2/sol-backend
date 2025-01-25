import { BadRequestException, Injectable } from '@nestjs/common';
import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js';
import axios from 'axios';

@Injectable()
export class SolanaService {
    private readonly connection: Connection;
    private readonly solMint = 'So11111111111111111111111111111111111111112';

    constructor() {
        // Initialize a connection to the Solana blockchain using QuickNode RPC URL
        const rpcUrl = process.env.QUICKNODE_RPC_URL; // Make sure this is in your .env file
        this.connection = new Connection(rpcUrl, 'confirmed');
    }

    async getTokenQuoteSolInput(
        outputMint: string,
        solAmount: number,   // The user’s SOL amount in decimal form, e.g. 0.3904
        slippage: number,    // Slippage in BPS, e.g. 50 = 0.5%
        outputTokenUsdPrice: number, // The USD price for the output token
    ): Promise<any> {
        if (!outputMint || !solAmount || solAmount < 0.0001) {
            throw new Error('Invalid parameters...');
        }

        // 1. Convert the decimal SOL amount to lamports (1 SOL = 1e9 lamports)
        const lamports = Math.round(solAmount * 1e9);

        // 2. Build the Jupiter quote URL
        //    Here, 'this.solMint' is presumably the "So1111...1112" (native SOL) mint.
        const jupApiUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${this.solMint}&outputMint=${outputMint}&amount=${lamports}&slippageBps=${slippage}`;

        try {
            // 3. Fetch the quote from Jupiter
            const quoteResponse = await axios.get(jupApiUrl);

            // 4. Figure out how many decimals the OUTPUT token actually has
            //    - If Jupiter’s response includes "mintInfos[outputMint]"
            //    - If not, you may need to fetch from chain or have a fallback
            let tokenDecimals = 9; // default to 9 if not found
            const mintInfos = quoteResponse.data.mintInfos;
            if (mintInfos && mintInfos[outputMint] && typeof mintInfos[outputMint].decimals === 'number') {
                tokenDecimals = mintInfos[outputMint].decimals;
            }

            // 5. Jupiter gives "otherAmountThreshold" in *base units* of the output token.
            //    We must divide by 10^tokenDecimals to get the decimal amount
            const outAmountThresholdLamports = parseFloat(quoteResponse.data.otherAmountThreshold);
            const normalizedOutAmount = outAmountThresholdLamports / 10 ** tokenDecimals;

            // 6. Price impact
            const priceImpactPct = parseFloat(quoteResponse.data.priceImpactPct) * 100;
            const priceImpactMultiplier = 1 - priceImpactPct / 100;

            // 7. Adjust final token amount for price impact
            const effectiveTokens = normalizedOutAmount * priceImpactMultiplier;

            // 8. Convert SOL input to USD
            //    (Assuming getTokenSellPrice(this.solMint) gives you the *current* SOL→USD price)
            const solUsdPrice = await this.getTokenSellPrice(this.solMint);
            const inAmountUsdValue = solAmount * solUsdPrice;

            // 9. Now figure out the *final* USD value of the tokens you receive
            //    "outputTokenUsdPrice" is presumably the per-token USD price for outputMint
            const effectiveUsdValue = effectiveTokens * outputTokenUsdPrice;

            // 10. Also compute that final USD in terms of SOL
            const solValue = effectiveUsdValue / solUsdPrice;

            // Return the same structure you used before
            return {
                // number of tokens you’d actually receive after price impact
                normalizedThresholdToken: parseFloat(effectiveTokens.toFixed(tokenDecimals)),

                // How many USD you *spent* in SOL
                inAmountUsdValue,

                // The final USD value of the tokens you get
                usdValue: effectiveUsdValue,

                // The final SOL value if you measure that final USD in SOL
                solValue,

                priceImpact: `${priceImpactPct.toFixed(2)}%`,
                slippage: `${(slippage / 100).toFixed(2)}%`,
            };
        } catch (error) {
            console.error('Error fetching token quote:', error.response?.data || error.message);
            throw new Error('Failed to fetch token quote from Jupiter API');
        }
    }



    // Minimum SOL: 0.0001
    async getTokenQuoteSolOutput(inputMint: string, tokenAmount: number, slippage: number): Promise<any> {
        if (!inputMint || !tokenAmount || tokenAmount < 0.0001) {
            throw new Error('Invalid parameters: inputMint is required, and tokenAmount must be at least 0.0001');
        }

        const tokenDecimals = 6;

        // Convert the token amount to its smallest unit based on the token's decimals
        const tokenAmountInSmallestUnits = Math.round(tokenAmount * Math.pow(10, tokenDecimals));

        const jupApiUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${this.solMint}&amount=${tokenAmountInSmallestUnits}&slippageBps=${slippage}`;
        const solUsdValue = await this.getTokenSellPrice(this.solMint);

        try {
            const quoteResponse = await axios.get(jupApiUrl);

            // Parse the response
            const outAmountThreshold = parseFloat(quoteResponse.data.otherAmountThreshold) / Math.pow(10, 9); // Convert to SOL (SOL has 9 decimals)
            const outAmountUsdValue = parseFloat((outAmountThreshold * solUsdValue).toFixed(4)); // Convert to USD

            return {
                normalizedThresholdSol: outAmountThreshold.toFixed(6), // Guaranteed amount in SOL (normalized)
                usdValue: outAmountUsdValue, // USD value of the guaranteed amount
                priceImpactPct: (parseFloat(quoteResponse.data.priceImpactPct) * 100).toFixed(2), // Price impact in %
                slippage: (slippage / 100).toFixed(2) + '%', // Slippage in %
            };
        } catch (error) {
            console.error('Error fetching token quote:', error.response?.data || error.message);
            throw new Error('Failed to fetch token quote from Jupiter API');
        }
    }

    async getTokenQuoteSolInputTest(outputMint: string, solAmount: number, slippage: number): Promise<any> {
        if (!outputMint || !solAmount || solAmount < 0.0001) {
            throw new Error('Invalid parameters: outputMint is required, and solAmount must be at least 0.0001 SOL');
        }

        const tokenDecimals = 6;

        // Convert SOL to lamports (1 SOL = 1e9 lamports)
        const lamports = Math.round(solAmount * 1e9);

        const jupApiUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${this.solMint}&outputMint=${outputMint}&amount=${lamports}&slippageBps=${slippage}`;

        try {
            const quoteResponse = await axios.get(jupApiUrl);

            // Parse the response
            const outAmountThreshold = parseFloat(quoteResponse.data.otherAmountThreshold) / Math.pow(10, tokenDecimals); // Normalize to token decimals
            const normalizedOutAmount = parseFloat(outAmountThreshold.toFixed(tokenDecimals)); // Keep it to token decimals

            // Price impact multiplier
            const priceImpactPct = parseFloat(quoteResponse.data.priceImpactPct) * 100; // Price impact in %
            const priceImpactMultiplier = 1 - priceImpactPct / 100;

            // Effective values considering price impact
            const effectiveTokens = normalizedOutAmount * priceImpactMultiplier; // Adjusted token amount
            const solUsdPrice = await this.getTokenSellPrice(this.solMint);
            const inAmountUsdValue = solAmount * solUsdPrice;
            const effectiveUsdValue = parseFloat((effectiveTokens * await this.getTokenSellPrice(outputMint)).toFixed(4)); // Adjusted USD value
            let solValue = effectiveUsdValue / solUsdPrice;
            if (solValue > solAmount) {
                solValue = solAmount;
            }

            return {
                normalizedThresholdToken: parseFloat(effectiveTokens.toFixed(tokenDecimals)), // Guaranteed amount in tokens (before price impact)
                inAmountUsdValue, // USD value of the input amount
                usdValue: effectiveUsdValue, // USD value of the adjusted output amount,
                solValue,
                priceImpact: `${priceImpactPct.toFixed(2)}%`, // Price impact in %
                slippage: `${(slippage / 100).toFixed(2)}%`, // Slippage in %
            };
        } catch (error) {
            console.error('Error fetching token quote:', error.response?.data || error.message);
            throw new Error('Failed to fetch token quote from Jupiter API');
        }
    }

    async getTokenQuoteSolOutputTest(inputMint: string, tokenAmount: number, slippage: number): Promise<any> {
        if (!inputMint || !tokenAmount || tokenAmount < 0.0001) {
            throw new Error('Invalid parameters: inputMint is required, and tokenAmount must be at least 0.0001');
        }

        const jupApiUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${this.solMint}&amount=${tokenAmount}&slippageBps=${slippage}`;
        const solUsdValue = await this.getTokenSellPrice(this.solMint);
        const decimals = 6;

        try {
            const quoteResponse = await axios.get(jupApiUrl);
            return quoteResponse.data;
        } catch (error) {
            console.error('Error fetching token quote:', error.response?.data || error.message);
            throw new Error('Failed to fetch token quote from Jupiter API');
        }
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

    async getTokenPrice(mintAddress: string): Promise<number> {
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

    async getTokenSellPrice(mintAddress: string): Promise<number> {
        try {
            const jupApiUrl = `https://api.jup.ag/price/v2?ids=${mintAddress.trim()},So11111111111111111111111111111111111111112&showExtraInfo=true`;
            const response = await axios.get(jupApiUrl);

            if (!response.data) {
                throw new Error('No price data found for the provided mint address');
            }

            // Go into the data object for the token
            const tokenData = response.data.data[mintAddress.trim()];
            if (!tokenData) {
                throw new Error(`No token data found for ${mintAddress.trim()}`);
            }

            // The "sellPrice" we want is typically at: `extraInfo.quotedPrice.sellPrice`
            const sellPriceStr = tokenData?.extraInfo?.quotedPrice?.sellPrice;
            if (!sellPriceStr) {
                throw new BadRequestException("The token has no Liquidity and cannot be sold");
            }

            const sellPriceNum = parseFloat(sellPriceStr);
            if (isNaN(sellPriceNum)) {
                throw new Error('Invalid sellPrice data found for the provided mint address');
            }

            return sellPriceNum;
        } catch (error) {
            if (error instanceof BadRequestException) {
                // Re-throw BadRequestException to be handled by NestJS exception filters
                throw error;
            }
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
                    address: pair.baseToken.address,
                    name: pair.baseToken.name,
                    symbol: pair.baseToken.symbol,
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
