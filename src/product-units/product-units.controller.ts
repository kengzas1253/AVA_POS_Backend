import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CreateProductUnitDto } from './dto/create-product-unit.dto';
import { UpdateProductUnitDto } from './dto/update-product-unit.dto';
import { ProductUnitsService } from './product-units.service';

@Controller('products/:productId/units')
@UseGuards(AccessTokenGuard)
export class ProductUnitsController {
  constructor(private readonly productUnitsService: ProductUnitsService) {}

  @Post()
  create(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: CreateProductUnitDto,
  ) {
    return this.productUnitsService.create(productId.toString(), dto);
  }

  @Get()
  findByProduct(@Param('productId', ParseIntPipe) productId: number) {
    return this.productUnitsService.findByProduct(productId.toString());
  }

  @Patch(':productUnitId')
  update(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('productUnitId', ParseIntPipe) productUnitId: number,
    @Body() dto: UpdateProductUnitDto,
  ) {
    return this.productUnitsService.update(
      productId.toString(),
      productUnitId.toString(),
      dto,
    );
  }

  @Delete(':productUnitId')
  remove(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('productUnitId', ParseIntPipe) productUnitId: number,
  ) {
    return this.productUnitsService.remove(
      productId.toString(),
      productUnitId.toString(),
    );
  }

  @Post(':productUnitId/set-base')
  setBase(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('productUnitId', ParseIntPipe) productUnitId: number,
  ) {
    return this.productUnitsService.setBase(
      productId.toString(),
      productUnitId.toString(),
    );
  }
}

@Controller('product-units')
@UseGuards(AccessTokenGuard)
export class ProductUnitLookupController {
  constructor(private readonly productUnitsService: ProductUnitsService) {}

  @Get('barcode/:barcode')
  findByBarcode(@Param('barcode') barcode: string) {
    return this.productUnitsService.findByBarcode(barcode);
  }
}
