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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolanaService = void 0;
const common_1 = require("@nestjs/common");
const web3_js_1 = require("@solana/web3.js");
const axios_1 = require("axios");
let SolanaService = class SolanaService {
    constructor() {
        this.solMint = 'So11111111111111111111111111111111111111112';
        this.rpcUrl = process.env.QUICKNODE_RPC_URL;
        this.connection = new web3_js_1.Connection(this.rpcUrl, 'confirmed');
    }
    async getTokenQuoteSolInput(outputMint, solAmount, slippage, outputTokenUsdPrice) {
        if (!outputMint || !solAmount || solAmount < 0.0001) {
            throw new Error('Invalid parameters...');
        }
        const lamports = Math.round(solAmount * 1e9);
        const jupApiUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${this.solMint}&outputMint=${outputMint}&amount=${lamports}&slippageBps=${slippage}`;
        try {
            const quoteResponse = await axios_1.default.get(jupApiUrl);
            const rawData = quoteResponse.data;
            const outAmountThresholdStr = rawData.otherAmountThreshold;
            const swapUsdValueStr = rawData.swapUsdValue;
            if (!outAmountThresholdStr) {
                throw new Error('No otherAmountThreshold in Jupiter response');
            }
            const outAmountBaseUnits = parseFloat(outAmountThresholdStr);
            const tokenDecimals = await this.getTokenDecimals(outputMint);
            const normalizedOutAmount = outAmountBaseUnits / 10 ** tokenDecimals;
            const priceImpactPct = parseFloat(rawData.priceImpactPct) * 100 || 0;
            const priceImpactMultiplier = 1 - priceImpactPct / 100;
            const effectiveTokens = normalizedOutAmount * priceImpactMultiplier;
            const solUsdPrice = await this.getTokenSellPrice(this.solMint);
            const inAmountUsdValue = solAmount * solUsdPrice;
            const effectiveUsdValue = effectiveTokens * outputTokenUsdPrice;
            if (effectiveUsdValue <= 0) {
                throw new common_1.BadRequestException("Failed to place a quote. Token USD value failed to calculate");
            }
            const solValue = effectiveUsdValue / solUsdPrice;
            return {
                normalizedThresholdToken: parseFloat(effectiveTokens.toFixed(tokenDecimals)),
                inAmountUsdValue,
                usdValue: effectiveUsdValue,
                solValue,
                priceImpact: `${priceImpactPct.toFixed(2)}%`,
                slippage: `${(slippage / 100).toFixed(2)}%`,
                decimals: tokenDecimals
            };
        }
        catch (error) {
            console.error('Error fetching token quote:', error.response?.data || error.message);
            throw new Error('Failed to fetch token quote from Jupiter API');
        }
    }
    async getTokenQuoteSolOutput(inputMint, tokenAmount, slippage) {
        const decimals = await this.getTokenDecimals(inputMint);
        const amountInBaseUnits = Math.floor(tokenAmount * 10 ** decimals);
        if (amountInBaseUnits <= 0) {
            throw new Error('Amount is too small after converting to base units');
        }
        const jupApiBase = 'https://quote-api.jup.ag/v6/quote';
        const url = `${jupApiBase}?inputMint=${inputMint}&outputMint=${this.solMint}&amount=${amountInBaseUnits}&slippageBps=${slippage}`;
        const resp = await axios_1.default.get(url);
        const data = resp.data;
        const outLamports = parseFloat(data.otherAmountThreshold || '0');
        const outSol = outLamports / 1e9;
        const solUsdPrice = await this.getTokenSellPrice(this.solMint);
        const outUsd = outSol * solUsdPrice;
        return {
            normalizedThresholdSol: outSol.toFixed(6),
            usdValue: outUsd.toFixed(4),
            priceImpactPct: (parseFloat(data.priceImpactPct) * 100 || 0).toFixed(2),
            slippage: (slippage / 100).toFixed(2) + '%',
            decimalsUsed: decimals,
            raw: data,
        };
    }
    async getTokenQuoteSolInputTest(outputMint, solAmount, slippage) {
        if (!outputMint || !solAmount || solAmount < 0.0001) {
            throw new Error('Invalid parameters: outputMint is required, and solAmount must be at least 0.0001 SOL');
        }
        const lamports = Math.round(solAmount * 1e9);
        const jupApiUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${this.solMint}&outputMint=${outputMint}&amount=${lamports}&slippageBps=${slippage}`;
        let rawData;
        try {
            const resp = await axios_1.default.get(jupApiUrl);
            rawData = resp.data;
        }
        catch (error) {
            console.error('Error fetching token quote:', error.response?.data || error.message);
            throw new Error('Failed to fetch token quote from Jupiter API');
        }
        const outAmountThresholdStr = rawData.otherAmountThreshold;
        const swapUsdValueStr = rawData.swapUsdValue;
        if (!outAmountThresholdStr || !swapUsdValueStr) {
            throw new Error('Jupiter did not return otherAmountThreshold or swapUsdValue.');
        }
        const outAmountBaseUnits = parseFloat(outAmountThresholdStr);
        const swapUsdValue = parseFloat(swapUsdValueStr);
        if (outAmountBaseUnits <= 0 || swapUsdValue <= 0) {
            throw new Error('Invalid threshold or swapUsdValue from Jupiter.');
        }
        const tokenDecimals = await this.getTokenDecimals(outputMint);
        const rawDecimalOut = outAmountBaseUnits / 10 ** tokenDecimals;
        const priceImpactPct = (parseFloat(rawData.priceImpactPct) || 0) * 100;
        const normalizedThresholdToken = rawDecimalOut;
        const solUsdPrice = await this.getTokenSellPrice(this.solMint);
        const inAmountUsdValue = solAmount * solUsdPrice;
        const outUsdValue = swapUsdValue;
        let solValue = outUsdValue / solUsdPrice;
        if (solValue > solAmount) {
            solValue = solAmount;
        }
        return {
            normalized: {
                tokenDecimals,
                normalizedThresholdToken: parseFloat(normalizedThresholdToken.toFixed(tokenDecimals)),
                inAmountUsdValue: parseFloat(inAmountUsdValue.toFixed(4)),
                usdValue: parseFloat(outUsdValue.toFixed(4)),
                solValue: parseFloat(solValue.toFixed(6)),
                priceImpact: `${priceImpactPct.toFixed(2)}%`,
                slippage: `${(slippage / 100).toFixed(2)}%`,
            },
            raw: rawData,
        };
    }
    async getTokenQuoteSolOutputTest(inputMint, tokenAmount, slippage) {
        const decimals = await this.getTokenDecimals(inputMint);
        const amountInBaseUnits = Math.floor(tokenAmount * 10 ** decimals);
        if (amountInBaseUnits <= 0) {
            throw new Error('Amount is too small after converting to base units');
        }
        const jupApiBase = 'https://quote-api.jup.ag/v6/quote';
        const url = `${jupApiBase}?inputMint=${inputMint}&outputMint=${this.solMint}&amount=${amountInBaseUnits}&slippageBps=${slippage}`;
        const resp = await axios_1.default.get(url);
        const data = resp.data;
        const outLamports = parseFloat(data.otherAmountThreshold || '0');
        const outSol = outLamports / 1e9;
        const solUsdPrice = await this.getTokenSellPrice(this.solMint);
        const outUsd = outSol * solUsdPrice;
        return {
            normalizedThresholdSol: outSol.toFixed(6),
            usdValue: outUsd.toFixed(4),
            priceImpactPct: (parseFloat(data.priceImpactPct) * 100 || 0).toFixed(2),
            slippage: (slippage / 100).toFixed(2) + '%',
            decimalsUsed: decimals,
            raw: data,
        };
    }
    async getTokenData(mintAddress) {
        try {
            const tokenData = await this.getTokenMetadata(mintAddress);
            return tokenData;
        }
        catch (error) {
            console.error('Error fetching token data:', error.message);
            throw new Error(`Failed to fetch token data: ${error.message}`);
        }
    }
    async getBulkTokenData(mintAddresses) {
        try {
            const MAX_MINT_ADDRESSES = 30;
            const results = [];
            for (let i = 0; i < mintAddresses.length; i += MAX_MINT_ADDRESSES) {
                const batch = mintAddresses.slice(i, i + MAX_MINT_ADDRESSES);
                const mintAddressQuery = batch.join(',');
                const apiUrl = `https://api.dexscreener.com/latest/dex/tokens/${mintAddressQuery}`;
                const response = await axios_1.default.get(apiUrl);
                results.push(response.data);
            }
            return results;
        }
        catch (error) {
            console.error('Error fetching bulk token data:', error.message);
            throw new Error(`Failed to fetch bulk token data: ${error.message}`);
        }
    }
    async getTokenPrice(mintAddress) {
        try {
            const jupApiUrl = `https://api.jup.ag/price/v2?ids=${mintAddress.trim()},So11111111111111111111111111111111111111112`;
            const response = await axios_1.default.get(jupApiUrl);
            if (!response.data) {
                throw new Error('No price data found for the provided mint address');
            }
            const price = parseFloat(response.data.data[mintAddress.trim()].price);
            if (isNaN(price)) {
                throw new Error('Invalid price data found for the provided mint address');
            }
            return price;
        }
        catch (error) {
            console.error('Error fetching price:', error.message);
            throw new Error(`Failed to fetch token price: ${error.message}`);
        }
    }
    async getTokenSellPrice(mintAddress) {
        try {
            const jupApiUrl = `https://api.jup.ag/price/v2?ids=${mintAddress.trim()},So11111111111111111111111111111111111111112&showExtraInfo=true`;
            const response = await axios_1.default.get(jupApiUrl);
            if (!response.data) {
                throw new Error('No price data found for the provided mint address');
            }
            const tokenData = response.data.data[mintAddress.trim()];
            if (!tokenData) {
                throw new Error(`No token data found for ${mintAddress.trim()}`);
            }
            const sellPriceStr = tokenData?.extraInfo?.quotedPrice?.sellPrice;
            if (!sellPriceStr) {
                throw new Error("The token has no Liquidity and cannot be sold");
            }
            const sellPriceNum = parseFloat(sellPriceStr);
            if (isNaN(sellPriceNum)) {
                throw new Error('Invalid sellPrice data found for the provided mint address');
            }
            return sellPriceNum;
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            console.error('Error fetching price:', error.message);
            throw new Error(`Failed to fetch token price: ${error.message}`);
        }
    }
    async getTokenMetadata(mintAddress) {
        try {
            const apiUrl = `https://api.dexscreener.com/latest/dex/tokens/${mintAddress}`;
            const response = await axios_1.default.get(apiUrl);
            if (!response.data || !response.data.pairs || response.data.pairs.length === 0) {
                throw new Error('No pair data found for the provided mint address');
            }
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
        }
        catch (error) {
            console.error('Error fetching metadata:', error.message);
            throw new Error(`Failed to fetch token metadata: ${error.message}`);
        }
    }
    async getTokenDecimals(mintAddress) {
        try {
            const response = await axios_1.default.post(this.rpcUrl, {
                jsonrpc: '2.0',
                id: 1,
                method: 'getTokenSupply',
                params: [mintAddress],
            });
            return response.data.result.value.decimals;
        }
        catch (error) {
            console.error('Error fetching token supply:', error.message);
            throw new Error('Failed to fetch token supply');
        }
    }
};
exports.SolanaService = SolanaService;
exports.SolanaService = SolanaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SolanaService);
//# sourceMappingURL=solana.service.js.map