import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { HeldBillItem } from './entities/held-bill-item.entity';
import { HeldBill } from './entities/held-bill.entity';
import { HeldBillsController } from './held-bills.controller';
import { HeldBillsService } from './held-bills.service';

@Module({
  imports: [TypeOrmModule.forFeature([HeldBill, HeldBillItem]), AuthModule],
  controllers: [HeldBillsController],
  providers: [HeldBillsService],
})
export class HeldBillsModule {}
