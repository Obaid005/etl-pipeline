import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WarehouseService } from './warehouse.service';
import { SparkModule } from '../spark/spark.module';
import { WarehouseController } from './warehouse.controller';

@Module({
  imports: [ConfigModule, forwardRef(() => SparkModule)],
  providers: [WarehouseService],
  exports: [WarehouseService],
  controllers: [WarehouseController],
})
export class WarehouseModule {}
