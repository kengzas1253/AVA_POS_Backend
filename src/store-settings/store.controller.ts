import { Controller, Get, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { StoreSettingsService } from './store-settings.service';

@Controller('store')
@UseGuards(AccessTokenGuard)
export class StoreController {
  constructor(private readonly storeSettingsService: StoreSettingsService) {}

  @Get('settings')
  findSettings() {
    return this.storeSettingsService.findSettings();
  }
}
