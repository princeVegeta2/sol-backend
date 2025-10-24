import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CryptoModule } from './crypto/crypto.module';
import { HoldingModule } from './holdings/holding.module';
import { UserModule } from './user/user.module';
import { TokenMetadataModule } from './metadata/token_metadata.module';
import { ExitModule } from './exits/exit.module';
import { SolBalanceModule } from './balance/sol_balance.module';
import { StatModule } from './stats/stats.module';
import { HealthModule } from './health/health.module';
import { AdminModule } from './admin/admin.module';
import { GroupModule } from './groups/group.module';
import { ApeEntryModule } from './ape_entry/ape_entry.module';
import { ApeExitModule } from './ape_exit/ape_exit.module';
import { ApeHoldingModule } from './ape_holdings/ape_holding.module';
import { ApeModule } from './ape/ape.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';



@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule,
    CryptoModule,
    HoldingModule,
    UserModule,
    TokenMetadataModule,
    ExitModule,
    SolBalanceModule,
    StatModule,
    HealthModule,
    AdminModule,
    GroupModule,
    ApeEntryModule,
    ApeExitModule,
    ApeHoldingModule,
    ApeModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [join(process.cwd(), 'dist/**/*.entity.js')],
        synchronize: false,
        ssl: false,
      })

    })
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule { }
