import { Module } from '@nestjs/common';
import { CryptoController } from './crypto.controller';
import { SolanaModule } from '../solana/solana.module'; // Import SolanaModule for the SolanaService
import { CryptoService } from './crypto.service';
import { EntryModule } from 'src/entries/entry.module';
import { UserModule } from 'src/user/user.module';
import { HoldingModule } from 'src/holdings/holding.module';

@Module({
  imports: [SolanaModule, EntryModule, UserModule, HoldingModule], // Import SolanaModule to use its services
  controllers: [CryptoController], // Register the controller
  providers: [CryptoService],
  exports: [CryptoService],
})
export class CryptoModule {}
