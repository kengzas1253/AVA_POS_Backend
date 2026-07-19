import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Product } from '../products/entities/product.entity';
import { ProductStock } from '../stocks/entities/product-stock.entity';
import { StockMovement } from '../stocks/entities/stock-movement.entity';
import { Unit } from '../units/entities/unit.entity';
import { ProductUnit } from './entities/product-unit.entity';
import {
  ProductUnitLookupController,
  ProductUnitsController,
} from './product-units.controller';
import { ProductUnitsService } from './product-units.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductStock,
      ProductUnit,
      StockMovement,
      Unit,
    ]),
    AuthModule,
  ],
  controllers: [ProductUnitsController, ProductUnitLookupController],
  providers: [ProductUnitsService],
  exports: [ProductUnitsService],
})
export class ProductUnitsModule {}
