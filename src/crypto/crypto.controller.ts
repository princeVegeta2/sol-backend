import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { SolanaService } from '../solana/solana.service';
import { PublicKey } from '@solana/web3.js';

@Controller('crypto')
export class CryptoController {
  constructor(private readonly solanaService: SolanaService) {}

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
}
