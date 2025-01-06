import { Module } from '@nestjs/common';
import { CryptoController } from './crypto.controller';
import { SolanaModule } from '../solana/solana.module'; // Import SolanaModule for the SolanaService
import { CryptoService } from './crypto.service';
import { EntryModule } from 'src/entries/entry.module';
import { UserModule } from 'src/user/user.module';
import { HoldingModule } from 'src/holdings/holding.module';
import { TokenMetadataModule } from 'src/metadata/token_metadata.module';
import { ExitModule } from 'src/exits/exit.module';
import { UsdBalanceModule } from 'src/balance/usd_balance.module';
@Module({
  imports: [SolanaModule, EntryModule, UserModule, HoldingModule, TokenMetadataModule, ExitModule, UsdBalanceModule], // Import SolanaModule to use its services
  controllers: [CryptoController], // Register the controller
  providers: [CryptoService],
  exports: [CryptoService],
})
export class CryptoModule {}
