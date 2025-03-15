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
exports.ApeService = void 0;
const token_metadata_service_1 = require("./../metadata/token_metadata.service");
const common_1 = require("@nestjs/common");
const sol_balance_service_1 = require("../balance/sol_balance.service");
const user_service_1 = require("../user/user.service");
const solana_service_1 = require("../solana/solana.service");
const ape_holding_service_1 = require("../ape_holdings/ape_holding.service");
const ape_entry_service_1 = require("../ape_entry/ape_entry.service");
const ape_exit_service_1 = require("../ape_exit/ape_exit.service");
const stats_service_1 = require("../stats/stats.service");
let ApeService = class ApeService {
    constructor(solBalanceService, userService, solanaService, apeHoldingService, apeEntryService, apeExitService, statService, tokenMetadataService) {
        this.solBalanceService = solBalanceService;
        this.userService = userService;
        this.solanaService = solanaService;
        this.apeHoldingService = apeHoldingService;
        this.apeEntryService = apeEntryService;
        this.apeExitService = apeExitService;
        this.statService = statService;
        this.tokenMetadataService = tokenMetadataService;
        this.solMint = 'So11111111111111111111111111111111111111112';
    }
    async createApeEntry(userId, createApeEntryDto) {
        const user = await this.userService.findUserById(userId);
        if (!user) {
            throw new Error("Failed to create entry. User not found");
        }
        const userStat = await this.statService.findStatByUserId(userId);
        if (!userStat) {
            throw new Error("Failed to create entry. Stats not found.");
        }
        const solPrice = await this.solanaService.getTokenSellPrice(this.solMint);
        const balance = await this.solBalanceService.findBalanceByUserId(userId);
        if (!balance) {
            throw new common_1.BadRequestException("Failed to create entry. Balance not found");
        }
        try {
            let localPrice = await this.solanaService.getTokenPrice(createApeEntryDto.mintAddress);
            if (!localPrice || localPrice <= 0) {
                for (let i = 0; i < 6; i++) {
                    localPrice = await this.solanaService.getTokenPrice(createApeEntryDto.mintAddress);
                    if (localPrice > 0)
                        break;
                }
            }
            if (!localPrice || localPrice <= 0) {
                throw new Error("Failed to get the token price on entry");
            }
            const tokenQuote = await this.solanaService.getTokenQuoteSolInput(createApeEntryDto.mintAddress, createApeEntryDto.amount - 0.025, 250, localPrice);
            if (!tokenQuote) {
                throw new Error("Failed to get a quote for this token.");
            }
            console.log("Fetching token metadata...");
            const tokenMetadata = await this.solanaService.getTokenMeta(createApeEntryDto.mintAddress)
                .catch(error => {
                console.error("Failed to fetch metadata, using default values:", error);
                return null;
            });
            console.log(`Token metadata is ${tokenMetadata?.name}`);
            const amountOfTokensReceived = tokenQuote.normalizedThresholdToken;
            const valueUsd = tokenQuote.usdValue;
            const valueSol = tokenQuote.solValue;
            const name = tokenMetadata?.name ?? "N/A";
            const ticker = tokenMetadata?.symbol ?? "N/A";
            const image = tokenMetadata?.image ?? "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR2gON53SU6YuM98Z1867Yn63flCGGDnC7mIw&s";
            const pnl = parseFloat(valueUsd) - parseFloat(tokenQuote.inAmountUsdValue);
            const holding = await this.apeHoldingService.findApeHoldingByUserIdAndMintAddress(userId, createApeEntryDto.mintAddress);
            let newHolding = false;
            let uniqueToken = false;
            let tokenPrice = 0;
            const entries = await this.apeEntryService.findAllApeEntriesByUserIdAndMintAddress(userId, createApeEntryDto.mintAddress);
            if (entries.length === 0) {
                uniqueToken = true;
            }
            if (!holding) {
                newHolding = true;
                try {
                    console.log("Getting possible price");
                    const possiblePrice = await this.solanaService.getTokenPrice(createApeEntryDto.mintAddress);
                    if (possiblePrice > 0) {
                        tokenPrice = possiblePrice;
                    }
                    else {
                        throw new Error("No valid price fetched on ape entry");
                    }
                }
                catch (error) {
                    throw new Error("Failed to create an entry due to failed price fetch");
                }
                await this.apeHoldingService.createApeHolding({
                    user,
                    mintAddress: createApeEntryDto.mintAddress,
                    amount: amountOfTokensReceived,
                    price: tokenPrice,
                    average_price: tokenPrice,
                    value_usd: valueUsd,
                    value_sol: valueSol,
                    pnl
                });
            }
            else {
                try {
                    console.log("Getting possible price");
                    const possiblePrice = await this.solanaService.getTokenPrice(createApeEntryDto.mintAddress);
                    if (possiblePrice > 0) {
                        tokenPrice = possiblePrice;
                    }
                    else {
                        tokenPrice = 0;
                    }
                }
                catch (error) {
                    throw new Error(`No token liquidity or failed to fetch a token sell price${error}`);
                }
                let updatedUsdValue = holding.value_usd;
                let updatedSolValue = holding.value_sol;
                if (holding.mintAddress && holding.amount >= 0.0001) {
                    try {
                        const tokenQuoteUpdate = await this.solanaService.getTokenQuoteSolOutput(holding.mintAddress, holding.amount, 250);
                        if (tokenQuoteUpdate) {
                            updatedUsdValue = parseFloat(tokenQuoteUpdate.usdValue);
                            updatedSolValue = parseFloat(tokenQuoteUpdate.normalizedThresholdSol);
                        }
                    }
                    catch (error) {
                        throw new Error(`Failed to update token quote for entire holding, proceeding with current values:${error}`);
                    }
                }
                else {
                    if (!holding.mintAddress) {
                        console.log('No mintAddress in holding, skipping getTokenQuoteSolOutput');
                    }
                    else {
                        console.log('holding.amount < 0.0001, skipping getTokenQuoteSolOutput');
                    }
                }
                const updatedApeHolding = await this.apeHoldingService.updateApeHoldingEntry(holding, amountOfTokensReceived, tokenPrice, updatedUsdValue, updatedSolValue, parseFloat(valueUsd), parseFloat(valueSol));
                if (!updatedApeHolding) {
                    throw new common_1.BadRequestException('Failed to update your holding, try again');
                }
            }
            const updatedBalance = await this.solBalanceService.updateBalanceSubtract(balance, createApeEntryDto.amount, solPrice);
            if (!updatedBalance) {
                throw new common_1.BadRequestException('Failed to update SOL balance. Please try again');
            }
            const entry = await this.apeEntryService.createApeEntry({
                user,
                mintAddress: createApeEntryDto.mintAddress,
                amount: amountOfTokensReceived,
                value_usd: valueUsd,
                value_sol: valueSol,
                price: localPrice,
            });
            const updatedStats = await this.statService.updateStatOnEntry(userStat, newHolding, uniqueToken);
            if (!updatedStats) {
                throw new Error('Failed to update user stats');
            }
            console.log("Fetching existing metadata...");
            const existingMetadata = await this.tokenMetadataService.findTokenDataByMintAddress(createApeEntryDto.mintAddress);
            if (existingMetadata) {
                console.log("Metadata exists, returning values");
                return {
                    id: entry.id,
                    solBalance: updatedBalance.balance,
                    usdBalance: updatedBalance.balance_usd,
                    mintAddress: entry.mintAddress,
                    amount: entry.amount,
                    value_usd: entry.value_usd,
                    value_sol: entry.value_sol,
                    inValueUsd: tokenQuote.inAmountUsdValue,
                    pnl,
                    price: entry.price,
                    name: existingMetadata.name,
                    ticker: existingMetadata.ticker,
                    image: existingMetadata.image,
                    createdAt: entry.createdAt,
                    updatedAt: entry.updatedAt,
                };
            }
            console.log(`Creating metadata: ${name}, ${ticker}, ${image}`);
            const newMetadata = await this.tokenMetadataService.createTokenMetadata({
                name,
                ticker,
                mint_address: createApeEntryDto.mintAddress,
                image,
                website: "Ape",
                x_page: "Ape",
                telegram: "Ape",
            });
            if (!newMetadata) {
                throw new Error("Failed to create a metadata object");
            }
            return {
                id: entry.id,
                solBalance: updatedBalance.balance,
                usdBalance: updatedBalance.balance_usd,
                mintAddress: entry.mintAddress,
                amount: entry.amount,
                value_usd: entry.value_usd,
                value_sol: entry.value_sol,
                inValueUsd: tokenQuote.inAmountUsdValue,
                pnl,
                price: entry.price,
                name: name,
                ticker: ticker,
                image: image,
                createdAt: entry.createdAt,
                updatedAt: entry.updatedAt,
            };
        }
        catch (error) {
            throw new Error(error);
        }
    }
    async createApeExit(userId, createApeExitDto) {
        const user = await this.userService.findUserById(userId);
        if (!user) {
            throw new common_1.BadRequestException("User not found");
        }
        const userStat = await this.statService.findStatByUserId(userId);
        if (!userStat) {
            throw new Error("Stats object not found");
        }
        const solPrice = await this.solanaService.getTokenPrice(this.solMint);
        const balance = await this.solBalanceService.getBalanceDataByUserId(userId, solPrice);
        if (!balance) {
            throw new common_1.BadRequestException('User balance not found');
        }
        try {
            const tokenQuote = await this.solanaService.getTokenQuoteSolOutput(createApeExitDto.mintAddress, createApeExitDto.amount, 250);
            if (!tokenQuote) {
                throw new common_1.BadRequestException('Failed to fetch token quote');
            }
            const solReceived = parseFloat(tokenQuote.normalizedThresholdSol);
            const solUsdValue = tokenQuote.usdValue;
            const tokenData = await this.solanaService.getTokenMeta(createApeExitDto.mintAddress);
            if (!tokenData) {
                throw new common_1.BadRequestException('Token not found');
            }
            const holding = await this.apeHoldingService.findApeHoldingByUserIdAndMintAddress(userId, createApeExitDto.mintAddress);
            if (!holding) {
                throw new common_1.BadRequestException('No existing holding found for this token. Cannot exit a position that does not exist.');
            }
            if (holding.amount < createApeExitDto.amount) {
                throw new common_1.BadRequestException('Not enough tokens in holding to sell this amount');
            }
            const tokenPrice = tokenQuote.usdValue / createApeExitDto.amount;
            const sellPrice = parseFloat(tokenPrice.toFixed(12));
            const currentAveragePrice = parseFloat(holding.average_price.toString()) || 0;
            const tokensSold = parseFloat(createApeExitDto.amount.toString());
            const realizedPnl = (sellPrice - currentAveragePrice) * tokensSold;
            const updatedBalance = await this.solBalanceService.updateBalanceAdd(balance, solReceived, solUsdValue);
            if (!updatedBalance) {
                throw new common_1.BadRequestException('Failed to update user balance');
            }
            const exitRecord = await this.apeExitService.createApeExit({
                user,
                mintAddress: createApeExitDto.mintAddress,
                amount: tokensSold,
                value_usd: solUsdValue,
                value_sol: solReceived,
                price: sellPrice,
                pnl: parseFloat(realizedPnl.toFixed(4)),
            });
            const updatedHolding = await this.apeHoldingService.updateApeHoldingExit(holding, tokensSold, holding.value_usd, holding.value_sol, solUsdValue, solReceived);
            if (!updatedHolding) {
                throw new common_1.BadRequestException('Failed to update holding on exit');
            }
            let deletedHolding = false;
            if (updatedHolding.amount <= 0.0000001) {
                await this.apeHoldingService.deleteApeHolding(updatedHolding);
                deletedHolding = true;
            }
            console.log("Updating user stats");
            const totalWins = (await this.apeExitService.findAllApeExitWinsByUserId(userId)).length;
            const updatedStats = await this.statService.updateStatOnExit(userStat, totalWins, parseFloat(realizedPnl.toFixed(4)), deletedHolding);
            if (!updatedStats) {
                throw new Error('Failed to update user stats');
            }
            await this.updateApeHoldingsPrice(userId);
            const reFetchedStat = await this.statService.findStatByUserId(userId);
            const tokenMetadata = await this.tokenMetadataService.findTokenDataByMintAddress(createApeExitDto.mintAddress);
            return {
                exit: {
                    id: exitRecord.id,
                    mintAddress: exitRecord.mintAddress,
                    amount: exitRecord.amount,
                    value_usd: exitRecord.value_usd,
                    value_sol: exitRecord.value_sol,
                    price: exitRecord.price,
                    pnl: exitRecord.pnl,
                    createdAt: exitRecord.createdAt,
                    updatedAt: exitRecord.updatedAt,
                },
                updatedHolding: updatedHolding?.id
                    ? {
                        id: updatedHolding.id,
                        mintAddress: updatedHolding.mintAddress,
                        amount: updatedHolding.amount,
                        price: updatedHolding.price,
                        average_price: updatedHolding.average_price,
                        value_usd: updatedHolding.value_usd,
                        value_sol: updatedHolding.value_sol,
                        pnl: updatedHolding.pnl,
                        createdAt: updatedHolding.createdAt,
                        updatedAt: updatedHolding.updatedAt,
                    }
                    : null,
                stats: {
                    totalExits: reFetchedStat.total_exits,
                    currentHoldings: reFetchedStat.current_holdings,
                    totalPnl: reFetchedStat.total_pnl,
                    realizedPnl: reFetchedStat.realized_pnl,
                    winrate: reFetchedStat.winrate,
                    createdAt: reFetchedStat.createdAt,
                    updatedAt: reFetchedStat.updatedAt,
                },
                metadata: {
                    name: tokenMetadata.name,
                    image: tokenMetadata.image
                },
                newBalance: updatedBalance.balance,
                newBalanceUsd: updatedBalance.balance_usd,
            };
        }
        catch (error) {
            throw new Error(error);
        }
    }
    async updateApeHoldingsPrice(userId) {
        console.log("UpdateHoldingsPrice called");
        const userStat = await this.statService.findStatByUserId(userId);
        if (!userStat) {
            throw new common_1.BadRequestException('Failed to update user stats. Please try again');
        }
        const holdings = await this.apeHoldingService.findApeHoldingsByUserId(userId);
        console.log(`UserID: ${userId}`);
        if (!holdings || holdings.length === 0) {
            console.log(`User ${userId} has 0 holdings => set unrealizedPnl to 0`);
            await this.statService.updateStatOnHoldingUpdate(userStat, 0);
            return [];
        }
        const solPrice = await this.solanaService.getTokenPrice(this.solMint);
        if (!solPrice) {
            throw new common_1.BadRequestException('Failed to fetch price of SOL. Try again');
        }
        let newUnrealizedPnl = 0;
        let errors = [];
        await Promise.all(holdings.map(async (holding) => {
            let newPrice = holding.price;
            console.log(`Mint address: ${holding.mintAddress}`);
            const metadata = await this.tokenMetadataService.findTokenDataByMintAddress(holding.mintAddress);
            if (metadata.name === "N/A") {
                const newMetadata = await this.solanaService.getTokenMeta(holding.mintAddress)
                    .catch(error => {
                    console.error("Failed to fetch metadata on holding update");
                });
                if (newMetadata) {
                    await this.tokenMetadataService.updateTokenMetadata(newMetadata.symbol, newMetadata.name, newMetadata.image, metadata)
                        .catch(error => {
                        console.error("Failed to update metadata on holding update");
                    });
                }
            }
            try {
                const possiblePrice = await this.solanaService.getTokenPrice(holding.mintAddress);
                newPrice = possiblePrice;
            }
            catch (error) {
                const errorMessage = `The token ${holding.mintAddress} has no liquidity or failed to fetch token price`;
                console.log(errorMessage);
                errors.push({ mintAddress: holding.mintAddress, message: errorMessage });
            }
            await this.apeHoldingService.updateApeHoldingPnl(holding, newPrice);
            await this.apeHoldingService.updateApeHoldingPrice(holding, newPrice, solPrice);
            newUnrealizedPnl += holding.pnl;
        }));
        const updatedHoldings = await this.apeHoldingService.findApeHoldingsByUserId(userId);
        const enrichedData = await Promise.all(updatedHoldings.map(async (item) => {
            const metadata = await this.tokenMetadataService.findTokenDataByMintAddress(item.mintAddress);
            return {
                ...item,
                name: metadata?.name || 'Unknown',
                ticker: metadata?.ticker || 'Unknown',
                image: metadata?.image || null,
            };
        }));
        const sanitizedData = enrichedData.map(({ id, user, ...rest }) => rest);
        await this.statService.updateStatOnHoldingUpdate(userStat, newUnrealizedPnl);
        return ({ holdings: sanitizedData, errors });
    }
    async getAllUserApeHoldings(userId) {
        const user = await this.userService.findUserById(userId);
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        const holdings = await this.apeHoldingService.findApeHoldingsByUserId(userId);
        if (!holdings || holdings.length === 0) {
            return [];
        }
        const enrichedData = await Promise.all(holdings.map(async (item) => {
            const metadata = await this.tokenMetadataService.findTokenDataByMintAddress(item.mintAddress);
            return {
                ...item,
                name: metadata?.name || 'Unknown',
                ticker: metadata?.ticker || 'Unknown',
                image: metadata?.image || null,
            };
        }));
        const sanitizedData = enrichedData.map(({ id, user, ...rest }) => rest);
        return sanitizedData;
    }
};
exports.ApeService = ApeService;
exports.ApeService = ApeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [sol_balance_service_1.SolBalanceService,
        user_service_1.UserService,
        solana_service_1.SolanaService,
        ape_holding_service_1.ApeHoldingService,
        ape_entry_service_1.ApeEntryService,
        ape_exit_service_1.ApeExitService,
        stats_service_1.StatService,
        token_metadata_service_1.TokenMetadataService])
], ApeService);
//# sourceMappingURL=ape.service.js.map