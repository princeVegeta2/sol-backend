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
import { StatService } from 'src/stats/stats.service';

@Injectable()
export class CryptoService {
    private readonly solMint = 'So11111111111111111111111111111111111111112'
    constructor(
        private readonly solanaService: SolanaService,
        private readonly entryService: EntryService,
        private readonly userService: UserService,
        private readonly holdingService: HoldingService,
        private readonly tokenMetadataService: TokenMetadataService,
        private readonly exitService: ExitService,
        private readonly solBalanceService: SolBalanceService,
        private readonly statService: StatService,) { }


    async createExit(userId: number, createExitDto: CreateExitDto) {
        // 1. Validate the user
        const user = await this.userService.findUserById(userId);
        if (!user) {
            throw new BadRequestException('User not found');
        }
        // 2. Check user's stat object
        const userStat = await this.statService.findStatByUserId(userId);
        if (!userStat) {
            throw new BadRequestException('User stats not found');
        }

        const solPrice = await this.solanaService.getTokenPrice(this.solMint);

        // 3. Check user’s SOL balance object
        const balance = await this.solBalanceService.getBalanceDataByUserId(userId, solPrice);
        if (!balance) {
            throw new BadRequestException('User balance not found');
        }

        // 4. Retrieve quote for how much SOL the user receives upon selling `createExitDto.amount` of this token
        const tokenQuote = await this.solanaService.getTokenQuoteSolOutput(
            createExitDto.mintAddress,
            createExitDto.amount,
            createExitDto.slippage
        );
        if (!tokenQuote) {
            throw new BadRequestException('Failed to fetch token quote');
        }

        // 5. Parse the resulting SOL and USD amounts
        const solReceived = parseFloat(tokenQuote.normalizedThresholdSol);
        const solUsdValue = tokenQuote.usdValue;

        // 6. Update user’s SOL balance (the user is receiving `solReceived`)
        const updatedBalance = await this.solBalanceService.updateBalanceAdd(
            balance,
            solReceived,
            solUsdValue
        );
        if (!updatedBalance) {
            throw new BadRequestException('Failed to update user balance');
        }

        // 7. Fetch token data
        const tokenData = await this.solanaService.getTokenData(createExitDto.mintAddress);
        if (!tokenData) {
            throw new BadRequestException('Token not found');
        }

        // 8. Find the user’s existing holding
        const holding = await this.holdingService.findHoldingByUserIdAndMintAddress(
            userId,
            createExitDto.mintAddress
        );
        if (!holding) {
            throw new BadRequestException('No existing holding found for this token. Cannot exit a position that does not exist.');
        }
        // Ensure the user has enough tokens to sell
        if (holding.amount < createExitDto.amount) {
            throw new BadRequestException('Not enough tokens in holding to sell this amount');
        }

        // 9. Compute realized PnL using average cost basis
        const sellPrice = await this.solanaService.getTokenSellPrice(createExitDto.mintAddress);
        if (!sellPrice) {
            throw new BadRequestException('Failed to fetch token price for the minted token');
        }

        const currentAveragePrice = parseFloat(holding.average_price.toString()) || 0;
        const tokensSold = parseFloat(createExitDto.amount.toString());
        // realizedPnL = (sellPrice - averagePrice) * tokensSold
        const realizedPnl = (sellPrice - currentAveragePrice) * tokensSold;

        // 10. Create the exit record in the `exits` table
        const exitRecord = await this.exitService.createExit({
            user,
            mintAddress: createExitDto.mintAddress,
            amount: tokensSold,
            value_usd: solUsdValue,
            value_sol: solReceived,
            price: sellPrice,
            marketcap: tokenData.marketCap,
            liquidity: tokenData.liquidity.usd,
            pnl: parseFloat(realizedPnl.toFixed(4)), // final realized PnL
        });

        // 11. Update the user’s holding to reflect the sale
        const updatedHolding = await this.holdingService.updateHoldingExit(
            holding,
            tokensSold,
            holding.value_usd,
            holding.value_sol,
            solUsdValue,
            solReceived
        );
        if (!updatedHolding) {
            throw new BadRequestException('Failed to update holding on exit');
        }

        // A variable to track whether the holding was deleted
        let deletedHolding = false;
        // 12. If the user sold all tokens in this holding, remove the row entirely
        if (updatedHolding.amount <= 0.0000001) {
            // or just `updatedHolding.amount === 0` if you store exact zero
            await this.holdingService.deleteHolding(updatedHolding);
            // If you want, set updatedHolding to null so it won't appear in the response
            // updatedHolding = null;
            deletedHolding = true;
        }
        // 13. Update user's stats
        const totalWins = (await this.exitService.findAllExitWinsByUserId(userId)).length;
        const updatedStats = await this.statService.updateStatOnExit(userStat, totalWins, parseFloat(realizedPnl.toFixed(4)), deletedHolding);
        if (!updatedStats) {
            throw new Error('Failed to update user stats');
        }
        const tokenMetadata = await this.tokenMetadataService.findTokenDataByMintAddress(createExitDto.mintAddress);
        // 14. Return final exit record + updated state (without user fields)
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
            // If you deleted the holding, you can either omit it or return null:
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
                totalExits: updatedStats.total_exits,
                currentHoldings: updatedStats.current_holdings,
                totalPnl: updatedStats.total_pnl,
                realizedPnl: updatedStats.realized_pnl,
                winrate: updatedStats.winrate,
                createdAt: updatedHolding.createdAt,
                updatedAt: updatedHolding.updatedAt,
            },
            metadata: {
                name: tokenMetadata.name,
                image: tokenMetadata.image
            },
            newBalance: updatedBalance.balance,
            newBalanceUsd: updatedBalance.balance_usd,
        };
    }


    async createEntry(userId: number, createEntryDto: CreateEntryDto) {

        // 1. Validate the user
        const user = await this.userService.findUserById(userId);
        if (!user) {
            throw new BadRequestException('User not found');
        }

        // 2. Find a stat object of the user
        const userStat = await this.statService.findStatByUserId(userId);
        if (!userStat) {
            throw new BadRequestException('User stats not found');
        }

        const solPrice = await this.solanaService.getTokenSellPrice(this.solMint);

        // 3. Check user SOL balance object
        const balance = await this.solBalanceService.getBalanceDataByUserId(userId, solPrice);
        if (!balance) {
            throw new BadRequestException('User balance not found');
        }
        const userSolBalance = balance.balance;
        // Make sure user can afford this purchase
        if (userSolBalance < createEntryDto.amount) {
            throw new BadRequestException('Insufficient SOL balance');
        }

        // 4. Prepare data for the quote
        //    - get the price from DexScreener or wherever
        //    - get the token quote from Jupiter
        const localPrice = await this.solanaService.getTokenPrice(createEntryDto.mintAddress);
        const tokenQuote = await this.solanaService.getTokenQuoteSolInput(
            createEntryDto.mintAddress,
            createEntryDto.amount,
            createEntryDto.slippage,
            localPrice
        );
        if (!tokenQuote) {
            throw new BadRequestException('Failed to fetch token quote');
        }

        // 5. Fetch token data from SolanaService
        const tokenData = await this.solanaService.getTokenData(createEntryDto.mintAddress);
        if (!tokenData) {
            throw new BadRequestException('Token not found');
        }

        // 6. Now that everything is valid, subtract from user’s SOL balance
        //    (We do this AFTER the external calls, so if something fails above,
        //     we haven't subtracted from user)
        const updatedBalance = await this.solBalanceService.updateBalanceSubtract(
            balance,
            createEntryDto.amount,
            solPrice
        );
        if (!updatedBalance) {
            throw new BadRequestException('Failed to update SOL balance. Please try again');
        }

        // 7. Parse data for new entry
        const amountOfTokensReceived = tokenQuote.normalizedThresholdToken;
        const marketcap = parseFloat(tokenData.marketCap);
        const liquidity = parseFloat(tokenData.liquidity.usd);
        const value_usd = tokenQuote.usdValue; // final USD value
        const value_sol = tokenQuote.solValue;
        const name = tokenData.quoteToken?.name || 'Unknown Token';
        const ticker = tokenData.quoteToken?.symbol || 'Unknown Ticker';
        const image = tokenData.info?.imageUrl || 'defaultTokenImage';
        const website = tokenData.info?.websites?.[0]?.url || 'N/A';
        const x_page = tokenData.info?.socials?.[0]?.url || 'N/A';
        const telegram = tokenData.info?.socials?.[1]?.url || 'N/A';

        // 8. Compute PNL (which should be negative or near-zero)
        const pnl = parseFloat(value_usd) - parseFloat(tokenQuote.inAmountUsdValue);

        // 9. Check if the user already holds some tokens
        const holding = await this.holdingService.findHoldingByUserIdAndMintAddress(
            userId,
            createEntryDto.mintAddress
        );

        // Variables to track whether a holding exists or a token is unique for the user
        let newHolding = false;
        let uniqueUserToken = false;
        let tokenSellPrice = 0;
        const entries = await this.entryService.findEntriesByUserIdAndMintAddress(userId, createEntryDto.mintAddress);
        if (entries.length === 0) {
            uniqueUserToken = true;
        }

        if (!holding) {
            // Get the token sell price to create the holding
            try {
                tokenSellPrice = await this.solanaService.getTokenSellPrice(createEntryDto.mintAddress);
            } catch(error) {
                console.log('No token liquidity or failed to fetch a token sell price');
            }
            // 9a. Create new holding
            await this.holdingService.createHolding({
                user,
                mintAddress: createEntryDto.mintAddress,
                amount: amountOfTokensReceived,
                price: tokenSellPrice,
                average_price: localPrice,
                value_usd,
                value_sol,
                pnl,
            });
        } else {
            // The user already has a holding for this token
            // Get the token sell price to update the holding
            try {
                tokenSellPrice = await this.solanaService.getTokenSellPrice(createEntryDto.mintAddress);
            } catch(error) {
                console.log('No token liquidity or failed to fetch a token sell price');
            }
            // 1. We'll start with the holding's current values as defaults
            let updatedUsdValue = holding.value_usd;
            let updatedSolValue = holding.value_sol;

            // 2. Attempt to recalc the entire holding's final value if possible
            if (holding.mintAddress && holding.amount >= 0.0001) {
                // We want a new "output" quote for the existing tokens
                try {
                    const tokenQuoteUpdate = await this.solanaService.getTokenQuoteSolOutput(
                        holding.mintAddress,
                        holding.amount, // total tokens in the holding before adding the new purchase
                        50
                    );
                    if (tokenQuoteUpdate) {
                        updatedUsdValue = parseFloat(tokenQuoteUpdate.usdValue);
                        updatedSolValue = parseFloat(tokenQuoteUpdate.normalizedThresholdSol);
                        console.log('Successfully updated from getTokenQuoteSolOutput for existing holding');
                    }
                } catch (err) {
                    console.log('Failed to update token quote for entire holding, proceeding with current values:', err.message);
                    // Fallback to holding.value_usd and holding.value_sol as is
                }
            } else {
                // Either no mintAddress or holding.amount < 0.0001
                if (!holding.mintAddress) {
                    console.log('No mintAddress in holding, skipping getTokenQuoteSolOutput');
                } else {
                    console.log('holding.amount < 0.0001, skipping getTokenQuoteSolOutput');
                }
                // We'll just keep updatedUsdValue and updatedSolValue from the holding as is
            }

            // 3. Now call updateHoldingEntry with:
            //    - `amount` = newly purchased tokens
            //    - `newPrice` = new price of the token
            //    - `newUsdValue` = the updated or fallback "existing" value from above
            //    - `newSolValue` = the updated or fallback "existing" value from above
            //    - `additionalUsdValue` = newly purchased tokenQuote.usdValue
            //    - `additionalSolValue` = newly purchased tokenQuote.solValue

            const updatedHolding = await this.holdingService.updateHoldingEntry(
                holding,
                amountOfTokensReceived,          // (amount param)
                tokenSellPrice,    // (price param)
                updatedUsdValue,                 // (newUsdValue)
                updatedSolValue,                 // (newSolValue)
                parseFloat(value_usd),           // (additionalUsdValue)
                parseFloat(value_sol),           // (additionalSolValue)
            );
            if (!updatedHolding) {
                throw new BadRequestException('Failed to update your holding, try again');
            }

            // Holding is now updated with combined amounts
        }

        // 10. Create an entry in the entries table
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

        // 11. Update user's stats
        const updatedStats = await this.statService.updateStatOnEntry(userStat, pnl, newHolding, uniqueUserToken);
        if (!updatedStats) {
            throw new Error('Failed to update user stats');
        }
        const totalEntries = updatedStats.total_entries;
        const tokensPurchased = updatedStats.tokens_purchased;


        // 12. Possibly create or retrieve the metadata
        const existingMetadata = await this.tokenMetadataService.findTokenDataByMintAddress(
            createEntryDto.mintAddress
        );
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

        // Otherwise, create new metadata
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


    // Update all holdings of user with the new price
    // Does not calculate slippage and other losses
    async updateHoldingsPrice(userId: number) {
        const userStat = await this.statService.findStatByUserId(userId);
        if (!userStat) {
            throw new BadRequestException('Failed to update user stats. Please try again');
        }
        const holdings = await this.holdingService.findAllUserHoldingsByUserId(userId);
        const solPrice = await this.solanaService.getTokenPrice(this.solMint);
        if (!holdings || holdings.length === 0) {
            throw new BadRequestException('This user has no holdings');
        }
        if (!solPrice) {
            throw new BadRequestException('Failed to fetch price of SOL. Try again');
        }
        let newUnrealizedPnl = 0;
        // Use Promise.all to wait for all async operations
        await Promise.all(
            holdings.map(async (holding) => {
                let newPrice = 0;
                try {
                    const newPrice = await this.solanaService.getTokenSellPrice(holding.mintAddress);
                } catch(error) {
                    console.log('The token has no Liquidity or failed to fetch token price');
                }
                // Must be called BEFORE price because it uses the old price in the calculation
                await this.holdingService.updateHoldingPnl(holding, newPrice);
                // Also updates the value_usd
                await this.holdingService.updateHoldingPrice(holding, newPrice, solPrice);
                newUnrealizedPnl += holding.pnl;
            })
        );

        // Fetch and return the updated holdings
        const updatedHoldings = await this.holdingService.findAllUserHoldingsByUserId(userId);
        const enrichedData = await Promise.all(
            updatedHoldings.map(async (item) => {
                // Fetch metadata using mintAddress
                const metadata = await this.tokenMetadataService.findTokenDataByMintAddress(item.mintAddress);

                // Add ticker and image to the response
                return {
                    ...item,
                    name: metadata?.name || 'Unknown',
                    ticker: metadata?.ticker || 'Unknown', // Default to 'Unknown' if metadata not found
                    image: metadata?.image || null, // Default to null if image not found
                    website: metadata?.website || 'N/A',
                    xPage: metadata?.x_page || 'N/A',
                    telegram: metadata?.telegram || 'N/A'
                };
            })
        );
        const sanitizedData = enrichedData.map(({ id, user, ...rest }) => rest);
        // Update stats with new pnl
        await this.statService.updateStatOnHoldingUpdate(userStat, newUnrealizedPnl);
        return sanitizedData;
    }


    // Get balance data of the user
    async getBalanceData(userId: number) {
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

    // Redeem 1 SOL
    async redeemOneSol(userId: number) {
        const solPrice = await this.solanaService.getTokenSellPrice(this.solMint);
        if (!solPrice) {
            throw new BadRequestException('Failed to update price of SOL. Please try again');
        }
        const updatedBalance = await this.solBalanceService.redeemOne(userId, solPrice);
        if (!updatedBalance) {
            throw new Error('Failed to redeem 100$');
        }
        return updatedBalance;
    }

    // Redeem 5 SOL
    async redeemFiveSol(userId: number) {
        const solPrice = await this.solanaService.getTokenSellPrice(this.solMint);
        if (!solPrice) {
            throw new BadRequestException('Failed to update price of SOL. Please try again');
        }
        const updatedBalance = await this.solBalanceService.redeemFive(userId, solPrice);
        if (!updatedBalance) {
            throw new Error('Failed to redeem 1000$');
        }
        return updatedBalance;
    }

    // Get all of the earned USD and SOL for stats
   /* async getEarningsInSolAndUsd(userId: number) {

        // Fetch a fresh SOL price
        const solPrice = await this.solanaService.getTokenPrice(this.solMint);
        if (!solPrice) {
            throw new BadRequestException('Failed to update price of SOL. Please try again');
        }
        // Fetch user balance
        const userBalance = await this.solBalanceService.getBalanceDataByUserId(userId, solPrice);
        if (!userBalance) {
            throw new BadRequestException('Failed to fetch user balance data. Please try again');
        }
        // Fetch user's wins
        const userExitWins = await this.exitService.findAllExitWinsByUserId(userId);
        if (userExitWins) {
            throw new BadRequestException('Failed to fetch user trade data. Please try again');
        }

        // Aggregate data
        const pnlValues = userExitWins.map((entry) => parseFloat(entry.pnl.toString()));
        const totalEarnedUsd = pnlValues.reduce((acc, pnl) => acc + pnl, 0);
        const totalEarnedSol = totalEarnedUsd / solPrice;
        const updatedBalance = await this.solBalanceService.updateUsdBalance(userBalance, solPrice);
        if (!updatedBalance) {
            throw new BadRequestException('Failed to update user balance. Please try again');
        }

        return ({
            totalEarnedUsd: totalEarnedUsd,
            totalEarnedSol: totalEarnedSol,
            currentSolBalance: updatedBalance.balance,
            totalRedeemedSol: updatedBalance.total_redeemed,
            updatedUsdBalance: updatedBalance.balance_usd,
            totalRedeemedUsd: updatedBalance.total_usd_redeemed
        });
    }
*/
    async getUserStats(userId: number) {
        const userStats = await this.statService.findStatByUserId(userId);
        if (!userStats) {
            throw new BadRequestException("User statistics not found");
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

    async getAllEntriesAndExitsByUserId(userId: number) {
        const userEntries = await this.entryService.findAllEntriesByUserId(userId);
        const userExits = await this.exitService.findExitsByUserId(userId);

        // Combine entries and exits
        const combinedData = [
            ...userEntries.map(entry => ({ ...entry, type: 'entry' })),
            ...userExits.map(exit => ({ ...exit, type: 'exit' })),
        ];

        // Sort by createdAt timestamp
        const sortedData = combinedData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Map through the sorted data and fetch metadata
        const enrichedData = await Promise.all(
            sortedData.map(async (item) => {
                // Fetch metadata using mintAddress
                const metadata = await this.tokenMetadataService.findTokenDataByMintAddress(item.mintAddress);

                // Add ticker and image to the response
                return {
                    ...item,
                    ticker: metadata?.ticker || 'Unknown', // Default to 'Unknown' if metadata not found
                    image: metadata?.image || null, // Default to null if image not found
                };
            })
        );

        // Remove `id` and `user` fields
        const sanitizedData = enrichedData.map(({ id, user, ...rest }) => rest);

        return sanitizedData;
    }

}