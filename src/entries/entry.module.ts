import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Entry } from "./entry.entity";
import { EntryService } from "./entry.service";

@Module({
  imports: [TypeOrmModule.forFeature([Entry])],
  providers: [EntryService], // Only add services here
  exports: [EntryService], // Export only the services you need to use in other modules
})
export class EntryModule {}
