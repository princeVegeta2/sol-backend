import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class PerpService implements OnModuleInit, OnModuleDestroy {
  private currentSolPrice = 0;

  // Using ReturnType<typeof setInterval> is safer than NodeJS.Timeout
  // in some TypeScript environments
  private priceInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Usually empty for a simple service
  }

  async getSolPrice(): Promise<number> {
    const res = await axios.get(
      'https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112'
    );
    const price = parseFloat(
      res.data.data['So11111111111111111111111111111111111111112'].price
    );
    return price;
  }

  getCurrentSolPrice(): number {
    return this.currentSolPrice;
  }

  onModuleInit() {
    // This method runs when NestJS initializes the module
    this.priceInterval = setInterval(async () => {
      try {
        const newPrice = await this.getSolPrice();
        this.currentSolPrice = newPrice;
      } catch (err) {
        console.error('Failed to fetch SOL price:', err);
      }
    }, 3000);
  }

  onModuleDestroy() {
    // This method runs when NestJS destroys the module/app
    if (this.priceInterval) {
      clearInterval(this.priceInterval);
    }
  }
}
