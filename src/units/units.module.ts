import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Product } from '../products/entities/product.entity';
import { UnitGroup } from './entities/unit-group.entity';
import { Unit } from './entities/unit.entity';
import { UnitGroupsController } from './unit-groups.controller';
import { UnitGroupsService } from './unit-groups.service';
import { UnitsController } from './units.controller';
import { UnitsService } from './units.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Unit, UnitGroup]), AuthModule],
  controllers: [UnitGroupsController, UnitsController],
  providers: [UnitGroupsService, UnitsService],
})
export class UnitsModule {}
