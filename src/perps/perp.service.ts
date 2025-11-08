import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Perp } from "./perp.entity";
import { User } from "src/user/user.entity";

type Side = 'LONG' | 'SHORT';

@Injectable()
export class PerpService {
  constructor(
    @InjectRepository(Perp)
    private perpRepository: Repository<Perp>
  ) {}

  // ------------------------
  // Helpers
  // ------------------------
  private assertSide(side: string): asserts side is Side {
    if (side !== 'LONG' && side !== 'SHORT') {
      throw new BadRequestException('side must be LONG or SHORT');
    }
  }

  private computeLiquidationPrice(side: Side, entryPrice: number, leverage: number, mmr = 0.005): number {
    if (entryPrice <= 0) throw new BadRequestException('entry price must be > 0');
    if (leverage < 1) throw new BadRequestException('leverage must be >= 1');
    return side === 'LONG'
      ? entryPrice * (1 - 1 / leverage + mmr)
      : entryPrice * (1 + 1 / leverage - mmr);
  }

  private computeUnrealizedPnl(side: Side, entryPrice: number, markPrice: number, amountSol: number): number {
    const delta = (markPrice - entryPrice) * amountSol; // USD PnL
    return side === 'LONG' ? delta : -delta;
  }

  // ------------------------
  // Commands
  // ------------------------

  /**
   * Open a new perp.
   * amount = size in SOL
   * price = current USD/SOL at entry (mark/last)
   * value_usd = amount * price (if not provided, we compute it)
   */
  async startPerpPosition(perpData: {
    user: User;
    side: string;
    leverage: number;
    amount: number;          // SOL
    price: number;           // USD per SOL
    value_usd?: number;      // will default to amount * price
    stop_loss?: number | null;
    take_profit?: number | null;
  }) {
    const {
      user, side, leverage, amount, price,
      stop_loss = null, take_profit = null,
    } = perpData;

    this.assertSide(side);
    if (!user?.id) throw new BadRequestException('Invalid user');
    if (amount <= 0) throw new BadRequestException('amount must be > 0');
    if (price <= 0) throw new BadRequestException('price must be > 0');
    if (leverage < 1) throw new BadRequestException('leverage must be >= 1');

    const entryPrice = price;
    const valueUsd = perpData.value_usd ?? amount * entryPrice;
    const liquidationPrice = this.computeLiquidationPrice(side, entryPrice, leverage);

    const sql = `
      INSERT INTO perps
        (user_id, side, leverage, amount, price, value_usd, entry_price, exit_price,
         liquidation_price, pnl, is_closed, stop_loss, take_profit, created_at, updated_at)
      VALUES
        ($1,      $2,   $3,       $4,     $5,    $6,        $7,          NULL,
         $8,                0,   false,     $9,        $10,        NOW(),     NOW())
      RETURNING *;
    `;
    const params = [
      user.id, side, leverage, amount, price, valueUsd, entryPrice,
      liquidationPrice, stop_loss, take_profit
    ];

    const [row] = await this.perpRepository.query(sql, params);
    return row as Perp;
  }

  /**
   * Manually close a position at the given exit price (USD/SOL).
   * Stores realized PnL into `pnl`.
   */
  async closePerp(perpId: number, exitPrice: number) {
    if (exitPrice <= 0) throw new BadRequestException('Invalid exit price');

    const perp = await this.getPerpById(perpId);
    if (!perp) throw new BadRequestException('Perp not found');
    if (perp.is_closed) throw new BadRequestException('Perp already closed');

    this.assertSide(perp.side as Side);

    const entryPrice = Number(perp.entry_price);
    const amountSol  = Number(perp.amount);
    const realized   = this.computeUnrealizedPnl(perp.side as Side, entryPrice, exitPrice, amountSol);

    const sql = `
      UPDATE perps
      SET
        exit_price  = $2,
        pnl         = $3,   -- realize PnL
        is_closed   = true,
        closed_at   = NOW(),
        updated_at  = NOW()
      WHERE id = $1
      RETURNING *;
    `;
    const params = [perpId, exitPrice, realized];

    const [row] = await this.perpRepository.query(sql, params);
    return row as Perp;
  }

