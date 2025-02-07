import { Injectable } from '@nestjs/common';
import { UserService } from './../user/user.service';
import { HoldingService } from 'src/holdings/holding.service';
import { EntryService } from 'src/entries/entry.service';
import { ExitService } from 'src/exits/exit.service';
import { SolBalanceService } from 'src/balance/sol_balance.service';
import { StatService } from 'src/stats/stats.service';
import { GroupService } from 'src/groups/group.service';


@Injectable()
export class AdminService {
    constructor(
        private readonly userService: UserService,
        private readonly holdingService: HoldingService,
        private readonly entryService: EntryService,
        private readonly exitService: ExitService,
        private readonly solBalanceService: SolBalanceService,
        private readonly statService: StatService,
        private readonly groupService: GroupService,
    ) {}

    async fetchAllUsers() {
        const users = await this.userService.findAllUsers();
        return users;
    }

    async fetchAllHoldings() {
        const holdings = await this.holdingService.findAllHoldings();
        return holdings;
    }

    async fetchAllEntries() {
        const entries = await this.entryService.findAllEntries();
    }

    async fetchAllExits() {
        const exits = await this.exitService.findAllExits();
        return exits;
    }

    async fetchAllBalances() {
        const balances = await this.solBalanceService.findAllBalances();
        return balances;
    }

    async fetchAllStats() {
        const stats = await this.statService.findAllStats();
        return stats;
    }

    async fetchAllHoldingsByUserId(userId: number) {
        const holdings = await this.holdingService.findAllUserHoldingsByUserId(userId);
        return holdings;
    }

    async fetchAllHoldingsByMintAddress(mintAddress: string) {
        const holdings = await this.holdingService.findAllHoldingsByMintAddress(mintAddress);
        return holdings;
    }

    async fetchAllEntriesByUserId(userId: number) {
        const entries = await this.entryService.findAllEntriesByUserId(userId);
        return entries;
    }

    async fetchAllEntriesByMintAddress(mintAddress: string) {
        const entries = await this.entryService.findAllEntriesByMintAddress(mintAddress);
        return entries;
    }

    async fetchAllExitsByUserId(userId: number) {
        const exits = await this.exitService.findExitsByUserId(userId);
        return exits;
    }

    async fetchAllExitsByMintAddress(mintAddress: string) {
        const exits = await this.exitService.findAllExitsByMintAddress(mintAddress);
        return exits;
    }

    async fetchBalanceByUserId(userId: number) {
        const balance = await this.solBalanceService.findBalanceByUserId(userId);
    }

    async fetchStatByUserId(userId: number) {
        const stats = await this.statService.findStatByUserId(userId);
        return stats;
    }

    async fetchAllGroups() {
        const groups = await this.groupService.findAllGroups();
    }

    // Deletions
    async deleteHoldingsByUserId(userId: number): Promise<void> {
        const holdings = await this.holdingService.findAllUserHoldingsByUserId(userId);
        for (const holding of holdings) {
            await this.holdingService.deleteHolding(holding);
        }
    }

    async deleteHoldingsByMintAddress(mintAddress: string): Promise<void> {
        const holdings = await this.holdingService.findAllHoldingsByMintAddress(mintAddress);
        for (const holding of holdings) {
            await this.holdingService.deleteHolding(holding);
        }
    }

    async deleteHoldingByUserIdAndMintAddress(userId: number, mintAddress: string): Promise<void> {
        const holding = await this.holdingService.findHoldingByUserIdAndMintAddress(userId, mintAddress);
        await this.holdingService.deleteHolding(holding);
    }

    async deleteEntriesByUserId(userId: number): Promise<void> {
        const entries = await this.entryService.findAllEntriesByUserId(userId);
        for (const entry of entries) {
            await this.entryService.deleteEntry(entry);
        }
    }

    async deleteEntriesByMintAddress(mintAddress: string): Promise<void> {
        const entries = await this.entryService.findAllEntriesByMintAddress(mintAddress);
        for (const entry of entries) {
            await this.entryService.deleteEntry(entry);
        }
    }

    async deleteEntriesByUserIdAndMintAddress(userId: number, mintAddress: string): Promise<void> {
        const entries = await this.entryService.findEntriesByUserIdAndMintAddress(userId, mintAddress);
        for (const entry of entries) {
            await this.entryService.deleteEntry(entry);
        }
    }

    async deleteExitsByUserId(userId: number): Promise<void> {
        const exits = await this.exitService.findExitsByUserId(userId);
        for (const exit of exits) {
            await this.exitService.deleteExit(exit);
        }
    }

    async deleteExitsByMintAddress(mintAddress: string): Promise<void> {
        const exits = await this.exitService.findAllExitsByMintAddress(mintAddress);
        for (const exit of exits) {
            await this.exitService.deleteExit(exit);
        }
    }

    async deleteExitsByUserIdAndMintAddress(userId: number, mintAddress: string): Promise<void> {
        const exits = await this.exitService.findExitsByUserIdAndMintAddress(userId, mintAddress);
        for (const exit of exits) {
            await this.exitService.deleteExit(exit);
        }
    }
    
    async deleteBalanceByUserId(userId: number): Promise<void> {
        const balance = await this.solBalanceService.findBalanceByUserId(userId);
        await this.solBalanceService.deleteBalance(balance);
    }

    async deleteStatByUserId(userId: number): Promise<void> {
        const stat = await this.statService.findStatByUserId(userId);
        await this.statService.deleteStat(stat);
    }
}