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
            const swapUsdValueStr = rawData.swapUsdValue; // v6 sometimes has this

            if (!outAmountThresholdStr) {
                throw new Error('No otherAmountThreshold in Jupiter response');
            }

            const outAmountBaseUnits = parseFloat(outAmountThresholdStr);

            // 4a. Check if Jupiter provided decimals in `mintInfos[...]`.
            let tokenDecimals: number | null = null;
            const mintInfos = rawData.mintInfos;
            if (mintInfos && mintInfos[outputMint]) {
                const possibleDecimals = mintInfos[outputMint].decimals;
                if (typeof possibleDecimals === 'number') {
                    tokenDecimals = possibleDecimals;
                }
            }

            // 4b. If no decimals provided, guess from swapUsdValue (heuristic).
            if (tokenDecimals == null || tokenDecimals < 0) {
                // only do this if we have swapUsdValue
                if (!swapUsdValueStr) {
                    // fallback: default to 9 if we can't guess
                    tokenDecimals = 9;
                } else {
                    const swapUsdValue = parseFloat(swapUsdValueStr);
                    if (swapUsdValue <= 0) {
                        // fallback: default to 9 if swapUsdValue is missing or invalid
                        tokenDecimals = 9;
                    } else {
                        // guess decimals by seeing which exponent yields a final USD near swapUsdValue
                        const tokenSellPrice = outputTokenUsdPrice; // or fetch your own
                        let bestD = 0;
                        let bestDiff = Number.MAX_VALUE;
                        for (let d = 0; d <= 12; d++) {
                            const rawDec = outAmountBaseUnits / 10 ** d;
                            const approxUsd = rawDec * tokenSellPrice;
                            const diff = Math.abs(approxUsd - swapUsdValue);
                            if (diff < bestDiff) {
                                bestDiff = diff;
                                bestD = d;
                            }
                        }
                        tokenDecimals = bestD;
                    }
                }
            }

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
            };
        } catch (error) {
            console.error('Error fetching token quote:', error.response?.data || error.message);
            throw new Error('Failed to fetch token quote from Jupiter API');
        }
    }



    // Minimum SOL: 0.0001
    async getTokenQuoteSolOutput(
        inputMint: string,
        tokenAmount: number,
        slippage: number
    ): Promise<any> {
        if (!inputMint || !tokenAmount || tokenAmount < 0.0001) {
            throw new Error('Invalid parameters: inputMint is required, and tokenAmount must be at least 0.0001');
        }

        const jupApiBase = 'https://quote-api.jup.ag/v6/quote';
        const tokenSellPrice = await this.getTokenSellPrice(inputMint); // USD price of the token user is selling
        const approximateUserUsd = tokenAmount * tokenSellPrice;        // roughly how much USD user is selling

        let bestDecimals = 9;
        let bestDiff = Number.MAX_VALUE;
        let bestResponse: any = null;

        // 1. Loop through d=0..12 to guess the token’s decimals
        for (let d = 0; d <= 12; d++) {
            const amountInBaseUnits = Math.floor(tokenAmount * 10 ** d);

            if (amountInBaseUnits <= 0) continue; // skip if the baseUnits is zero

            const url = `${jupApiBase}?inputMint=${inputMint}&outputMint=${this.solMint}&amount=${amountInBaseUnits}&slippageBps=${slippage}`;

            try {
                const resp = await axios.get(url);
                const data = resp.data;

                // aggregator may or may not have a swapUsdValue
                const aggregatorSwapUsd = parseFloat(data.swapUsdValue || '0');
                // If aggregatorSwapUsd is > 0, compare it
                if (aggregatorSwapUsd > 0) {
                    const diff = Math.abs(aggregatorSwapUsd - approximateUserUsd);
                    if (diff < bestDiff) {
                        bestDiff = diff;
                        bestDecimals = d;
                        bestResponse = data;
                    }
                } else {
                    // aggregator might not supply swapUsdValue, you could fallback to compare outAmountThreshold in SOL, etc.
                }
            } catch (err) {
                // aggregator call might fail or have no route for that decimal guess, ignore.
                continue;
            }
        }

        // 2. If we never found a valid aggregator response, fail
        if (!bestResponse) {
            throw new Error('Failed to find a route that matched any decimals guess 0..12');
        }

        // 3. Now parse the best aggregator response
        const raw = bestResponse;
        const outLamports = parseFloat(raw.otherAmountThreshold || '0'); // guaranteed lamports of SOL
        const outSol = outLamports / 1e9; // decimal SOL
        const solUsdPrice = await this.getTokenSellPrice(this.solMint);
        const outUsd = outSol * solUsdPrice;
        const priceImpactPct = parseFloat(raw.priceImpactPct) * 100 || 0;

        return {
            normalizedThresholdSol: outSol.toFixed(6),
            usdValue: outUsd.toFixed(4),
            priceImpactPct: priceImpactPct.toFixed(2),
            slippage: (slippage / 100).toFixed(2) + '%',
            guessedDecimals: bestDecimals,
            raw,
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

        // 2. Call Jupiter for the quote
        const jupApiUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${this.solMint}&outputMint=${outputMint}&amount=${lamports}&slippageBps=${slippage}`;

        try {
            const quoteResponse = await axios.get(jupApiUrl);
            const rawData = quoteResponse.data;

            // 3. Parse the raw Jupiter fields
            //    - otherAmountThreshold: guaranteed min *base units* of output token
            //    - swapUsdValue: approximate final output's total USD
            const outAmountThresholdStr = rawData.otherAmountThreshold;
            const swapUsdValueStr = rawData.swapUsdValue; // v6 sometimes has this
            if (!outAmountThresholdStr || !swapUsdValueStr) {
                throw new Error('Jupiter did not return otherAmountThreshold or swapUsdValue.');
            }

            const outAmountBaseUnits = parseFloat(outAmountThresholdStr);
            const swapUsdValue = parseFloat(swapUsdValueStr);
            if (outAmountBaseUnits <= 0 || swapUsdValue <= 0) {
                throw new Error('Invalid threshold or swapUsdValue from Jupiter.');
            }

            // 4. Find the token's decimals by “guessing” which exponent yields a USD value
            //    close to swapUsdValue when multiplied by the token’s price in USD.
            //    We’ll loop from 0..12 and see which yields the smallest difference.
            const tokenSellPrice = await this.getTokenSellPrice(outputMint); // token's USD price
            let bestDecimals = 0;
            let bestDiff = Number.MAX_VALUE;

            for (let d = 0; d <= 12; d++) {
                const outDecimal = outAmountBaseUnits / 10 ** d; // if the token had d decimals
                const approxUsd = outDecimal * tokenSellPrice;   // approximate final USD value
                const diff = Math.abs(approxUsd - swapUsdValue); // how close to Jupiter's swapUsdValue
                if (diff < bestDiff) {
                    bestDiff = diff;
                    bestDecimals = d;
                }
            }

            // 5. Now we have a guessed decimals = bestDecimals
            //    Convert to decimal token amount using that guess
            const rawDecimalOut = outAmountBaseUnits / 10 ** bestDecimals;

            // 6. Price impact
            const priceImpactPct = parseFloat(rawData.priceImpactPct) * 100;
            const priceImpactMultiplier = 1 - priceImpactPct / 100;

            // 7. The “effective” token amount (after price impact)
            const effectiveTokens = rawDecimalOut * priceImpactMultiplier;

            // 8. Compute what user spent in USD (SOL -> USD)
            const solUsdPrice = await this.getTokenSellPrice(this.solMint);
            const inAmountUsdValue = solAmount * solUsdPrice;

            // 9. Final USD of the tokens received
            const effectiveUsdValue = effectiveTokens * tokenSellPrice;

            // 10. Also express that in SOL
            let solValue = effectiveUsdValue / solUsdPrice;
            // Optional clamp: If your logic wants to prevent it from exceeding input SOL:
            if (solValue > solAmount) {
                solValue = solAmount;
            }

            // 11. Return both raw data and the “normalized” fields
            return {
                normalized: {
                    decimalsGuessed: bestDecimals,
                    normalizedThresholdToken: parseFloat(effectiveTokens.toFixed(bestDecimals)),
                    inAmountUsdValue,
                    usdValue: parseFloat(effectiveUsdValue.toFixed(4)),
                    solValue: parseFloat(solValue.toFixed(6)),
                    priceImpact: `${priceImpactPct.toFixed(2)}%`,
                    slippage: `${(slippage / 100).toFixed(2)}%`,
                },
                raw: rawData, // so you can inspect the full Jupiter response
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

        // 1. Fetch aggregator data from Jupiter
        //    We don't yet know how many decimals the input token has, so we'll guess or fallback
        const jupApiBase = 'https://quote-api.jup.ag/v6/quote';
        // We'll start by leaving `amount` blank, then guess the decimals. 
        // Actually, we can do the same “decimals guess” approach:
        // we do 0..12 and see which yields a "swapUsdValue" close to "tokenAmount * tokenSellPrice"
        // Or a simpler approach: call /price API or call the aggregator once with a default, then refine.

        // For a simpler example, let's do exactly what we did with `getTokenQuoteSolInputTest`:
        // - Hardcode `tokenDecimals=6` => Then adjust to guess from aggregator's `swapUsdValue`.
        //   This is the test approach.

        const tokenSellPrice = await this.getTokenSellPrice(inputMint); // USD price of input token
        const approximateUserUsd = tokenAmount * tokenSellPrice;        // approx how many USD user is selling

        // 2. We'll guess the input token decimals by seeing which `d` yields a swapUsdValue near `approximateUserUsd`.
        //    (If aggregator's 'swapUsdValue' is missing or inaccurate, fallback to 9 or 6.)
        //    We'll do a quick helper function:

        // a) Try decimals from 0..12. 
        // b) For each, we do amountInBaseUnits = floor(tokenAmount * 10^d).
        // c) We call aggregator, parse 'swapUsdValue' for how many SOL in USD we get. 
        // d) Compare difference vs. `approximateUserUsd`.

        let bestDecimals = 9;
        let bestDiff = Number.MAX_VALUE;
        let bestResponse = null;

        for (let d = 0; d <= 12; d++) {
            const amountInBaseUnits = Math.floor(tokenAmount * 10 ** d);

            // If the user typed e.g. "89048.993039783" tokens,
            // we must not pass 0 lamports. So skip if amountInBaseUnits=0 
            if (amountInBaseUnits <= 0) continue;

            const url = `${jupApiBase}?inputMint=${inputMint}&outputMint=${this.solMint}&amount=${amountInBaseUnits}&slippageBps=${slippage}`;
            try {
                const resp = await axios.get(url);
                const data = resp.data;
                const aggregatorSwapUsd = parseFloat(data.swapUsdValue || '0');
                if (aggregatorSwapUsd > 0) {
                    const diff = Math.abs(aggregatorSwapUsd - approximateUserUsd);
                    if (diff < bestDiff) {
                        bestDiff = diff;
                        bestDecimals = d;
                        bestResponse = data;
                    }
                } else {
                    // aggregator might not supply swapUsdValue or be zero
                    // skip or handle differently
                }
            } catch (err) {
                // aggregator might fail for some decimals or there's no route
                // just ignore and continue
            }
        }

        // If we never found anything better, fallback to bestResponse or do another fallback
        if (!bestResponse) {
            throw new Error('Failed to find a route that matched a decimals guess from 0..12');
        }

        // 3. Now we parse final bestResponse
        const raw = bestResponse;
        const outLamports = parseFloat(raw.otherAmountThreshold || '0'); // guaranteed lamports of SOL
        const outSol = outLamports / 1e9; // convert to decimal SOL
        const solUsdPrice = await this.getTokenSellPrice(this.solMint);
        const outUsd = outSol * solUsdPrice;
        const priceImpactPct = parseFloat(raw.priceImpactPct) * 100 || 0;

        return {
            normalized: {
                decimalsGuessed: bestDecimals,
                guaranteedSol: parseFloat(outSol.toFixed(6)),
                guaranteedUsd: parseFloat(outUsd.toFixed(4)),
                priceImpactPct: priceImpactPct.toFixed(2),
                slippage: `${(slippage / 100).toFixed(2)}%`,
                userUsdApprox: approximateUserUsd,
            },
            raw,
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
