import { CreateApeExitDto } from './../ape_exit/ape_exit.dto';
import { TokenMetadataService } from './../metadata/token_metadata.service';
import { BadRequestException, Injectable } from "@nestjs/common";
import { SolBalanceService } from "src/balance/sol_balance.service";
import { UserService } from "src/user/user.service";
import { SolanaService } from "src/solana/solana.service";
import { ApeHoldingService } from "src/ape_holdings/ape_holding.service";
import { ApeEntryService } from "src/ape_entry/ape_entry.service";
import { ApeExitService } from "src/ape_exit/ape_exit.service";
import { StatService } from "src/stats/stats.service";
import { CreateApeEntryDto } from "src/ape_entry/ape_entry.dto";

@Injectable()
export class ApeService {
    private readonly solMint = 'So11111111111111111111111111111111111111112'
    constructor(
        private readonly solBalanceService: SolBalanceService,
        private readonly userService: UserService,
        private readonly solanaService: SolanaService,
        private readonly apeHoldingService: ApeHoldingService,
        private readonly apeEntryService: ApeEntryService,
        private readonly apeExitService: ApeExitService,
        private readonly statService: StatService,
        private readonly tokenMetadataService: TokenMetadataService,
    ) { }

    async createApeEntry(userId: number, createApeEntryDto: CreateApeEntryDto) {
        // 1. Validate the user
        const user = await this.userService.findUserById(userId);
        if (!user) {
            throw new Error("Failed to create entry. User not found");
        }

        // 2. Find a stat object of the user
        const userStat = await this.statService.findStatByUserId(userId);
        if (!userStat) {
            throw new Error("Failed to create entry. Stats not found.")
        }

        // 3. Get sol price
        const solPrice = await this.solanaService.getTokenSellPrice(this.solMint);

        // 4. Get user's balance object
        const balance = await this.solBalanceService.findBalanceByUserId(userId);
        if (!balance) {
            throw new BadRequestException("Failed to create entry. Balance not found");
        }

        // 5. Get token data
        try {
            let localPrice = await this.solanaService.getTokenSellPrice(createApeEntryDto.mintAddress);
            if (!localPrice || localPrice <= 0) {
                for (let i = 0; i < 6; i++) {
                    localPrice = await this.solanaService.getTokenPrice(createApeEntryDto.mintAddress);
                    if (localPrice > 0) break;
                }
            }
            // Check again
            if (!localPrice || localPrice <= 0) {
                throw new Error("Failed to get the token price on entry");
            }
            const tokenQuote = await this.solanaService.getTokenQuoteSolInput(
                createApeEntryDto.mintAddress,
                createApeEntryDto.amount - 0.025, // tip and priority fee hardcoded
                250, //2.5% default slippage hardcoded
                localPrice,
            );
            if (!tokenQuote) {
                throw new Error("Failed to get a quote for this token.");
            }
            const tokenMetadata = await this.solanaService.getTokenMeta(createApeEntryDto.mintAddress);

            // Parse data
            const amountOfTokensReceived = tokenQuote.normalizedThresholdToken;
            const valueUsd = tokenQuote.usdValue;
            const valueSol = tokenQuote.solValue;
            const name = tokenMetadata.name;
            const ticker = tokenMetadata.symbol;
            const image = tokenMetadata.image;

            // Calc initial pnl
            const pnl = parseFloat(valueUsd) - parseFloat(tokenQuote.inAmountUsdValue);

            // Create a holding
            const holding = await this.apeHoldingService.findApeHoldingByUserIdAndMintAddress(userId, createApeEntryDto.mintAddress);
            let newHolding = false;
            let uniqueToken = false;
            let tokenPrice = 0;
            const entries = await this.apeEntryService.findAllApeEntriesByUserIdAndMintAddress(userId, createApeEntryDto.mintAddress);
            if (entries.length === 0) {
                uniqueToken = true;
            }

            if (!holding) {
                // No holding found. Create a new one
                newHolding = true;
                try {
                    console.log("Getting possible price");
                    const possiblePrice = await this.solanaService.getTokenPrice(createApeEntryDto.mintAddress);
                    if (possiblePrice > 0) {
                        tokenPrice = possiblePrice;
                    } else {
                        throw new Error("No valid price fetched on ape entry");
                    }
                } catch (error) {
                    throw new Error("Failed to create an entry due to failed price fetch");
                }
                // Finally create the holding
                await this.apeHoldingService.createApeHolding(
                    {
                        user,
                        mintAddress: createApeEntryDto.mintAddress,
                        amount: amountOfTokensReceived,
                        price: tokenPrice,
                        average_price: tokenPrice,
                        value_usd: valueUsd,
                        value_sol: valueSol,
                        pnl
                    });
            } else {
                // User already has a holding
                // Update the existing holding
                try {
                    console.log("Getting possible price");
                    const possiblePrice = await this.solanaService.getTokenSellPrice(createApeEntryDto.mintAddress);
                    if (possiblePrice > 0) {
                        tokenPrice = possiblePrice;
                    } else {
                        tokenPrice = 0;
                    }
                } catch (error) {
                    throw new Error(`No token liquidity or failed to fetch a token sell price${error}`);
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
                            250
                        );
                        if (tokenQuoteUpdate) {
                            updatedUsdValue = parseFloat(tokenQuoteUpdate.usdValue);
                            updatedSolValue = parseFloat(tokenQuoteUpdate.normalizedThresholdSol);
                        }
                    } catch (error) {
                        throw new Error(`Failed to update token quote for entire holding, proceeding with current values:${error}`);
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
                const updatedApeHolding = await this.apeHoldingService.updateApeHoldingEntry(
                    holding,
                    amountOfTokensReceived,
                    tokenPrice,
                    updatedUsdValue,
                    updatedSolValue,
                    parseFloat(valueUsd),
                    parseFloat(valueSol),
                );
                if (!updatedApeHolding) {
                    throw new BadRequestException('Failed to update your holding, try again');
                }
                // Holding is now updated with combined amounts
            }
            // Update balance
            const updatedBalance = await this.solBalanceService.updateBalanceSubtract(
                balance,
                createApeEntryDto.amount,
                solPrice
            );
            if (!updatedBalance) {
                throw new BadRequestException('Failed to update SOL balance. Please try again');
            }
            // 10. Create an entry in the entries table
            const entry = await this.apeEntryService.createApeEntry({
                user,
                mintAddress: createApeEntryDto.mintAddress,
                amount: amountOfTokensReceived,
                value_usd: valueUsd,
                value_sol: valueSol,
                price: localPrice,
            });
            // 11. Update user's stats
            const updatedStats = await this.statService.updateStatOnEntry(userStat, newHolding, uniqueToken);
            if (!updatedStats) {
                throw new Error('Failed to update user stats');
            }
            await this.updateApeHoldingsPrice(userId); 
            const existingMetadata = await this.tokenMetadataService.findTokenDataByMintAddress(
                createApeEntryDto.mintAddress
            );
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
                }
            }
            // Otherwise, create new metadata
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
            }
        } catch(error) {
            throw new Error(error);
        }

    }

    async createApeExit(userId: number, createApeExitDto: CreateApeExitDto) {
        // 1. Validate the user
        const user = await this.userService.findUserById(userId);
        if (!user) {
            throw new BadRequestException("User not found");
        }

        // 2. Get the stat object
        const userStat = await this.statService.findStatByUserId(userId);
        if (!userStat) {
            throw new Error("Stats object not found");
        }

        // 3. Get the fresh SOL price and then get the balance object
        const solPrice = await this.solanaService.getTokenPrice(this.solMint);
        const balance = await this.solBalanceService.getBalanceDataByUserId(userId, solPrice);

        if (!balance) {
            throw new BadRequestException('User balance not found');
        }

        // Fetch token quote and rest of the operations
        try {
            // 4. Get the quote
            const tokenQuote = await this.solanaService.getTokenQuoteSolOutput(
                createApeExitDto.mintAddress,
                createApeExitDto.amount,
                250 // Default 2.5% slippage
            );
            if (!tokenQuote) {
                throw new BadRequestException('Failed to fetch token quote');
            }
            // 5. Parse sol and usd values
            const solReceived = parseFloat(tokenQuote.normalizedThresholdSol);
            const solUsdValue = tokenQuote.usdValue;

            // 6. Get token metadata from jupiter
            const tokenData = await this.solanaService.getTokenMeta(createApeExitDto.mintAddress);
            if (!tokenData) {
                throw new BadRequestException('Token not found');
            }
            // 7. Get the holding
            const holding = await this.apeHoldingService.findApeHoldingByUserIdAndMintAddress(
                userId,
                createApeExitDto.mintAddress
            );
            if (!holding) {
                throw new BadRequestException('No existing holding found for this token. Cannot exit a position that does not exist.');
            }
            // 8. Ensure the user has enough tokens to sell
            if (holding.amount < createApeExitDto.amount) {
                throw new BadRequestException('Not enough tokens in holding to sell this amount');
            }

            // 9. Compute PNL using average cost basis
            const tokenPrice = tokenQuote.usdValue / createApeExitDto.amount;
            const sellPrice = parseFloat(tokenPrice.toFixed(12));
            const currentAveragePrice = parseFloat(holding.average_price.toString()) || 0;
            const tokensSold = parseFloat(createApeExitDto.amount.toString());
            const realizedPnl = (sellPrice - currentAveragePrice) * tokensSold;
            
            // 10. Update user's sol balance
            const updatedBalance = await this.solBalanceService.updateBalanceAdd(
                balance,
                solReceived,
                solUsdValue
            );
            if (!updatedBalance) {
                throw new BadRequestException('Failed to update user balance');
            }

            // 11. Create the exit record in the exits table
            const exitRecord = await this.apeExitService.createApeExit({
                user,
                mintAddress: createApeExitDto.mintAddress,
                amount: tokensSold,
                value_usd: solUsdValue,
                value_sol: solReceived,
                price: sellPrice,
                pnl: parseFloat(realizedPnl.toFixed(4)), // final realized PnL
            });

            // 12. Update the holding
            const updatedHolding = await this.apeHoldingService.updateApeHoldingExit(
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
            // 13. If the user sold all tokens in this holding, remove the row entirely
            if (updatedHolding.amount <= 0.0000001) {
                // or just `updatedHolding.amount === 0` if you store exact zero
                await this.apeHoldingService.deleteApeHolding(updatedHolding);
                deletedHolding = true;
            }
            // 14. Update user's stats
            console.log("Updating user stats");
            const totalWins = (await this.apeExitService.findAllApeExitWinsByUserId(userId)).length;
            const updatedStats = await this.statService.updateStatOnExit(userStat, totalWins, parseFloat(realizedPnl.toFixed(4)), deletedHolding);
            if (!updatedStats) {
                throw new Error('Failed to update user stats');
            }
            await this.updateApeHoldingsPrice(userId);
            const reFetchedStat = await this.statService.findStatByUserId(userId);
            const tokenMetadata = await this.tokenMetadataService.findTokenDataByMintAddress(createApeExitDto.mintAddress);
            // 15. Return final exit record + updated state (without user fields)
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
        }  catch (error) {
            throw new Error(error);
        }
    }

    // Update all holdings of user with the new price
    // Does not calculate slippage and other losses
    async updateApeHoldingsPrice(userId: number) {
        console.log("UpdateHoldingsPrice called")
        const userStat = await this.statService.findStatByUserId(userId);
        if (!userStat) {
            throw new BadRequestException('Failed to update user stats. Please try again');
        }
        const holdings = await this.apeHoldingService.findApeHoldingsByUserId(userId);
        if (!holdings || holdings.length === 0) {
            console.log(`User ${userId} has 0 holdings => set unrealizedPnl to 0`);
            await this.statService.updateStatOnHoldingUpdate(userStat, 0);
            return []; // or return an empty array, or some success
        }

        const solPrice = await this.solanaService.getTokenPrice(this.solMint);
        if (!solPrice) {
            throw new BadRequestException('Failed to fetch price of SOL. Try again');
        }
        let newUnrealizedPnl = 0;
        let errors: { mintAddress: string; message: string }[] = [];
        // Use Promise.all to wait for all async operations
        await Promise.all(
            holdings.map(async (holding) => {
                let newPrice = holding.price;
                console.log(`Holding price: ${newPrice}`);
                try {
                    const possiblePrice = await this.solanaService.getTokenSellPrice(holding.mintAddress);
                    if (possiblePrice > 0) {
                        newPrice = possiblePrice;
                    } else {
                        throw new Error('Failed to update holding. No possible price fetched')
                    }
                } catch (error) {
                    const errorMessage = `The token ${holding.mintAddress} has no liquidity or failed to fetch token price`;
                    console.log(errorMessage);
                    errors.push({ mintAddress: holding.mintAddress, message: errorMessage });
                }
                // Must be called BEFORE price because it uses the old price in the calculation
                await this.apeHoldingService.updateApeHoldingPnl(holding, newPrice);
                // Also updates the value_usd
                await this.apeHoldingService.updateApeHoldingPrice(holding, newPrice, solPrice);
                newUnrealizedPnl += holding.pnl;
            })
        );

        // Fetch and return the updated holdings
        const updatedHoldings = await this.apeHoldingService.findApeHoldingsByUserId(userId);
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
                };
            })
        );
        const sanitizedData = enrichedData.map(({ id, user, ...rest }) => rest);
        // Update stats with new pnl
        await this.statService.updateStatOnHoldingUpdate(userStat, newUnrealizedPnl);
        return ({ holdings: sanitizedData, errors });
    }

    async getAllUserApeHoldings(userId: number) {
        const user = await this.userService.findUserById(userId);
        if (!user) {
            throw new BadRequestException('User not found');
        }

        const holdings = await this.apeHoldingService.findApeHoldingsByUserId(userId);
        if (!holdings || holdings.length === 0) {
            return [];
        }

        const enrichedData = await Promise.all(
            holdings.map(async (item) => {
                // Get metadata
                const metadata = await this.tokenMetadataService.findTokenDataByMintAddress(item.mintAddress);

                return {
                    ...item,
                    name: metadata?.name || 'Unknown',
                    ticker: metadata?.ticker || 'Unknown', // Default to 'Unknown' if metadata not found
                    image: metadata?.image || null, // Default to null if image not found
                };
            })
        );
        const sanitizedData = enrichedData.map(({ id, user, ...rest }) => rest);
        return sanitizedData;
    }
}