import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import {
  StockMovementQueryDto,
  StockQueryDto,
} from './dto/stock-query.dto';
import { StockService } from './stock.service';

type AuthenticatedRequest = Request & {
  user?: {
    sub: string;
  };
};

@Controller('stocks')
@UseGuards(AccessTokenGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  findAll(@Query() query: StockQueryDto) {
    return this.stockService.getStocks(query);
  }

  @Get(':productId/movements')
  findMovements(
    @Param('productId', ParseIntPipe) productId: number,
    @Query() query: StockMovementQueryDto,
  ) {
    return this.stockService.getStockMovements(productId.toString(), query);
  }

  @Get(':productId/units')
  findByUnits(
    @Param('productId', ParseIntPipe) productId: number,
    @Query('storeId') storeId?: string,
  ) {
    return this.stockService.getStockByUnits(
      productId.toString(),
      Number(storeId) || 1,
    );
  }

  @Get(':productId')
  findOne(
    @Param('productId', ParseIntPipe) productId: number,
    @Query('storeId') storeId?: string,
  ) {
    return this.stockService.getCurrentStock(
      productId.toString(),
      Number(storeId) || 1,
    );
  }

  @Post('opening')
  setOpeningStock(@Body() dto: AdjustStockDto, @Req() request: AuthenticatedRequest) {
    return this.stockService.setOpeningStock(dto, request.user?.sub);
  }

  @Post('increase')
  increaseStock(
    @Body() dto: CreateStockMovementDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.stockService.increaseStock(dto, request.user?.sub);
  }

  @Post('decrease')
  decreaseStock(
    @Body() dto: CreateStockMovementDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.stockService.decreaseStock(dto, request.user?.sub);
  }

  @Post('adjust')
  adjustStock(@Body() dto: AdjustStockDto, @Req() request: AuthenticatedRequest) {
    return this.stockService.adjustStock(dto, request.user?.sub);
  }

  @Post('movements/:id/reverse')
  reverseMovement(
    @Param('id', ParseIntPipe) id: number,
    @Body('note') note?: string,
    @Req() request?: AuthenticatedRequest,
  ) {
    return this.stockService.reverseMovement(
      id.toString(),
      note,
      request?.user?.sub,
    );
  }
}
