import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ApeEntry } from "./ape_entry.entity";
import { ApeEntryService } from "./ape_entry.service";

@Module({
    imports: [TypeOrmModule.forFeature([ApeEntry])],
    providers: [ApeEntryService],
    exports: [ApeEntryService],
})

export class ApeEntryModule {}