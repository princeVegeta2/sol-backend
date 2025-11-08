import {
  Body, Controller, Post, Sse, UseGuards, Request, BadRequestException
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { LiveService } from './live.service';
import { StartPerpDto } from 'src/perps/perp.dto';
import { Observable } from 'rxjs';
import { MessageEvent } from '@nestjs/common';

class ClosePerpDto {
  perpId: number;
}

@Controller('live')
export class LiveController {
  constructor(private readonly live: LiveService) {}

  @UseGuards(JwtAuthGuard)
  @Post('open')
  async open(@Request() req, @Body() dto: StartPerpDto) {
    const userId = req.user?.userId;
    if (!userId) throw new BadRequestException('User ID not found');

    // fetch current SOL/USD mark
    const mark = await this.live.getCurrentSolUsd();
    // open + broadcast
    return this.live.openPosition(userId, dto, mark);
  }

  @UseGuards(JwtAuthGuard)
  @Post('close')
  async close(@Request() req, @Body() dto: ClosePerpDto) {
    const userId = req.user?.userId;
    if (!userId) throw new BadRequestException('User ID not found');
    if (!dto.perpId) throw new BadRequestException('perpId is required');

    // close at current mark and broadcast
    const mark = await this.live.getCurrentSolUsd();
    return this.live.closePosition(userId, dto.perpId, mark);
  }

  // Server-Sent Events stream
  @UseGuards(JwtAuthGuard)
  @Sse('stream')
  stream(@Request() req): Observable<MessageEvent> {
    const userId = req.user?.userId;
    if (!userId) throw new BadRequestException('User ID not found');
    return this.live.subscribe(userId);
  }
}
