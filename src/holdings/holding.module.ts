import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Holding } from "./holding.entity";
import { HoldingService } from "./holding.service";
import { UserModule } from "src/user/user.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Holding]),
    UserModule,
  ],
  providers: [HoldingService], // Only add services here
  exports: [HoldingService], // Export only the services you need to use in other modules
})

export class HoldingModule {}