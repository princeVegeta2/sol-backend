import { Controller, Get, Query, BadRequestException, Body, Post, UseGuards, Request } from '@nestjs/common';
import { SolanaService } from '../solana/solana.service';
import { CreateEntryDto } from '../entries/entry.dto';
import { CreateExitDto } from 'src/exits/exit.dto';
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

  @Get('bulk-token-data')
  async getBulkTokenData(@Body() mintAddresses: string[]) {
    // Call the service to fetch bulk token data
    return this.solanaService.getBulkTokenData(mintAddresses);
  }

  @UseGuards(JwtAuthGuard)
  @Post('create-entry')
  async createEntry(@Request() req, @Body() createEntryDto: CreateEntryDto) {
    const userId = req.user.userId;
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }
    return this.cryptoService.createEntry(userId, createEntryDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('create-exit')
  async createExit(@Request() req, @Body() createExitDto: CreateExitDto) {
    const userId = req.user.userId;
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }
    return this.cryptoService.createExit(userId, createExitDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('update-holdings')
  async updateHoldings(@Request() req) {
    const userId = req.user.userId;
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }
    return this.cryptoService.updateHoldingsPrice(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('get-balance-data')
  async getBalanceData(@Request() req) {
    const userId = req.user.userId;
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }
    return this.cryptoService.getBalanceData(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('redeem-hundred')
  async redeemHundred(@Request() req) {
    const userId = req.user.userId;
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }
    return this.cryptoService.redeemOneHundred(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('redeem-thousand')
  async redeemThousand(@Request() req) {
    const userId = req.user.userId;
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }
    return this.cryptoService.redeemOneThousand(userId);
  }
}
