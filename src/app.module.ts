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
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [join(process.cwd(), 'dist/**/*.entity.js')],
        synchronize: false,
        ssl: {
          rejectUnauthorized: false,
        },
      }),
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {}
