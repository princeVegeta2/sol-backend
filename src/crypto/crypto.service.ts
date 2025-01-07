import { Injectable, BadRequestException } from '@nestjs/common';
import { SolanaService } from 'src/solana/solana.service';
import { EntryService } from 'src/entries/entry.service';
import { UserService } from 'src/user/user.service';
import { CreateEntryDto } from 'src/entries/entry.dto';
import { HoldingService } from 'src/holdings/holding.service';
import { TokenMetadataService } from 'src/metadata/token_metadata.service';
import { ExitService } from 'src/exits/exit.service';
import { CreateExitDto } from 'src/exits/exit.dto';
import { UsdBalanceService } from 'src/balance/usd_balance.service';

@Injectable()
export class CryptoService {
    constructor(
        private readonly solanaService: SolanaService,
        private readonly entryService: EntryService,
        private readonly userService: UserService,
        private readonly holdingService: HoldingService,
        private readonly tokenMetadataService: TokenMetadataService,
        private readonly exitService: ExitService,
        private readonly usdBalanceService: UsdBalanceService,) { }


    async createExit(userId: number, createExitDto: CreateExitDto) {
        const user = await this.userService.findUserById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const tokenData = await this.solanaService.getTokenData(createExitDto.mintAddress);
        if (!tokenData) {
            throw new Error('Token not found');
        }

        const price = parseFloat(tokenData.priceUsd);
        const marketcap = parseFloat(tokenData.marketCap);
        const liquidity = parseFloat(tokenData.liquidity.usd);
        const value_usd = price * createExitDto.amount;

        // Create the exit
        await this.exitService.createExit({
            user,
            mintAddress: createExitDto.mintAddress,
            amount: createExitDto.amount,
            price,
            marketcap,
            liquidity,
            value_usd,
        });

        // Find the holding
        const holding = await this.holdingService.findHoldingByUserIdAndMintAddress(userId, createExitDto.mintAddress);
        if (!holding) {
            throw new Error('Holding not found');
        }
        if (holding.amount < createExitDto.amount) {
            throw new BadRequestException('You do not have enough tokens');
        }
        if (holding.amount === createExitDto.amount) {
            // Delete holding
            this.holdingService.deleteHolding(holding);
            return null;
        } else {
            // Update the holding with the exit amount
            await this.holdingService.updateHoldingExit(holding, createExitDto.amount);
            return ({
                amount: holding.amount,
                price: holding.price,
                value_usd: holding.value_usd,
                pnl: holding.pnl,
                updated_at: holding.updatedAt
            });
        }
    }

    async createExitUsd(userId: number, createExitDto: CreateExitDto) {
        const user = await this.userService.findUserById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const tokenData = await this.solanaService.getTokenData(createExitDto.mintAddress);
        if (!tokenData) {
            throw new Error('Token not found');
        }

        const price = parseFloat(tokenData.priceUsd);
        const marketcap = parseFloat(tokenData.marketCap);
        const liquidity = parseFloat(tokenData.liquidity.usd);

        // Calculate amount of tokens with full precision
        const amountOfTokens = createExitDto.amount / price;

        // Calculate USD value based on the precise amount of tokens
        const value_usd = price * amountOfTokens;

        // Create the exit
        await this.exitService.createExit({
            user,
            mintAddress: createExitDto.mintAddress,
            amount: amountOfTokens, // Use precise token amount here
            price,
            marketcap,
            liquidity,
            value_usd,
        });

        // Find the holding
        const holding = await this.holdingService.findHoldingByUserIdAndMintAddress(userId, createExitDto.mintAddress);
        if (!holding) {
            throw new Error('Holding not found');
        }

        if (holding.value_usd < value_usd) {
            throw new BadRequestException('You do not have enough tokens');
        }

        // Subtract the exited tokens and update the holding
        const updatedAmount = holding.amount - amountOfTokens;
        const updatedValueUsd = holding.value_usd - value_usd;

        // Treat very small values as zero to prevent floating-point errors
        const epsilon = 0.000001; // Precision threshold for amount
        const usdEpsilon = 0.0001; // Precision threshold for value_usd

        if (updatedAmount <= epsilon || updatedValueUsd <= usdEpsilon) {
            // Delete holding if the remaining amount or value_usd is effectively zero
            await this.holdingService.deleteHolding(holding);
            return null;
        } else {
            // Update the holding with the exit amount
            holding.amount = parseFloat(updatedAmount.toFixed(6)); // Ensure precision
            holding.value_usd = parseFloat(updatedValueUsd.toFixed(4)); // Ensure precision
            await this.holdingService.updateHoldingExit(holding, amountOfTokens);
            return {
                amount: holding.amount,
                price: holding.price,
                value_usd: holding.value_usd,
                pnl: holding.pnl,
                updated_at: holding.updatedAt,
            };
        }
    }

