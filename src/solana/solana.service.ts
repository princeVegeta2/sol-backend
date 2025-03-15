import { BadRequestException, Injectable } from '@nestjs/common';
import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js';
import axios from 'axios';

@Injectable()
export class SolanaService {
    private readonly connection: Connection;
    private readonly solMint = 'So11111111111111111111111111111111111111112';
    private readonly rpcUrl = process.env.QUICKNODE_RPC_URL

    constructor() {
        // Initialize a connection to the Solana blockchain using QuickNode RPC URL
        this.connection = new Connection(this.rpcUrl, 'confirmed');
    }

    async getTokenQuoteSolInput(
        outputMint: string,
        solAmount: number,   // The user’s SOL amount in decimal form, e.g. 0.3904
        slippage: number,    // Slippage in BPS, e.g. 50 = 0.5%
        outputTokenUsdPrice: number, // The "USD price" you want to use for the output token
    ): Promise<any> {
        if (!outputMint || !solAmount || solAmount < 0.0001) {
            throw new Error('Invalid parameters...');
        }

        // 1. Convert the decimal SOL amount to lamports (1 SOL = 1e9 lamports)
        const lamports = Math.round(solAmount * 1e9);

        // 2. Build the Jupiter quote URL
        //    e.g., this.solMint = 'So11111111111111111111111111111111111111112'
        const jupApiUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${this.solMint}&outputMint=${outputMint}&amount=${lamports}&slippageBps=${slippage}`;

        try {
            // 3. Fetch the quote from Jupiter
            const quoteResponse = await axios.get(jupApiUrl);
            const rawData = quoteResponse.data;

            // We'll parse these fields:
            // - otherAmountThreshold: guaranteed min *base units* of the output token
            // - swapUsdValue: approximate final output's total USD
            //   (some tokens or some conditions might omit swapUsdValue, so handle carefully)
            const outAmountThresholdStr = rawData.otherAmountThreshold;

            if (!outAmountThresholdStr) {
                throw new Error('No otherAmountThreshold in Jupiter response');
            }

            const outAmountBaseUnits = parseFloat(outAmountThresholdStr);

            // 4a. Check if Jupiter provided decimals in `mintInfos[...]`.
            const tokenDecimals = await this.getTokenDecimals(outputMint);

            // 5. Now we have a tokenDecimals number. Convert outAmountThreshold to decimal
            const normalizedOutAmount = outAmountBaseUnits / 10 ** tokenDecimals;

            // 6. Price impact
            const priceImpactPct = parseFloat(rawData.priceImpactPct) * 100 || 0;
            const priceImpactMultiplier = 1 - priceImpactPct / 100;

            // 7. Adjust final token amount for price impact
            const effectiveTokens = normalizedOutAmount * priceImpactMultiplier;

            // 8. Convert SOL input to USD
            //    (Assuming getTokenSellPrice(this.solMint) gives you the *current* SOL→USD price)
            const solUsdPrice = await this.getTokenSellPrice(this.solMint);
            const inAmountUsdValue = solAmount * solUsdPrice;

            // 9. Now figure out the *final* USD value of the tokens you receive
            //    outputTokenUsdPrice is presumably "USD per token" for the output mint
            const effectiveUsdValue = effectiveTokens * outputTokenUsdPrice;
            if (effectiveUsdValue <= 0) {
                throw new BadRequestException("Failed to place a quote. Token USD value failed to calculate");
            }

            // 10. Also compute that final USD in terms of SOL
            const solValue = effectiveUsdValue / solUsdPrice;

            // Return the same structure you used before, plus your raw data if desired
            return {
                normalizedThresholdToken: parseFloat(effectiveTokens.toFixed(tokenDecimals)),
                inAmountUsdValue,
                usdValue: effectiveUsdValue,
                solValue,
                priceImpact: `${priceImpactPct.toFixed(2)}%`,
                slippage: `${(slippage / 100).toFixed(2)}%`,
                decimals: tokenDecimals
            };
        } catch (error) {
            console.error('Error fetching token quote:', error.response?.data || error.message);
            throw new Error('Failed to fetch token quote from Jupiter API');
        }
    }



    // Minimum SOL: 0.0001
    async getTokenQuoteSolOutput(
        inputMint: string,
        tokenAmount: number, // user-friendly decimal
        slippage: number,
    ): Promise<any> {

        // Basic parameter checks, etc.

        // 1. Get the token's actual decimals from chain
        const decimals = await this.getTokenDecimals(inputMint);

        // 2. Convert the user input to base units
        const amountInBaseUnits = Math.floor(tokenAmount * 10 ** decimals);
        if (amountInBaseUnits <= 0) {
            throw new Error('Amount is too small after converting to base units');
        }

        // 3. Construct the aggregator (Jupiter) URL
        const jupApiBase = 'https://quote-api.jup.ag/v6/quote';
        const url = `${jupApiBase}?inputMint=${inputMint}&outputMint=${this.solMint}&amount=${amountInBaseUnits}&slippageBps=${slippage}`;

        // 4. Fetch aggregator data
        const resp = await axios.get(url);
        const data = resp.data;

        // 5. Parse out the lamports, convert to SOL
        const outLamports = parseFloat(data.otherAmountThreshold || '0');
        const outSol = outLamports / 1e9;
        const solUsdPrice = await this.getTokenSellPrice(this.solMint);
        const outUsd = outSol * solUsdPrice;

        // 6. Return normalized result
        return {
            normalizedThresholdSol: outSol.toFixed(6),
            usdValue: outUsd.toFixed(4),
            priceImpactPct: (parseFloat(data.priceImpactPct) * 100 || 0).toFixed(2),
            slippage: (slippage / 100).toFixed(2) + '%',
            decimalsUsed: decimals,
            raw: data,
        };
    }


    async getTokenQuoteSolInputTest(
        outputMint: string,
        solAmount: number,
        slippage: number
      ): Promise<any> {
        if (!outputMint || !solAmount || solAmount < 0.0001) {
          throw new Error(
            'Invalid parameters: outputMint is required, and solAmount must be at least 0.0001 SOL'
          );
        }
      
        // 1. Convert SOL to lamports (1 SOL = 1e9 lamports)
        const lamports = Math.round(solAmount * 1e9);
      
        // 2. Construct Jupiter quote URL
        const jupApiUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${this.solMint}&outputMint=${outputMint}&amount=${lamports}&slippageBps=${slippage}`;
      
        // 3. Fetch aggregator data from Jupiter
        let rawData: any;
        try {
          const resp = await axios.get(jupApiUrl);
          rawData = resp.data;
        } catch (error) {
          console.error('Error fetching token quote:', error.response?.data || error.message);
          throw new Error('Failed to fetch token quote from Jupiter API');
        }
      
        // 4. Parse the aggregator response
        //    - otherAmountThreshold: guaranteed min *base units* of output token
        //    - swapUsdValue: approximate final output's total USD
        const outAmountThresholdStr = rawData.otherAmountThreshold;
        const swapUsdValueStr = rawData.swapUsdValue; // sometimes missing or 0 if no route
      
        if (!outAmountThresholdStr || !swapUsdValueStr) {
          throw new Error(
            'Jupiter did not return otherAmountThreshold or swapUsdValue.'
          );
        }
      
        const outAmountBaseUnits = parseFloat(outAmountThresholdStr);
        const swapUsdValue = parseFloat(swapUsdValueStr);
      
        if (outAmountBaseUnits <= 0 || swapUsdValue <= 0) {
          throw new Error('Invalid threshold or swapUsdValue from Jupiter.');
        }
      
        // 5. Fetch the SPL token's decimals from the chain
        //    (assuming you have a method like getTokenSupply(...) -> returns `decimals`)
        const tokenDecimals = await this.getTokenDecimals(outputMint);
      
        // 6. Convert base units to user-friendly decimal
        const rawDecimalOut = outAmountBaseUnits / 10 ** tokenDecimals;
      
        // 7. Price impact (optional check)
        const priceImpactPct = (parseFloat(rawData.priceImpactPct) || 0) * 100;
      
        // 8. The “effective” token amount (this version doesn't forcibly compute 'priceImpactMultiplier',
        //    since outAmountThreshold is already a guaranteed amount after slippage. 
        //    But if you want a "pre-impact" vs. "post-impact" number, you can do more math.)
        const normalizedThresholdToken = rawDecimalOut;
      
        // 9. Determine how much SOL we spent in USD terms
        const solUsdPrice = await this.getTokenSellPrice(this.solMint);
        const inAmountUsdValue = solAmount * solUsdPrice;
      
        // 10. The aggregator's approximate final output's total USD
        //     (we already have swapUsdValue from aggregator).
        const outUsdValue = swapUsdValue; 
      
        // 11. Also express that USD in terms of SOL, if you like:
        let solValue = outUsdValue / solUsdPrice;
        if (solValue > solAmount) {
          solValue = solAmount;  // optional clamp
        }
      
        // 12. Return both raw data and the “normalized” fields
        return {
          normalized: {
            tokenDecimals,
            // guaranteed min token amount in user-friendly decimals
            normalizedThresholdToken: parseFloat(
              normalizedThresholdToken.toFixed(tokenDecimals)
            ),
      
            // how much SOL we spent in USD
            inAmountUsdValue: parseFloat(inAmountUsdValue.toFixed(4)),
      
            // aggregator's swapUsdValue for final output in USD
            usdValue: parseFloat(outUsdValue.toFixed(4)),
      
            // optional reference in SOL
            solValue: parseFloat(solValue.toFixed(6)),
      
            priceImpact: `${priceImpactPct.toFixed(2)}%`,
            slippage: `${(slippage / 100).toFixed(2)}%`,
          },
          raw: rawData, // so you can inspect the full Jupiter response
        };
      }      


