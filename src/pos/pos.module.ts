import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Product } from '../products/entities/product.entity';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), AuthModule],
  controllers: [PosController],
  providers: [PosService],
})
export class PosModule {}
