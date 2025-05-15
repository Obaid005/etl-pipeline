import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';

@Controller('warehouse')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get('status')
  getStatus() {
    return this.warehouseService.getWarehouseStatus();
  }

  @Get(':collection')
  getCollection(
    @Param('collection') collection: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.warehouseService.getLatestRecords(collection, limit || 10);
  }
}
