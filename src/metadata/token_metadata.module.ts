import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TokenMetadata } from "./token_metadata.entity";
import { TokenMetadataService } from "./token_metadata.service";

@Module({
  imports: [TypeOrmModule.forFeature([TokenMetadata])],
  providers: [TokenMetadataService], // Only add services here
  exports: [TokenMetadataService], // Export only the services you need to use in other modules
})

export class TokenMetadataModule {}