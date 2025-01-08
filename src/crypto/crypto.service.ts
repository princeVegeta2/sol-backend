import { Injectable, BadRequestException } from '@nestjs/common';
import { SolanaService } from 'src/solana/solana.service';
import { EntryService } from 'src/entries/entry.service';
import { UserService } from 'src/user/user.service';
import { CreateEntryDto } from 'src/entries/entry.dto';
import { HoldingService } from 'src/holdings/holding.service';
import { TokenMetadataService } from 'src/metadata/token_metadata.service';
import { ExitService } from 'src/exits/exit.service';
import { CreateExitDto } from 'src/exits/exit.dto';
import { SolBalanceService } from 'src/balance/sol_balance.service';

@Injectable()
export class CryptoService {
    constructor(
        private readonly solanaService: SolanaService,
        private readonly entryService: EntryService,
        private readonly userService: UserService,
        private readonly holdingService: HoldingService,
        private readonly tokenMetadataService: TokenMetadataService,
        private readonly exitService: ExitService,
        private readonly solBalanceService: SolBalanceService,) { }


    async createExit(userId: number, createExitDto: CreateExitDto) {
        const user = await this.userService.findUserById(userId);
        if (!user) {
            throw new BadRequestException('User not found');
        }

        const tokenData = await this.solanaService.getTokenData(createExitDto.mintAddress);
        if (!tokenData) {
            throw new BadRequestException('Token not found');
        }

        const tokenQuote = await this.solanaService.getTokenQuoteSolOutput(createExitDto.mintAddress, createExitDto.amount, createExitDto.slippage);
        if (!tokenQuote) {
            throw new BadRequestException('Failed to fetch token quote');
        }

        // Find the holding
        const holding = await this.holdingService.findHoldingByUserIdAndMintAddress(userId, createExitDto.mintAddress);
        if (!holding) {
            throw new BadRequestException('Holding not found');
        }

        if (holding.amount < createExitDto.amount) {
            throw new BadRequestException('You do not have enough tokens');
        }

        const price = parseFloat(tokenData.priceUsd);
        const marketcap = parseFloat(tokenData.marketCap);
        const liquidity = parseFloat(tokenData.liquidity.usd);
        const value_usd = tokenQuote.usdValue;
        const value_sol = tokenQuote.normalizedThresholdSol;;

        // Create the exit
        await this.exitService.createExit({
            user,
            mintAddress: createExitDto.mintAddress,
            amount: createExitDto.amount,
            value_usd,
            value_sol,
            price,
            marketcap,
            liquidity
        });

        if (holding.amount === createExitDto.amount) {
            // Delete holding
            this.holdingService.deleteHolding(holding);
            return null;
        } else {
            // Updated previous usd and sol values
            const tokenQuoteUpdate = await this.solanaService.getTokenQuoteSolOutput(holding.mintAddress, holding.amount, 50)
            if (!tokenQuoteUpdate) {
                throw new BadRequestException('Failed to update token quote, try again');
            }
            const newUsdValue = tokenQuoteUpdate.usdValue;
            const newSolValue = tokenQuoteUpdate.normalizedThresholdSol;
            // Update the holding with the exit amount
            await this.holdingService.updateHoldingExit(holding, createExitDto.amount, newUsdValue, newSolValue, value_usd, value_sol);
            // Check if the holding was deleted
            const updatedHolding = await this.holdingService.findHoldingByUserIdAndMintAddress(userId, createExitDto.mintAddress);
            if (!updatedHolding) {
                return "Holding has been removed due to low usd or sol value";
            }
            return ({
                amount: holding.amount,
                price: holding.price,
                value_usd: holding.value_usd,
                value_sol: holding.value_sol,
                pnl: holding.pnl,
                updated_at: holding.updatedAt
            });
        }
    }

