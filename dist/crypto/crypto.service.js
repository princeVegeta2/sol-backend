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
exports.CryptoService = void 0;
const common_1 = require("@nestjs/common");
const solana_service_1 = require("../solana/solana.service");
const entry_service_1 = require("../entries/entry.service");
const user_service_1 = require("../user/user.service");
const holding_service_1 = require("../holdings/holding.service");
const token_metadata_service_1 = require("../metadata/token_metadata.service");
const exit_service_1 = require("../exits/exit.service");
const sol_balance_service_1 = require("../balance/sol_balance.service");
const stats_service_1 = require("../stats/stats.service");
let CryptoService = class CryptoService {
    constructor(solanaService, entryService, userService, holdingService, tokenMetadataService, exitService, solBalanceService, statService) {
        this.solanaService = solanaService;
        this.entryService = entryService;
        this.userService = userService;
        this.holdingService = holdingService;
        this.tokenMetadataService = tokenMetadataService;
        this.exitService = exitService;
        this.solBalanceService = solBalanceService;
        this.statService = statService;
        this.solMint = 'So11111111111111111111111111111111111111112';
    }
    async createExit(userId, createExitDto) {
        console.log(`Validating the user. ID ${userId}`);
        const user = await this.userService.findUserById(userId);
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        console.log(`Finding the user stats`);
        const userStat = await this.statService.findStatByUserId(userId);
        if (!userStat) {
            throw new common_1.BadRequestException('User stats not found');
        }
        const solPrice = await this.solanaService.getTokenPrice(this.solMint);
        console.log(`Sol proce: ${solPrice}`);
        console.log(`Fetching balance`);
        const balance = await this.solBalanceService.getBalanceDataByUserId(userId, solPrice);
        if (!balance) {
            throw new common_1.BadRequestException('User balance not found');
        }
        console.log("Fetching the token quote");
        try {
            const tokenQuote = await this.solanaService.getTokenQuoteSolOutput(createExitDto.mintAddress, createExitDto.amount, createExitDto.slippage);
            if (!tokenQuote) {
                throw new common_1.BadRequestException('Failed to fetch token quote');
            }
            const solReceived = parseFloat(tokenQuote.normalizedThresholdSol);
            const solUsdValue = tokenQuote.usdValue;
            console.log(`Sol received: ${solReceived}, solUsdValue: ${solUsdValue}`);
            console.log("Fetching token data");
            const tokenData = await this.solanaService.getTokenData(createExitDto.mintAddress);
            if (!tokenData) {
                throw new common_1.BadRequestException('Token not found');
            }
            console.log("Fetching the holding");
            const holding = await this.holdingService.findHoldingByUserIdAndMintAddress(userId, createExitDto.mintAddress);
            if (!holding) {
                throw new common_1.BadRequestException('No existing holding found for this token. Cannot exit a position that does not exist.');
            }
            if (holding.amount < createExitDto.amount) {
                throw new common_1.BadRequestException('Not enough tokens in holding to sell this amount');
            }
            const tokenPrice = tokenQuote.usdValue / createExitDto.amount;
            const sellPrice = parseFloat(tokenPrice.toFixed(12));
            if (!sellPrice) {
                throw new common_1.BadRequestException('Failed to fetch token price for the minted token');
            }
            console.log(`The sell price of the token: ${sellPrice}`);
            const currentAveragePrice = parseFloat(holding.average_price.toString()) || 0;
            const tokensSold = parseFloat(createExitDto.amount.toString());
            const realizedPnl = (sellPrice - currentAveragePrice) * tokensSold;
            console.log(`currentAveragePrice: ${currentAveragePrice}, tokensSold: ${tokensSold}, realizedPnl: ${realizedPnl}`);
            const updatedBalance = await this.solBalanceService.updateBalanceAdd(balance, solReceived, solUsdValue);
            if (!updatedBalance) {
                throw new common_1.BadRequestException('Failed to update user balance');
            }
            console.log(`Updated balance SOL: ${updatedBalance.balance}, USD: ${updatedBalance.balance_usd}`);
            console.log("Creating an exit record");
            const exitRecord = await this.exitService.createExit({
                user,
                mintAddress: createExitDto.mintAddress,
                amount: tokensSold,
                value_usd: solUsdValue,
                value_sol: solReceived,
                price: sellPrice,
                marketcap: tokenData.marketCap,
                liquidity: tokenData.liquidity.usd,
                pnl: parseFloat(realizedPnl.toFixed(4)),
            });
            console.log("Updating the holding");
            const updatedHolding = await this.holdingService.updateHoldingExit(holding, tokensSold, holding.value_usd, holding.value_sol, solUsdValue, solReceived);
            if (!updatedHolding) {
                throw new common_1.BadRequestException('Failed to update holding on exit');
            }
            let deletedHolding = false;
            if (updatedHolding.amount <= 0.0000001) {
                await this.holdingService.deleteHolding(updatedHolding);
                console.log("Holding deleted");
                deletedHolding = true;
            }
            console.log("Updating user stats");
            const totalWins = (await this.exitService.findAllExitWinsByUserId(userId)).length;
            const updatedStats = await this.statService.updateStatOnExit(userStat, totalWins, parseFloat(realizedPnl.toFixed(4)), deletedHolding);
            if (!updatedStats) {
                throw new Error('Failed to update user stats');
            }
            await this.updateHoldingsPrice(userId);
            const reFetchedStat = await this.statService.findStatByUserId(userId);
            const tokenMetadata = await this.tokenMetadataService.findTokenDataByMintAddress(createExitDto.mintAddress);
            console.log(`Updated stats: ${reFetchedStat.realized_pnl}, ${reFetchedStat.total_pnl}`);
            console.log("Finalizing");
            return {
                exit: {
                    id: exitRecord.id,
                    mintAddress: exitRecord.mintAddress,
                    amount: exitRecord.amount,
                    value_usd: exitRecord.value_usd,
                    value_sol: exitRecord.value_sol,
                    price: exitRecord.price,
                    marketcap: exitRecord.marketcap,
                    liquidity: exitRecord.liquidity,
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
    async createEntry(userId, createEntryDto) {
        console.log(`Validating user with ID ${userId}`);
        const user = await this.userService.findUserById(userId);
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        console.log(`User: ${user.email}`);
        const userStat = await this.statService.findStatByUserId(userId);
        if (!userStat) {
            throw new common_1.BadRequestException('User stats not found');
        }
        const solPrice = await this.solanaService.getTokenSellPrice(this.solMint);
        const balance = await this.solBalanceService.getBalanceDataByUserId(userId, solPrice);
        if (!balance) {
            throw new common_1.BadRequestException('User balance not found');
        }
        const userSolBalance = balance.balance;
        if (userSolBalance < createEntryDto.amount) {
            throw new common_1.BadRequestException('Insufficient SOL balance');
        }
        try {
            let localPrice = await this.solanaService.getTokenPrice(createEntryDto.mintAddress);
            if (!localPrice || localPrice <= 0) {
                for (let i = 1; i < 6; i++) {
                    localPrice = await this.solanaService.getTokenPrice(createEntryDto.mintAddress);
                    if (localPrice > 0)
                        break;
                }
            }
            if (!localPrice || localPrice <= 0) {
                throw new Error("Failed to fetch token price");
            }
            console.log(`Local price in Entry for token: ${localPrice}`);
            const tokenQuote = await this.solanaService.getTokenQuoteSolInput(createEntryDto.mintAddress, createEntryDto.amount, createEntryDto.slippage, localPrice);
            if (!tokenQuote) {
                throw new Error('Failed to fetch token quote');
            }
            const tokenData = await this.solanaService.getTokenData(createEntryDto.mintAddress);
            if (!tokenData) {
                throw new common_1.BadRequestException('Token not found');
            }
            const amountOfTokensReceived = tokenQuote.normalizedThresholdToken;
            const marketcap = parseFloat(tokenData.marketCap);
            const liquidity = parseFloat(tokenData.liquidity.usd);
            const value_usd = tokenQuote.usdValue;
            const value_sol = tokenQuote.solValue;
            const name = tokenData.quoteToken?.name || 'Unknown Token';
            const ticker = tokenData.quoteToken?.symbol || 'Unknown Ticker';
            const image = tokenData.info?.imageUrl || 'defaultTokenImage';
            const website = tokenData.info?.websites?.[0]?.url || 'N/A';
            const x_page = tokenData.info?.socials?.[0]?.url || 'N/A';
            const telegram = tokenData.info?.socials?.[1]?.url || 'N/A';
            const pnl = parseFloat(value_usd) - parseFloat(tokenQuote.inAmountUsdValue);
            const holding = await this.holdingService.findHoldingByUserIdAndMintAddress(userId, createEntryDto.mintAddress);
            let newHolding = false;
            let uniqueUserToken = false;
            let tokenSellPrice = 0;
            const entries = await this.entryService.findEntriesByUserIdAndMintAddress(userId, createEntryDto.mintAddress);
            if (entries.length === 0) {
                uniqueUserToken = true;
            }
            if (!holding) {
                newHolding = true;
                try {
                    const possiblePrice = await this.solanaService.getTokenSellPrice(createEntryDto.mintAddress);
                    if (possiblePrice > 0) {
                        tokenSellPrice = possiblePrice;
                    }
                    else {
                        throw new Error('No valid price fetched');
                    }
                }
                catch (error) {
                    console.log(`No token liquidity or failed to fetch a token sell price${error}`);
                    throw new Error('Failed to create an entry due to failed price');
                }
                await this.holdingService.createHolding({
                    user,
                    mintAddress: createEntryDto.mintAddress,
                    amount: amountOfTokensReceived,
                    price: tokenSellPrice,
                    average_price: tokenSellPrice,
                    value_usd,
                    value_sol,
                    pnl,
                });
            }
            else {
                try {
                    const possiblePrice = await this.solanaService.getTokenSellPrice(createEntryDto.mintAddress);
                    if (possiblePrice > 0) {
                        tokenSellPrice = possiblePrice;
                    }
                    else {
                        throw new Error("No valid price fetched'");
                    }
                }
                catch (error) {
                    throw new Error(`No token liquidity or failed to fetch a token sell price${error}`);
                }
                let updatedUsdValue = holding.value_usd;
                let updatedSolValue = holding.value_sol;
                if (holding.mintAddress && holding.amount >= 0.0001) {
                    try {
                        const tokenQuoteUpdate = await this.solanaService.getTokenQuoteSolOutput(holding.mintAddress, holding.amount, 50);
                        if (tokenQuoteUpdate) {
                            updatedUsdValue = parseFloat(tokenQuoteUpdate.usdValue);
                            updatedSolValue = parseFloat(tokenQuoteUpdate.normalizedThresholdSol);
                            console.log('Successfully updated from getTokenQuoteSolOutput for existing holding');
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
                const updatedHolding = await this.holdingService.updateHoldingEntry(holding, amountOfTokensReceived, tokenSellPrice, updatedUsdValue, updatedSolValue, parseFloat(value_usd), parseFloat(value_sol));
                if (!updatedHolding) {
                    throw new common_1.BadRequestException('Failed to update your holding, try again');
                }
            }
            const updatedBalance = await this.solBalanceService.updateBalanceSubtract(balance, createEntryDto.amount, solPrice);
            if (!updatedBalance) {
                throw new common_1.BadRequestException('Failed to update SOL balance. Please try again');
            }
            const entry = await this.entryService.createEntry({
                user,
                mintAddress: createEntryDto.mintAddress,
                amount: amountOfTokensReceived,
                value_usd,
                value_sol,
                price: localPrice,
                marketcap,
                liquidity,
                source: createEntryDto.source,
            });
            const updatedStats = await this.statService.updateStatOnEntry(userStat, newHolding, uniqueUserToken);
            if (!updatedStats) {
                throw new Error('Failed to update user stats');
            }
            await this.updateHoldingsPrice(userId);
            const existingMetadata = await this.tokenMetadataService.findTokenDataByMintAddress(createEntryDto.mintAddress);
            if (existingMetadata) {
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
                    marketcap: entry.marketcap,
                    liquidity: entry.liquidity,
                    source: entry.source,
                    name: existingMetadata.name,
                    ticker: existingMetadata.ticker,
                    image: existingMetadata.image,
                    website: existingMetadata.website,
                    x_page: existingMetadata.x_page,
                    telegram: existingMetadata.telegram,
                    createdAt: entry.createdAt,
                    updatedAt: entry.updatedAt,
                };
            }
            const newMetadata = await this.tokenMetadataService.createTokenMetadata({
                name,
                ticker,
                mint_address: createEntryDto.mintAddress,
                image,
                website,
                x_page,
                telegram,
            });
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
                marketcap: entry.marketcap,
                liquidity: entry.liquidity,
                source: entry.source,
                name: newMetadata.name,
                ticker: newMetadata.ticker,
                image: newMetadata.image,
                website: newMetadata.website,
                x_page: newMetadata.x_page,
                telegram: newMetadata.telegram,
                createdAt: entry.createdAt,
                updatedAt: entry.updatedAt,
            };
        }
        catch (error) {
            throw new Error(error);
        }
    }
    async updateHoldingsPrice(userId) {
        console.log("UpdateHoldingsPrice called");
        const userStat = await this.statService.findStatByUserId(userId);
        if (!userStat) {
            throw new common_1.BadRequestException('Failed to update user stats. Please try again');
        }
        const holdings = await this.holdingService.findAllUserHoldingsByUserId(userId);
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
            console.log(`Holding price: ${newPrice}`);
            try {
                const possiblePrice = await this.solanaService.getTokenSellPrice(holding.mintAddress);
                if (possiblePrice > 0) {
                    newPrice = possiblePrice;
                }
                else {
                    throw new Error('Failed to update holding. No possible price fetched');
                }
            }
            catch (error) {
                const errorMessage = `The token ${holding.mintAddress} has no liquidity or failed to fetch token price`;
                console.log(errorMessage);
                errors.push({ mintAddress: holding.mintAddress, message: errorMessage });
            }
            await this.holdingService.updateHoldingPnl(holding, newPrice);
            await this.holdingService.updateHoldingPrice(holding, newPrice, solPrice);
            newUnrealizedPnl += holding.pnl;
        }));
        const updatedHoldings = await this.holdingService.findAllUserHoldingsByUserId(userId);
        const enrichedData = await Promise.all(updatedHoldings.map(async (item) => {
            const metadata = await this.tokenMetadataService.findTokenDataByMintAddress(item.mintAddress);
            return {
                ...item,
                group_id: item.group?.id || null,
                name: metadata?.name || 'Unknown',
                ticker: metadata?.ticker || 'Unknown',
                image: metadata?.image || null,
                website: metadata?.website || 'N/A',
                xPage: metadata?.x_page || 'N/A',
                telegram: metadata?.telegram || 'N/A'
            };
        }));
        const sanitizedData = enrichedData.map(({ id, user, ...rest }) => rest);
        await this.statService.updateStatOnHoldingUpdate(userStat, newUnrealizedPnl);
        return ({ holdings: sanitizedData, errors });
    }
    async getAllUserHoldings(userId) {
        const user = await this.userService.findUserById(userId);
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        const holdings = await this.holdingService.findAllUserHoldingsByUserId(userId);
        if (!holdings || holdings.length === 0) {
            return [];
        }
        const enrichedData = await Promise.all(holdings.map(async (item) => {
            const metadata = await this.tokenMetadataService.findTokenDataByMintAddress(item.mintAddress);
            return {
                ...item,
                group_id: item.group?.id || null,
                name: metadata?.name || 'Unknown',
                ticker: metadata?.ticker || 'Unknown',
                image: metadata?.image || null,
                website: metadata?.website || 'N/A',
                xPage: metadata?.x_page || 'N/A',
                telegram: metadata?.telegram || 'N/A',
            };
        }));
        const sanitizedData = enrichedData.map(({ id, user, ...rest }) => rest);
        return sanitizedData;
    }
    async getBalanceData(userId) {
        const solPrice = await this.solanaService.getTokenSellPrice(this.solMint);
        const balance = await this.solBalanceService.getBalanceDataByUserId(userId, solPrice);
        if (!balance) {
            throw new Error('Balance not found');
        }
        return ({
            balance: balance.balance,
            balanceUsd: balance.balance_usd,
            totalRedeemed: balance.total_redeemed,
            totalRedeemedUsd: balance.total_usd_redeemed,
            oneRedeemable: balance.one_redeemable,
            fiveRedeemable: balance.five_redeemable,
            lastOneRedeemedAt: balance.last_one_redeemed_at,
            lastFiveRedeemedAt: balance.last_five_redeemed_at,
        });
    }
    async redeemOneSol(userId) {
        const solPrice = await this.solanaService.getTokenSellPrice(this.solMint);
        if (!solPrice) {
            throw new common_1.BadRequestException('Failed to update price of SOL. Please try again');
        }
        const updatedBalance = await this.solBalanceService.redeemOne(userId, solPrice);
        if (!updatedBalance) {
            throw new Error('Failed to redeem 100$');
        }
        return updatedBalance;
    }
    async redeemFiveSol(userId) {
        const solPrice = await this.solanaService.getTokenSellPrice(this.solMint);
        if (!solPrice) {
            throw new common_1.BadRequestException('Failed to update price of SOL. Please try again');
        }
        const updatedBalance = await this.solBalanceService.redeemFive(userId, solPrice);
        if (!updatedBalance) {
            throw new Error('Failed to redeem 1000$');
        }
        return updatedBalance;
    }
    async getUserStats(userId) {
        const userStats = await this.statService.findStatByUserId(userId);
        if (!userStats) {
            throw new common_1.BadRequestException("User statistics not found");
        }
        return ({
            tokensPurchased: userStats.tokens_purchased,
            totalEntries: userStats.total_entries,
            totalExits: userStats.total_exits,
            currentHoldings: userStats.current_holdings,
            totalPnl: userStats.total_pnl,
            unrealizedPnl: userStats.unrealized_pnl,
            realizedPnl: userStats.realized_pnl,
            winrate: userStats.winrate,
        });
    }
    async getAllEntriesAndExitsByUserId(userId) {
        const userEntries = await this.entryService.findAllEntriesByUserId(userId);
        const userExits = await this.exitService.findExitsByUserId(userId);
        const combinedData = [
            ...userEntries.map(entry => ({ ...entry, type: 'entry' })),
            ...userExits.map(exit => ({ ...exit, type: 'exit' })),
        ];
        const sortedData = combinedData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const enrichedData = await Promise.all(sortedData.map(async (item) => {
            const metadata = await this.tokenMetadataService.findTokenDataByMintAddress(item.mintAddress);
            return {
                ...item,
                ticker: metadata?.ticker || 'Unknown',
                image: metadata?.image || null,
            };
        }));
        const sanitizedData = enrichedData.map(({ id, user, ...rest }) => rest);
        return sanitizedData;
    }
    async deleteAHoldingByUserId(userId, mintAddress) {
        const holding = await this.holdingService.findHoldingByUserIdAndMintAddress(userId, mintAddress);
        if (!holding) {
            throw new common_1.BadRequestException('Holding not found');
        }
        const userStat = await this.statService.findStatByUserId(userId);
        if (!userStat) {
            throw new common_1.BadRequestException('User stats not found');
        }
        await this.holdingService.deleteHolding(holding);
        await this.statService.updateStatOnHoldingDelete(userStat, holding.pnl);
    }
    async calculateNetworth(userId) {
        const { holdingsSolValue, holdingsUsdValue } = await this.holdingService.calculateHoldingsValueByUserId(userId);
        const solPrice = await this.solanaService.getTokenSellPrice(this.solMint);
        const balanceData = await this.solBalanceService.getBalanceDataByUserId(userId, solPrice);
        const solBalance = typeof balanceData.balance === 'string' ? parseFloat(balanceData.balance) : balanceData.balance;
        const usdBalance = typeof balanceData.balance_usd === 'string' ? parseFloat(balanceData.balance_usd) : balanceData.balance_usd;
        const roundedSolBalance = parseFloat(solBalance.toFixed(4));
        const roundedUsdBalance = parseFloat(usdBalance.toFixed(4));
        const totalNetworthSol = holdingsSolValue + roundedSolBalance;
        const totalNetworthUsd = holdingsUsdValue + roundedUsdBalance;
        const roundedNetworthSol = parseFloat(totalNetworthSol.toFixed(4));
        const roundedNetworthUsd = parseFloat(totalNetworthUsd.toFixed(4));
        return ({
            solNetworth: roundedNetworthSol,
            usdNetworth: roundedNetworthUsd
        });
    }
};
exports.CryptoService = CryptoService;
exports.CryptoService = CryptoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [solana_service_1.SolanaService,
        entry_service_1.EntryService,
        user_service_1.UserService,
        holding_service_1.HoldingService,
        token_metadata_service_1.TokenMetadataService,
        exit_service_1.ExitService,
        sol_balance_service_1.SolBalanceService,
        stats_service_1.StatService])
], CryptoService);
//# sourceMappingURL=crypto.service.js.map