    async getTokenQuoteSolOutputTest(
        inputMint: string,
        tokenAmount: number, // user-friendly decimal
        slippage: number
    ): Promise<any> {

        // Basic parameter checks, etc.

        // 1. Get the token's actual decimals from chain
        const decimals = await this.getTokenDecimals(inputMint);

        // 2. Convert the user input to base units
        const amountInBaseUnits = Math.floor(tokenAmount * 10 ** decimals);
        if (amountInBaseUnits <= 0) {
            throw new Error('Amount is too small after converting to base units');
        }

        // 3. Construct the aggregator (Jupiter) URL
        const jupApiBase = 'https://quote-api.jup.ag/v6/quote';
        const url = `${jupApiBase}?inputMint=${inputMint}&outputMint=${this.solMint}&amount=${amountInBaseUnits}&slippageBps=${slippage}`;

        // 4. Fetch aggregator data
        const resp = await axios.get(url);
        const data = resp.data;

        // 5. Parse out the lamports, convert to SOL
        const outLamports = parseFloat(data.otherAmountThreshold || '0');
        const outSol = outLamports / 1e9;
        const solUsdPrice = await this.getTokenSellPrice(this.solMint);
        const outUsd = outSol * solUsdPrice;

        // 6. Return normalized result
        return {
            normalizedThresholdSol: outSol.toFixed(6),
            usdValue: outUsd.toFixed(4),
            priceImpactPct: (parseFloat(data.priceImpactPct) * 100 || 0).toFixed(2),
            slippage: (slippage / 100).toFixed(2) + '%',
            decimalsUsed: decimals,
            raw: data,
        };
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
                return 0;
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

    async getTokenDecimals(mintAddress: string) {
        try {
            const response = await axios.post(this.rpcUrl, {
                jsonrpc: '2.0',
                id: 1,
                method: 'getTokenSupply',
                params: [mintAddress],
            });

            return response.data.result.value.decimals; // Return supply data
        } catch (error) {
            console.error('Error fetching token supply:', error.message);
            throw new Error('Failed to fetch token supply');
        }
    }

    async getTokenMeta(mintAddress: string) {
        try {
            const res = await axios.get(`https://api.jup.ag/tokens/v1/token/${mintAddress}`);
            return {
                name: res.data.name,
                symbol: res.data.symbol,
                decimals: res.data.decimals,
                image: res.data.logoURI,
            };
        } catch (error) {
            console.error("Jupiter API Error:", error.response?.status, error.response?.data);
            throw new Error(`Jupiter API Request Failed: ${error.message}`);
        }
    }
    
}
