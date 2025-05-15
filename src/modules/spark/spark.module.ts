import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SparkService } from './spark.service';
import { QueueModule } from '../queue/queue.module';
import { WarehouseModule } from '../warehouse/warehouse.module';

@Module({
  imports: [ConfigModule, QueueModule, forwardRef(() => WarehouseModule)],
  providers: [SparkService],
  exports: [SparkService],
})
export class SparkModule {}
