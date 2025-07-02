import { Controller, Get, Query, BadRequestException, Body, Post, Delete, UseGuards, Request, Param } from '@nestjs/common';
import { SolanaService } from '../solana/solana.service';
import { CreateEntryDto } from '../entries/entry.dto';
import { CreateExitDto } from 'src/exits/exit.dto';
import { CryptoService } from './crypto.service';
import { SolBalanceService } from 'src/balance/sol_balance.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import axios from 'axios';

@Controller('crypto')
export class CryptoController {
  constructor(
    private readonly solanaService: SolanaService,
    private readonly cryptoService: CryptoService,
    private readonly solBalanceService: SolBalanceService) { }


  @Get('test-price')
  async testPrice(
    @Query('mintAddress') mintAddress: string
  ) {
    const jupApiUrl = `https://lite-api.jup.ag/price/v3?ids=${mintAddress.trim()},So11111111111111111111111111111111111111112&showExtraInfo=true`;
    const response = await axios.get(jupApiUrl);
    return response.data;
  }
  @Get('token-quote')
  async getTokenQuote(
    @Query('outputMint') outputMint: string,
    @Query('amount') amount: string,
    @Query('slippage') slippage: string,
  ) {
    const numericAmount = parseFloat(amount); // Convert amount to a floating-point number
    const numericSlippage = parseInt(slippage, 10); // Slippage as an integer

    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new BadRequestException('Invalid amount parameter');
    }
    if (isNaN(numericSlippage) || numericSlippage <= 0) {
      throw new BadRequestException('Invalid slippage parameter');
    }

    return this.solanaService.getTokenQuoteSolInputTest(outputMint, numericAmount, numericSlippage);
  }


  @Get('sol-quote')
  async getSolQuote(
    @Query('inputMint') outputMint: string,
    @Query('amount') amount: string,
    @Query('slippage') slippage: string,
  ) {
    const numericAmount = parseInt(amount, 10); // Convert amount to a number
    const numericSlippage = parseInt(slippage, 10);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new BadRequestException('Invalid amount parameter');
    }

    return this.solanaService.getTokenQuoteSolOutputTest(outputMint, numericAmount, numericSlippage);
  }

  @Get('token-data')
  async getTokenData(@Query('mintAddress') mintAddress: string) {
    // Call the service to fetch token data
    return this.solanaService.getTokenData(mintAddress);
  }

  @Get('metadata')
  async getTokenMetadata(@Query('mintAddress') mintAddress: string) {
    return this.solanaService.getTokenMeta(mintAddress);
  }

  @Get('token-price')
  async getTokenPrice(@Query('mintAddress') mintAddress: string) {
    // Call the service to fetch token price
    return this.solanaService.getTokenPrice(mintAddress);
  }

  @Get('token-sell-price')
  async getTokenSellPrice(@Query('mintAddress') mintAddress: string) {
    return this.solanaService.getTokenSellPrice(mintAddress);
  }

  @Get('bulk-token-data')
  async getBulkTokenData(@Body() mintAddresses: string[]) {
    // Call the service to fetch bulk token data
    return this.solanaService.getBulkTokenData(mintAddresses);
  }

  @Get('token-decimals/:mintAddress')
  async getTokenDecimals(@Param('mintAddress') mintAddress: string) {
    return this.solanaService.getTokenDecimals(mintAddress);
  }
  @UseGuards(JwtAuthGuard)
  @Post('create-entry')
  async createEntry(@Request() req, @Body() createEntryDto: CreateEntryDto) {
    const userId = req.user.userId;
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }
    if (createEntryDto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
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
    if (createExitDto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
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
  @Get('redeem-one')
  async redeemOneSol(@Request() req) {
    const userId = req.user.userId;
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }
    return this.cryptoService.redeemOneSol(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('redeem-five')
  async redeemFiveSol(@Request() req) {
    const userId = req.user.userId;
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }
    return this.cryptoService.redeemFiveSol(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('balance-status')
  async checkBalanceStatus(@Request() req) {
    const userId = req.user.userId;
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }
    return this.solBalanceService.getRedeemingStatus(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user-stats')
  async getUserStats(@Request() req) {
    const userId = req.user.userId;
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }
    return this.cryptoService.getUserStats(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user-transactions')
  async getUserTransactions(@Request() req) {
    const userId = req.user.userId;
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }
    return this.cryptoService.getAllEntriesAndExitsByUserId(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete-holding')
  async deleteHolding(@Request() req, @Query('mintAddress') mintAddress: string) {
    const userId = req.user.userId;
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }
    return this.cryptoService.deleteAHoldingByUserId(userId, mintAddress);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user-holdings')
  async getUserHoldings(@Request() req) {
    const userId = req.user.userId;
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }
    return this.cryptoService.getAllUserHoldings(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user-networth')
  async getUserNetworth(@Request() req) {
    const userId = req.user.userId;
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }
    // Also update holdings
    await this.cryptoService.updateHoldingsPrice(userId);
    return this.cryptoService.calculateNetworth(userId);
  }
}
