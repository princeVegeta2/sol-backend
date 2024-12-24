import { Module } from '@nestjs/common';
import { CryptoController } from './crypto.controller';
import { SolanaService } from '../solana/solana.service';
import { SolanaModule } from '../solana/solana.module'; // Import SolanaModule for the SolanaService
import { CryptoService } from './crypto.service';
import { EntryModule } from 'src/entries/entry.module';
import { UserModule } from 'src/user/user.module';
import { CreateEntryDto } from 'src/entries/entry.dto';

@Module({
  imports: [SolanaModule, CreateEntryDto, EntryModule, UserModule], // Import SolanaModule to use its services
  controllers: [CryptoController], // Register the controller
  providers: [CryptoService],
  exports: [CryptoService],
})
export class CryptoModule {}
