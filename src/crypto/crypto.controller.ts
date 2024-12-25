import { Controller, Get, Query, BadRequestException, Body, Post, UseGuards, Request } from '@nestjs/common';
import { SolanaService } from '../solana/solana.service';
import { CreateEntryDto } from '../entries/entry.dto';
import { CryptoService } from './crypto.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('crypto')
export class CryptoController {
  constructor(
    private readonly solanaService: SolanaService,
    private readonly cryptoService: CryptoService) {}

  @Get('token-data')
  async getTokenData(@Query('mintAddress') mintAddress: string) {
    // Call the service to fetch token data
    return this.solanaService.getTokenData(mintAddress);
  }

  @Get('token-price')
  async getTokenPrice(@Query('mintAddress') mintAddress: string) {
    // Call the service to fetch token price
    return this.solanaService.getTokenPrice(mintAddress);
  }

  @UseGuards(JwtAuthGuard)
  @Post('create-entry')
  async createEntry(@Request() req, @Body() createEntryDto: CreateEntryDto) {
    const userId = req.user.userId;
    return this.cryptoService.createEntry(userId, createEntryDto);
  }
}
