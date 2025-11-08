import { Module } from '@nestjs/common';
import { PerpModule } from 'src/perps/perp.module';

@Module({
    imports: [PerpModule],
    // live service etc
})

export class LiveModule {}