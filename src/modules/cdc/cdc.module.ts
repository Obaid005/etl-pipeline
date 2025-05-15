import { Module } from '@nestjs/common';
import { CdcService } from './cdc.service';
import { DatabaseModule } from '../database/database.module';
import { ConfigModule } from '@nestjs/config';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [DatabaseModule, ConfigModule, QueueModule],
  providers: [CdcService],
  exports: [CdcService],
})
export class CdcModule {}