  /**
   * Update *unrealized* PnL at a new mark (USD/SOL).
   * Also updates value_usd to amount * mark (useful for UI).
   */
  async updatePerpUnrealizedPnl(perpId: number, markPrice: number) {
    if (markPrice <= 0) throw new BadRequestException('Invalid mark price');

    const perp = await this.getPerpById(perpId);
    if (!perp) throw new BadRequestException('Perp not found');
    if (perp.is_closed) return perp;

    this.assertSide(perp.side as Side);

    const entryPrice = Number(perp.entry_price);
    const amountSol  = Number(perp.amount);
    const pnl        = this.computeUnrealizedPnl(perp.side as Side, entryPrice, markPrice, amountSol);
    const newValue   = amountSol * markPrice;

    const sql = `
      UPDATE perps
      SET
        price      = $2,     -- last mark seen
        value_usd  = $3,     -- current notional at mark
        pnl        = $4,     -- unrealized PnL
        updated_at = NOW()
      WHERE id = $1 AND is_closed = false
      RETURNING *;
    `;
    const params = [perpId, markPrice, newValue, pnl];

    const [row] = await this.perpRepository.query(sql, params);
    return row as Perp;
  }

  /**
   * Risk checks (SL/TP/Liq) + unrealized PnL updates at a given mark per perp.
   * `markByPerpId` is a map of perpId -> markPrice.
   * Returns the updated rows (closed or refreshed).
   */
  async applyRiskChecks(markByPerpId: Record<number, number>) {
    const ids = Object.keys(markByPerpId).map(Number).filter(Boolean);
    if (!ids.length) return [];

    // Fetch open perps among the provided ids
    const sqlFetch = `
      SELECT * FROM perps
      WHERE id = ANY($1) AND is_closed = false
    `;
    const openPerps: Perp[] = await this.perpRepository.query(sqlFetch, [ids]);

    const updated: Perp[] = [];

    for (const p of openPerps) {
      const mark = Number(markByPerpId[p.id]);
      if (!mark || mark <= 0) continue;

      this.assertSide(p.side as Side);

      const entryPrice = Number(p.entry_price);
      const amountSol  = Number(p.amount);

      const hitLiq = (p.side === 'LONG' && mark <= Number(p.liquidation_price))
                  || (p.side === 'SHORT' && mark >= Number(p.liquidation_price));
      const hitSL = p.stop_loss != null
        ? (p.side === 'LONG' ? mark <= Number(p.stop_loss) : mark >= Number(p.stop_loss))
        : false;
      const hitTP = p.take_profit != null
        ? (p.side === 'LONG' ? mark >= Number(p.take_profit) : mark <= Number(p.take_profit))
        : false;

      if (hitLiq || hitSL || hitTP) {
        // Close at mark (realize)
        const realized = this.computeUnrealizedPnl(p.side as Side, entryPrice, mark, amountSol);
        const sqlClose = `
          UPDATE perps
          SET
            exit_price = $2,
            pnl        = $3,
            is_closed  = true,
            closed_at  = NOW(),
            updated_at = NOW()
          WHERE id = $1 AND is_closed = false
          RETURNING *;
        `;
        const paramsClose = [p.id, mark, realized];
        const [row] = await this.perpRepository.query(sqlClose, paramsClose);
        if (row) updated.push(row as Perp);
      } else {
        // Update unrealized
        const pnl = this.computeUnrealizedPnl(p.side as Side, entryPrice, mark, amountSol);
        const newValue = amountSol * mark;

        const sqlUpd = `
          UPDATE perps
          SET
            price      = $2,
            value_usd  = $3,
            pnl        = $4,
            updated_at = NOW()
          WHERE id = $1 AND is_closed = false
          RETURNING *;
        `;
        const paramsUpd = [p.id, mark, newValue, pnl];
        const [row] = await this.perpRepository.query(sqlUpd, paramsUpd);
        if (row) updated.push(row as Perp);
      }
    }

    return updated;
  }

  // ------------------------
  // Queries
  // ------------------------

  async findOpenPerpsByUser(userId: number): Promise<Perp[]> {
    const sql = `
      SELECT * FROM perps
      WHERE user_id = $1 AND is_closed = false
      ORDER BY created_at DESC
    `;
    return this.perpRepository.query(sql, [userId]);
  }

  async findAllPerpsByUser(userId: number): Promise<Perp[]> {
    const sql = `
      SELECT * FROM perps
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    return this.perpRepository.query(sql, [userId]);
  }

  async getPerpById(id: number): Promise<Perp | null> {
    const sql = `SELECT * FROM perps WHERE id = $1 LIMIT 1`;
    const rows = await this.perpRepository.query(sql, [id]);
    return rows[0] ?? null;
  }

  async deletePerp(id: number): Promise<void> {
    const sql = `DELETE FROM perps WHERE id = $1`;
    await this.perpRepository.query(sql, [id]);
  }
}
