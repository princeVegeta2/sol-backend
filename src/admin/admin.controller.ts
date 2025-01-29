import { Controller, Get, Post, Body, Query, Delete, Put } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('users')
    async getAllUsers() {
        return this.adminService.fetchAllUsers();
    }

    @Get('holdings')
    async getAllHoldings(@Query('userId') userId?: number, @Query('mintAddress') mintAddress?: string) {
        if (userId) return this.adminService.fetchAllHoldingsByUserId(userId);
        if (mintAddress) return this.adminService.fetchAllHoldingsByMintAddress(mintAddress);
        return this.adminService.fetchAllHoldings();
    }

    @Get('entries')
    async getAllEntries(@Query('userId') userId?: number, @Query('mintAddress') mintAddress?: string) {
        if (userId) return this.adminService.fetchAllEntriesByUserId(userId);
        if (mintAddress) return this.adminService.fetchAllEntriesByMintAddress(mintAddress);
        return this.adminService.fetchAllEntries();
    }

    @Get('exits')
    async getAllExits(@Query('userId') userId?: number, @Query('mintAddress') mintAddress?: string) {
        if (userId) return this.adminService.fetchAllExitsByUserId(userId);
        if (mintAddress) return this.adminService.fetchAllExitsByMintAddress(mintAddress);
        return this.adminService.fetchAllExits();
    }

    @Get('balances')
    async getAllBalances(@Query('userId') userId?: number) {
        if (userId) return this.adminService.fetchBalanceByUserId(userId);
        return this.adminService.fetchAllBalances();
    }

    @Get('stats')
    async getAllStats(@Query('userId') userId?: number) {
        if (userId) return this.adminService.fetchStatByUserId(userId);
        return this.adminService.fetchAllStats();
    }

    @Delete('holdings')
    async deleteHoldings(@Query('userId') userId?: number, @Query('mintAddress') mintAddress?: string) {
        if (userId && mintAddress) return this.adminService.deleteHoldingByUserIdAndMintAddress(userId, mintAddress);
        if (userId) return this.adminService.deleteHoldingsByUserId(userId);
        if (mintAddress) return this.adminService.deleteHoldingsByMintAddress(mintAddress);
    }

    @Delete('entries')
    async deleteEntries(@Query('userId') userId?: number, @Query('mintAddress') mintAddress?: string) {
        if (userId && mintAddress) return this.adminService.deleteEntriesByUserIdAndMintAddress(userId, mintAddress);
        if (userId) return this.adminService.deleteEntriesByUserId(userId);
        if (mintAddress) return this.adminService.deleteEntriesByMintAddress(mintAddress);
    }

    @Delete('exits')
    async deleteExits(@Query('userId') userId?: number, @Query('mintAddress') mintAddress?: string) {
        if (userId && mintAddress) return this.adminService.deleteExitsByUserIdAndMintAddress(userId, mintAddress);
        if (userId) return this.adminService.deleteExitsByUserId(userId);
        if (mintAddress) return this.adminService.deleteExitsByMintAddress(mintAddress);
    }

    @Delete('balance')
    async deleteBalanceByUserId(@Query('userId') userId: number) {
        return this.adminService.deleteBalanceByUserId(userId);
    }

    @Delete('stats')
    async deleteStatByUserId(@Query('userId') userId: number) {
        return this.adminService.deleteStatByUserId(userId);
    }
}