    async createEntry(userId: number, createEntryDto: CreateEntryDto) {
        // Find the user by userId
        const user = await this.userService.findUserById(userId);
        if (!user) {
            throw new BadRequestException('User not found');
        }

        // Fetch token data using SolanaService
        const tokenData = await this.solanaService.getTokenData(createEntryDto.mintAddress);
        if (!tokenData) {
            throw new BadRequestException('Token not found');
        }
        const price = await this.solanaService.getTokenPrice(createEntryDto.mintAddress);
        const tokenQuote = await this.solanaService.getTokenQuoteSolInput(createEntryDto.mintAddress, createEntryDto.amount, createEntryDto.slippage, price);
        if (!tokenQuote) {
            throw new BadRequestException('Failed to fetch token quote');
        }

        // Parse token data
        const amountOfTokensReceived = tokenQuote.normalizedThresholdToken; // Guaranteed amount in tokens (normalized)
        const marketcap = parseFloat(tokenData.marketCap);
        const liquidity = parseFloat(tokenData.liquidity.usd);
        const value_usd = tokenQuote.usdValue; // USD value of the guaranteed amount;
        const value_sol = tokenQuote.solValue;
        const name = tokenData.quoteToken?.name || 'Unknown Token';
        const ticker = tokenData.quoteToken?.symbol || 'Unknown Ticker';
        const image = tokenData.info?.imageUrl || 'defaultTokenImage'; // Use a default image if unavailable
        const website = tokenData.info?.websites?.[0]?.url || 'N/A'; // Check if the websites array and url exist
        const x_page = tokenData.info?.socials?.[0]?.url || 'N/A'; // Check if socials array and url exist
        const telegram = tokenData.info?.socials?.[1]?.url || 'N/A'; // Check if the second social url exists
        const holding = await this.holdingService.findHoldingByUserIdAndMintAddress(userId, createEntryDto.mintAddress);
        const pnl = parseFloat(value_usd) - parseFloat(tokenQuote.inAmountUsdValue);

        // Create a holding entry
        if (!holding) {
            await this.holdingService.createHolding({
                user,
                mintAddress: createEntryDto.mintAddress,
                amount: amountOfTokensReceived,
                price,
                value_usd,
                value_sol,
                pnl,
            });
        } else {
            // Updated previous usd and sol values
            const tokenQuoteUpdate = await this.solanaService.getTokenQuoteSolOutput(holding.mintAddress, holding.amount, 50)
            if (!tokenQuoteUpdate) {
                throw new BadRequestException('Failed to update token quote, try again');
            }
            const newUsdValue = tokenQuoteUpdate.usdValue;
            const newSolValue = tokenQuoteUpdate.normalizedThresholdSol;
            const updatedHolding = await this.holdingService.updateHoldingEntry(holding, amountOfTokensReceived, newUsdValue, newSolValue, value_usd, value_sol);
            if (!updatedHolding) {
                throw new BadRequestException('Failed to update your holding, try again');
            }
        }

        // Create an entry in the entries table
        const entry = await this.entryService.createEntry({
            user,
            mintAddress: createEntryDto.mintAddress,
            amount: amountOfTokensReceived,
            value_usd,
            value_sol,
            price,
            marketcap,
            liquidity,
            source: createEntryDto.source,
        });

        // Create metadata entry
        const existingMetadata = await this.tokenMetadataService.findTokenDataByMintAddress(createEntryDto.mintAddress);

        // Return only non-sensitive fields in the response
        if (existingMetadata) {
            return {
                id: entry.id,
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

    // Update all holdings of user with the new price
    async updateHoldingsPrice(userId: number) {
        const holdings = await this.holdingService.findAllUserHoldingsByUserId(userId);
        if (!holdings || holdings.length === 0) {
            throw new Error('This user has no holdings');
        }

        const failedHoldings = []; // Track holdings that failed to update

        await Promise.all(
            holdings.map(async (holding) => {
                try {
                    const holdingQuote = await this.solanaService.getTokenQuoteSolOutput(holding.mintAddress, holding.amount, 50);
                    if (!holdingQuote) {
                        throw new Error('Failed to fetch token quote');
                    }
                    const newUsdValue = holdingQuote.usdValue;
                    const newSolValue = holdingQuote.normalizedThresholdSol;
                    const newPrice = await this.solanaService.getTokenPrice(holding.mintAddress);

                    // Must be called BEFORE price because it uses the old price in the calculation
                    await this.holdingService.updateHoldingPnl(holding, newUsdValue);

                    // Also updates the value_usd, value_sol and price
                    await this.holdingService.updateHoldingPrice(holding, newPrice, newUsdValue, newSolValue);
                } catch (error) {
                    console.error(`Failed to update holding ${holding.mintAddress}:`, error.message);
                    failedHoldings.push(holding.mintAddress); // Add to failed list
                }
            })
        );

        // Fetch updated holdings
        const updatedHoldings = await this.holdingService.findAllUserHoldingsByUserId(userId);

        return {
            updatedHoldings,
            failedHoldings, // Notify user of failed updates
        };
    }


    // Get balance data of the user
    async getBalanceData(userId: number) {
        const balance = await this.solBalanceService.getBalanceDataByUserId(userId);
        if (!balance) {
            throw new Error('Balance not found');
        }

        return ({
            balance: balance.balance,
            total_redeemed: balance.total_redeemed,
            hundred_redeemable: balance.one_redeemable,
            thousand_redeemable: balance.five_redeemable,
            last_hundred_redeemed_at: balance.last_one_redeemed_at,
            last_thousand_redeemed_at: balance.last_five_redeemed_at,
        });
    }

    // Redeem 1 SOL
    async redeemOneSol(userId: number) {
        const updatedBalance = await this.solBalanceService.redeemOne(userId);
        if (!updatedBalance) {
            throw new Error('Failed to redeem 100$');
        }
        return updatedBalance;
    }

    // Redeem 5 SOL
    async redeemFiveSol(userId: number) {
        const updatedBalance = await this.solBalanceService.redeemFive(userId);
        if (!updatedBalance) {
            throw new Error('Failed to redeem 1000$');
        }
        return updatedBalance;
    }
}