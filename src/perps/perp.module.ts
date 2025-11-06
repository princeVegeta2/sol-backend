import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Perp } from "./perp.entity";
import { PerpService } from "./perp.service";

@Module({
  imports: [TypeOrmModule.forFeature([Perp])],
  providers: [PerpService], // Only add services here
  exports: [PerpService], // Export only the services you need to use in other modules
})
export class PerpModule {}
