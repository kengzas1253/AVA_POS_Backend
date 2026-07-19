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
import { BarcodePrintSettingsService } from './barcode-print-settings.service';
import { CreateBarcodePrintSettingDto } from './dto/create-barcode-print-setting.dto';
import { UpdateBarcodePrintSettingDto } from './dto/update-barcode-print-setting.dto';

@Controller('barcode-print-settings')
@UseGuards(AccessTokenGuard)
export class BarcodePrintSettingsController {
  constructor(private readonly service: BarcodePrintSettingsService) {}

  @Post()
  create(@Body() dto: CreateBarcodePrintSettingDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('machine/:machine_id')
  findByMachineId(@Param('machine_id') machineId: string) {
    return this.service.findByMachineId(machineId);
  }

  @Put('machine/:machine_id')
  updateByMachineId(
    @Param('machine_id') machineId: string,
    @Body() dto: UpdateBarcodePrintSettingDto,
  ) {
    return this.service.updateByMachineId(machineId, dto);
  }

  @Delete('machine/:machine_id')
  removeByMachineId(@Param('machine_id') machineId: string) {
    return this.service.removeByMachineId(machineId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id.toString());
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBarcodePrintSettingDto,
  ) {
    return this.service.update(id.toString(), dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id.toString());
  }
}
