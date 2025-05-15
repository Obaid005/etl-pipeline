import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CdcModule } from './modules/cdc/cdc.module';
import { QueueModule } from './modules/queue/queue.module';
import { SparkModule } from './modules/spark/spark.module';
import { WarehouseModule } from './modules/warehouse/warehouse.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('mongodb.uri');
        console.log('MongoDB URI:', uri);
        return {
          uri: uri,
        };
      },
    }),
    CdcModule,
    QueueModule,
    SparkModule,
    WarehouseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
