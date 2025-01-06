import { Injectable } from '@nestjs/common';
import { SolanaService } from 'src/solana/solana.service';
import { EntryService } from 'src/entries/entry.service';
import { UserService } from 'src/user/user.service';
import { CreateEntryDto } from 'src/entries/entry.dto';
import { HoldingService } from 'src/holdings/holding.service';
import { TokenMetadataService } from 'src/metadata/token_metadata.service';
import { ExitService } from 'src/exits/exit.service';
import { CreateExitDto } from 'src/exits/exit.dto';

@Injectable()
export class CryptoService {
    constructor(
        private readonly solanaService: SolanaService,
        private readonly entryService: EntryService,
        private readonly userService: UserService,
        private readonly holdingService: HoldingService,
        private readonly tokenMetadataService: TokenMetadataService,
        private readonly exitService: ExitService,) { }


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
        console.log('Finding holding for userId:', userId, 'and mintAddress:', createExitDto.mintAddress);

        // Find the holding
        const holding = await this.holdingService.findHoldingByUserIdAndMintAddress(userId, createExitDto.mintAddress);
        if (!holding) {
            throw new Error('Holding not found');
        }

        if (holding.amount <= createExitDto.amount) {
            // Delete holding
            this.holdingService.deleteHolding(holding);
        }else {
            // Update the holding with the exit amount
            await this.holdingService.updateHoldingExit(holding, createExitDto.amount);
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
        const image = tokenData.info.imageUrl;
        const website = tokenData.info.websites.url;
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
                marketcap,
                liquidity,
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

        if (!existingMetadata) {
            await this.tokenMetadataService.createTokenMetadata({
                mint_address: createEntryDto.mintAddress,
                image,
                website,
                x_page,
                telegram,
            });
        }

        // Return only non-sensitive fields in the response
        return {
            id: entry.id,
            mintAddress: entry.mintAddress,
            amount: entry.amount,
            source: entry.source,
            price: entry.price,
            marketcap: entry.marketcap,
            liquidity: entry.liquidity,
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
}