import { Injectable } from '@nestjs/common';
import { SolanaService } from 'src/solana/solana.service';
import { EntryService } from 'src/entries/entry.service';
import { UserService } from 'src/user/user.service';
import { CreateEntryDto } from 'src/entries/entry.dto';
import { HoldingService } from 'src/holdings/holding.service';

@Injectable()
export class CryptoService {
    constructor(
        private readonly solanaService: SolanaService,
        private readonly entryService: EntryService,
        private readonly userService: UserService,
        private readonly holdingService: HoldingService,) { }

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

        // Create a holding entry
        await this.holdingService.createHolding({
            user,
            mintAddress: createEntryDto.mintAddress,
            amount: createEntryDto.amount,
            price,
            value_usd,
        });

        // Create an entry in the entries table
        const entry = await this.entryService.createEntry({
            user,
            mintAddress: createEntryDto.mintAddress,
            amount: createEntryDto.amount,
            source: createEntryDto.source,
            price,
            marketcap,
            liquidity,
        });

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
}