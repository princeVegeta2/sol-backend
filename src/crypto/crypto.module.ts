import { Module } from '@nestjs/common';
import { CryptoController } from './crypto.controller';
import { SolanaService } from '../solana/solana.service';
import { SolanaModule } from '../solana/solana.module'; // Import SolanaModule for the SolanaService

@Module({
  imports: [SolanaModule], // Import SolanaModule to use its services
  controllers: [CryptoController], // Register the controller
  providers: [], // Add any additional providers if needed in the future
})
export class CryptoModule {}