    async createEntry(userId: number, createEntryDto: CreateEntryDto) {
        // Find the user by userId
        const user = await this.userService.findUserById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Fetch token data using SolanaService
        const tokenData = await this.solanaService.getTokenData(createEntryDto.mintAddress);
        if (!tokenData) {
            throw new Error('Token not found');
        }

        // Parse token data
        const price = parseFloat(tokenData.priceUsd);
        const marketcap = parseFloat(tokenData.marketCap);
        const liquidity = parseFloat(tokenData.liquidity.usd);
        const value_usd = price * createEntryDto.amount;
        const name = tokenData.quoteToken.name;
        const ticker = tokenData.quoteToken.symbol;
        const image = tokenData.info.imageUrl;
        const website = tokenData.info.websites[0].url;
        const x_page = tokenData.info.socials[0].url;
        const telegram = tokenData.info.socials[1].url;
        const holding = await this.holdingService.findHoldingByUserIdAndMintAddress(userId, createEntryDto.mintAddress);
        // Create a holding entry
        if (!holding) {
            await this.holdingService.createHolding({
                user,
                mintAddress: createEntryDto.mintAddress,
                amount: createEntryDto.amount,
                price,
                value_usd,
                pnl: 0,
            });
        } else {
            await this.holdingService.updateHoldingEntry(holding, createEntryDto.amount);
        }

        // Create an entry in the entries table
        const entry = await this.entryService.createEntry({
            user,
            mintAddress: createEntryDto.mintAddress,
            amount: createEntryDto.amount,
            source: createEntryDto.source,
            price,
            marketcap,
            liquidity,
            value_usd
        });

        // Create metadata entry
        const existingMetadata = await this.tokenMetadataService.findTokenDataByMintAddress(createEntryDto.mintAddress);

        // Return only non-sensitive fields in the response
        if (existingMetadata) {
            return {
                id: entry.id,
                mintAddress: entry.mintAddress,
                amount: entry.amount,
                source: entry.source,
                price: entry.price,
                marketcap: entry.marketcap,
                liquidity: entry.liquidity,
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
            name: name,
            ticker: ticker,
            mint_address: createEntryDto.mintAddress,
            image,
            website,
            x_page,
            telegram,
        });

        return {
            id: entry.id,
            mintAddress: entry.mintAddress,
            amount: entry.amount,
            source: entry.source,
            price: entry.price,
            marketcap: entry.marketcap,
            liquidity: entry.liquidity,
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

    async createEntryUsd(userId: number, createEntryDto: CreateEntryDto) {
        const user = await this.userService.findUserById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const tokenData = await this.solanaService.getTokenData(createEntryDto.mintAddress);
        if (!tokenData) {
            throw new Error('Token not found');
        }

        const price = parseFloat(tokenData.priceUsd);
        const marketcap = parseFloat(tokenData.marketCap);
        const liquidity = parseFloat(tokenData.liquidity.usd);

        // Calculate amount of tokens with full precision
        const amountOfTokens = createEntryDto.amount / price;

        // Calculate USD value based on precise token amount
        const value_usd = price * amountOfTokens;

        const holding = await this.holdingService.findHoldingByUserIdAndMintAddress(userId, createEntryDto.mintAddress);

        // Create a holding entry
        if (!holding) {
            await this.holdingService.createHolding({
                user,
                mintAddress: createEntryDto.mintAddress,
                amount: amountOfTokens, // Use precise token amount here
                price,
                value_usd,
                pnl: 0,
            });
        } else {
            await this.holdingService.updateHoldingEntry(holding, amountOfTokens);
        }

        // Create an entry in the entries table
        const entry = await this.entryService.createEntry({
            user,
            mintAddress: createEntryDto.mintAddress,
            amount: amountOfTokens, // Use precise token amount here
            source: createEntryDto.source,
            price,
            marketcap,
            liquidity,
            value_usd,
        });

        return {
            id: entry.id,
            mintAddress: entry.mintAddress,
            amount: entry.amount,
            source: entry.source,
            price: entry.price,
            marketcap: entry.marketcap,
            liquidity: entry.liquidity,
            value_usd: entry.value_usd,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
        };
    }


    // Update all holdings of user with the new price
    async updateHoldingsPrice(userId: number) {
        const holdings = await this.holdingService.findAllUserHoldingsByUserId(userId);
        if (!holdings || holdings.length === 0) {
            throw new Error('This user has no holdings');
        }

        // Use `Promise.all` to wait for all async operations
        await Promise.all(
            holdings.map(async (holding) => {
                const newPrice = await this.solanaService.getTokenPrice(holding.mintAddress);
                // Must be called BEFORE price because it uses the old price in the calculation
                await this.holdingService.updateHoldingPnl(holding, newPrice);
                // Also updates the value_usd
                await this.holdingService.updateHoldingPrice(holding, newPrice);
            })
        );

        // Fetch and return the updated holdings
        const updatedHoldings = await this.holdingService.findAllUserHoldingsByUserId(userId);
        return updatedHoldings;
    }

    // Get balance data of the user
    async getBalanceData(userId: number) {
        const balance = await this.usdBalanceService.getBalanceDataByUserId(userId);
        if (!balance) {
            throw new Error('Balance not found');
        }

        return ({
            balance: balance.balance,
            total_redeemed: balance.total_redeemed,
            hundred_redeemable: balance.hundred_redeemable,
            thousand_redeemable: balance.thousand_redeemable,
            last_hundred_redeemed_at: balance.last_hundred_redeemed_at,
            last_thousand_redeemed_at: balance.last_thousand_redeemed_at,
        });
    }

    // Redeem 100$
    async redeemOneHundred(userId: number) {
        const updatedBalance = await this.usdBalanceService.redeemHundred(userId);
        if (!updatedBalance) {
            throw new Error('Failed to redeem 100$');
        }
        return updatedBalance;
    }

    // Redeem 1000$
    async redeemOneThousand(userId: number) {
        const updatedBalance = await this.usdBalanceService.redeemThousand(userId);
        if (!updatedBalance) {
            throw new Error('Failed to redeem 1000$');
        }
        return updatedBalance;
    }
}