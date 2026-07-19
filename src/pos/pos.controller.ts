import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CalculatePromotionsDto } from './dto/calculate-promotions.dto';
import { ScanProductDto } from './dto/scan-product.dto';
import { SearchProductsDto } from './dto/search-products.dto';
import { PosService } from './pos.service';

@Controller('pos')
@UseGuards(AccessTokenGuard)
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Post('scan-product')
  scanProduct(@Body() scanProductDto: ScanProductDto) {
    return this.posService.scanProduct(scanProductDto);
  }

  @Post('calculate-promotions')
  calculatePromotions(@Body() calculatePromotionsDto: CalculatePromotionsDto) {
    return this.posService.calculatePromotions(calculatePromotionsDto);
  }

  @Get('products/search')
  searchProducts(@Query() { q }: SearchProductsDto) {
    return this.posService.searchProducts(q);
  }
}
