import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { StoreSetting } from './entities/store-setting.entity';
import { StoreController } from './store.controller';
import { StoreSettingsController } from './store-settings.controller';
import { StoreSettingsService } from './store-settings.service';

@Module({
  imports: [TypeOrmModule.forFeature([StoreSetting]), AuthModule],
  controllers: [StoreController, StoreSettingsController],
  providers: [StoreSettingsService],
})
export class StoreSettingsModule {}
