import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ProductUnit } from '../product-units/entities/product-unit.entity';
import { Product } from '../products/entities/product.entity';
import { ProductStock } from './entities/product-stock.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductStock, ProductUnit, StockMovement]),
    AuthModule,
  ],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService],
})
export class StockModule {}
