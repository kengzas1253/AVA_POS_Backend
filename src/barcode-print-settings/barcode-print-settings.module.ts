import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { PosDevice } from '../pos-devices/entities/pos-device.entity';
import { BarcodePrintSettingsController } from './barcode-print-settings.controller';
import { BarcodePrintSettingsService } from './barcode-print-settings.service';
import { BarcodePrintSetting } from './entities/barcode-print-setting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BarcodePrintSetting, PosDevice]), AuthModule],
  controllers: [BarcodePrintSettingsController],
  providers: [BarcodePrintSettingsService],
})
export class BarcodePrintSettingsModule {}
