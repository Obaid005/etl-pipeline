import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { DatabaseService } from './modules/database/database.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Main');

  // Get the database service to generate sample data
  const databaseService = app.get(DatabaseService);

  // Generate some sample data
  try {
    await databaseService.generateSampleData();
    logger.log('Sample data generated successfully');
  } catch (error) {
    logger.error('Error generating sample data', error);
  }

  await app.listen(3000);
  logger.log('ETL Pipeline application is running on port 3000');
}
bootstrap();
