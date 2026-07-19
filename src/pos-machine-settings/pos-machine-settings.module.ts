import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { PosMachineSetting } from './entities/pos-machine-setting.entity';
import { PosMachineSettingsController } from './pos-machine-settings.controller';
import { PosMachineSettingsService } from './pos-machine-settings.service';

@Module({
  imports: [TypeOrmModule.forFeature([PosMachineSetting]), AuthModule],
  controllers: [PosMachineSettingsController],
  providers: [PosMachineSettingsService],
  exports: [PosMachineSettingsService],
})
export class PosMachineSettingsModule {}
