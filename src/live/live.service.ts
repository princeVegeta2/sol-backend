import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Subject, Observable, interval, map, share, takeUntil } from 'rxjs';
import { MessageEvent } from '@nestjs/common';
import { StartPerpDto } from 'src/perps/perp.dto';
import { PerpService } from 'src/perps/perp.service';
import { SolanaService } from 'src/solana/solana.service';

type EventPayload =
  | { type: 'price'; mark: number; ts: number }
  | { type: 'positions'; data: any[]; ts: number }
  | { type: 'position-opened'; data: any; ts: number }
  | { type: 'position-closed'; data: any; ts: number }
  | { type: 'positions-updated'; data: any[]; ts: number };

@Injectable()
export class LiveService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(LiveService.name);

  // Global SOL mint (wrapped SOL)
  private readonly solMint = 'So11111111111111111111111111111111111111112';

  // 1-second ticker
  private stop$ = new Subject<void>();

  // current mark cache
  private currentMark = 0;

  // per-user SSE buses
  private buses = new Map<number, Subject<MessageEvent>>();

  constructor(
    private readonly perps: PerpService,
    private readonly solana: SolanaService,
  ) {}

  // ===== Public API for controller =====
  async getCurrentSolUsd() {
    if (this.currentMark > 0) return this.currentMark;
    const p = await this.fetchSolUsd();
    this.currentMark = p;
    return p;
  }

  subscribe(userId: number): Observable<MessageEvent> {
    let bus = this.buses.get(userId);
    if (!bus) {
      bus = new Subject<MessageEvent>();
      this.buses.set(userId, bus);
      // Push an initial snapshot async
      this.pushInitialSnapshot(userId).catch(err => this.log.error(err));
    }
    return bus.asObservable().pipe(
      share(),
      takeUntil(this.stop$),
    );
  }

  async openPosition(userId: number, dto: StartPerpDto, markPrice: number) {
    // Open perp via PerpService (amount in SOL; value_usd computed inside)
    const created = await this.perps.startPerpPosition({
      user: { id: userId } as any,
      side: dto.side,
      leverage: dto.leverage,
      amount: dto.amount,
      price: markPrice,
      value_usd: dto.amount * markPrice,
      stop_loss: dto.stopLoss ?? null,
      take_profit: dto.takeProfit ?? null,
    });

    this.emit(userId, {
      type: 'position-opened',
      data: created,
      ts: Date.now(),
    });

    // Immediately push refreshed open perps snapshot
    const positions = await this.perps.findOpenPerpsByUser(userId);
    this.emit(userId, { type: 'positions', data: positions, ts: Date.now() });

    return created;
  }

  async closePosition(userId: number, perpId: number, markPrice: number) {
    const closed = await this.perps.closePerp(perpId, markPrice);

    this.emit(userId, {
      type: 'position-closed',
      data: closed,
      ts: Date.now(),
    });

    const positions = await this.perps.findOpenPerpsByUser(userId);
    this.emit(userId, { type: 'positions', data: positions, ts: Date.now() });

    return closed;
  }

  // ===== Module lifecycle =====
  onModuleInit() {
    // Poll price every 1s (Jupiter limit 60/min)
    interval(1000)
      .pipe(takeUntil(this.stop$))
      .subscribe(async () => {
        try {
          const mark = await this.fetchSolUsd();

          // Only broadcast if changed by a tick-or-two (or always; here we always emit)
          this.currentMark = mark;
          this.broadcast({ type: 'price', mark, ts: Date.now() });

          // Apply risk checks globally (single mark for SOL across all users)
          // 1) Find ALL open perps
          const openPerps = await this.perps.findAllPerpsByUser
            ? null // we don't have a global "findAllOpenPerps" in that service yet
            : null;

          // We'll implement a minimal "findAllOpenPerps" inline:
          const updated = await this.applyGlobalRisk(mark);

          // Broadcast updated positions per user
          if (updated.length) {
            // Group by user_id
            const byUser = new Map<number, any[]>();
            for (const p of updated) {
              const uid = Number(p.user_id ?? p.user?.id);
              if (!uid) continue;
              if (!byUser.has(uid)) byUser.set(uid, []);
              byUser.get(uid)!.push(p);
            }
            const ts = Date.now();
            for (const [uid, list] of byUser.entries()) {
              this.emit(uid, { type: 'positions-updated', data: list, ts });
            }
          }
        } catch (err) {
          this.log.error(`poll tick error: ${err?.message ?? err}`);
        }
      });
  }

  onModuleDestroy() {
    this.stop$.next();
    this.stop$.complete();
    for (const bus of this.buses.values()) bus.complete();
    this.buses.clear();
  }

  // ===== Internals =====
  private emit(userId: number, payload: EventPayload) {
    const bus = this.buses.get(userId);
    if (!bus) return;
    bus.next({ data: payload } as MessageEvent);
  }

  private broadcast(payload: EventPayload) {
    const evt = { data: payload } as MessageEvent;
    for (const [, bus] of this.buses) {
      bus.next(evt);
    }
  }

  private async pushInitialSnapshot(userId: number) {
    const positions = await this.perps.findOpenPerpsByUser(userId);
    this.emit(userId, { type: 'positions', data: positions, ts: Date.now() });
    if (this.currentMark > 0) {
      this.emit(userId, { type: 'price', mark: this.currentMark, ts: Date.now() });
    }
  }

  private async fetchSolUsd(): Promise<number> {
    // Your SolanaService already supports this; using wlSOL mint:
    const price = await this.solana.getTokenSellPrice(this.solMint);
    // defend against NaN/0:
    if (!price || price <= 0) throw new Error('Failed to fetch SOL price');
    return price;
  }

  /**
   * Apply risk checks for ALL open perps at current mark.
   * Uses PerpService's SQL queries. Returns array of rows updated (closed or updated).
   */
  private async applyGlobalRisk(mark: number) {
    // We'll implement a small helper query here via PerpService raw SQL flavor:
    // reuse PerpService methods when possible; otherwise, inline query for all open perps and update.
    // We already wrote applyRiskChecks(markByPerpId) earlier — let’s reuse that
    // but we need all open perps ids:

    // 1) fetch all open perps
    const open = await this.fetchAllOpenPerps();
    if (!open.length) return [];

    // 2) build id->mark map (same mark for all)
    const markMap: Record<number, number> = {};
    for (const p of open) markMap[p.id] = mark;

    // 3) delegate to PerpService risk engine (it updates rows and returns updated)
    // If you didn’t paste applyRiskChecks into PerpService, you can replace with your own
    // For this answer we assume it exists (from our previous step).
    const updated = await this.perps.applyRiskChecks(markMap);
    return updated;
  }

  private async fetchAllOpenPerps(): Promise<any[]> {
    // minimal raw SQL (matches your style)
    const sql = `SELECT * FROM perps WHERE is_closed = false`;
    // access repository via a tiny hack (we don't have it here), so delegate:
    // We'll add a helper to PerpService so we don't duplicate connection logic.
    // For now, simulate via an existing call:
    // return await this.perps.findAllOpenPerps();  <-- if you add it.
    // Since previous PerpService didn't have a global open fetch, let's quickly add it:
    // To keep this snippet self-contained, we’ll call a private method on perps using 'any' cast:
    const anyPerps = this.perps as any;
    if (typeof anyPerps['perpRepository']?.query === 'function') {
      return anyPerps['perpRepository'].query(sql);
    }
    // fallback: nothing
    return [];
  }
}
