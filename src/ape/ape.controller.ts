import { Controller, Get, Post, Query, UseGuards, Request, Body, UnauthorizedException, BadRequestException} from "@nestjs/common";
import { ApeService } from "./ape.service";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { CreateApeEntryDto } from "src/ape_entry/ape_entry.dto";
import { CreateApeExitDto } from "src/ape_exit/ape_exit.dto";

@Controller('ape')
export class ApeController {
    constructor(
        private readonly apeService: ApeService,
    ) {}

    @UseGuards(JwtAuthGuard)
    @Post('create-ape-entry')
    async createApeEntry(@Request() req, @Body() createApeEntryDto: CreateApeEntryDto) {
        const userId = req.user.userId;
        if (!userId) {
            throw new UnauthorizedException("User ID not found");
        }
        if (createApeEntryDto.amount <= 0) {
            throw new BadRequestException("Amount must be larger than 0");
        }
        return this.apeService.createApeEntry(userId, createApeEntryDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('create-ape-exit')
    async createApeExit(@Request() req, @Body() createApeExitDto: CreateApeExitDto) {
        const userId = req.user.userId;
        if (!userId) {
            throw new UnauthorizedException("User ID not found");
        }
        if (createApeExitDto.amount <= 0) {
            throw new BadRequestException("Amount must be larger than 0");
        }
        return this.apeService.createApeExit(userId, createApeExitDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('update-ape-holdings')
    async updateApeHoldings(@Request() req) {
        const userId = req.user.userId;
        if (!userId) {
            throw new UnauthorizedException("User ID not found");
        }
        return this.apeService.updateApeHoldingsPrice(userId);
    }
}