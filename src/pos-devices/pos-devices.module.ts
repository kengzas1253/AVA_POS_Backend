import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PosDevice } from './entities/pos-device.entity';
import { PosDevicesController } from './pos-devices.controller';
import { PosDevicesService } from './pos-devices.service';

@Module({
  imports: [TypeOrmModule.forFeature([PosDevice])],
  controllers: [PosDevicesController],
  providers: [PosDevicesService],
})
export class PosDevicesModule {}
