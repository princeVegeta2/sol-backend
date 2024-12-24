import { Injectable } from '@nestjs/common';
import { SolanaService } from 'src/solana/solana.service';
import { EntryService } from 'src/entries/entry.service';
import { UserService } from 'src/user/user.service';
import { CreateEntryDto } from 'src/entries/entry.dto';

@Injectable()
export class CryptoService {
    constructor (
        private readonly solanaService: SolanaService,
        private readonly entryService: EntryService,
        private readonly userService: UserService,) {}

    async createEntry (userId: number, createEntryDto: CreateEntryDto) {
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

        return this.entryService.createEntry(
            user,
            createEntryDto.mintAddress,
            createEntryDto.amount,
            price,
            marketcap,
            liquidity,
        );
    }
}