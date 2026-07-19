import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ProductUnit } from '../product-units/entities/product-unit.entity';
import { Product } from '../products/entities/product.entity';
import { PromotionsModule } from '../promotions/promotions.module';
import { ProductStock } from '../stocks/entities/product-stock.entity';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductStock, ProductUnit]),
    AuthModule,
    PromotionsModule,
  ],
  controllers: [PosController],
  providers: [PosService],
})
export class PosModule {}
