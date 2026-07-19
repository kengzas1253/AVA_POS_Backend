import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CreateStoreSettingDto } from './dto/create-store-setting.dto';
import { UpdateStoreSettingDto } from './dto/update-store-setting.dto';
import { StoreSettingsService } from './store-settings.service';

@Controller('store-settings')
@UseGuards(AccessTokenGuard)
export class StoreSettingsController {
  constructor(private readonly storeSettingsService: StoreSettingsService) {}

  @Post()
  create(@Body() createStoreSettingDto: CreateStoreSettingDto) {
    return this.storeSettingsService.create(createStoreSettingDto);
  }

  @Get()
  findAll() {
    return this.storeSettingsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.storeSettingsService.findOne(id.toString());
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStoreSettingDto: UpdateStoreSettingDto,
  ) {
    return this.storeSettingsService.update(
      id.toString(),
      updateStoreSettingDto,
    );
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.storeSettingsService.remove(id.toString());
  }
}
