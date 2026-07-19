import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CreatePosMachineSettingDto } from './dto/create-pos-machine-setting.dto';
import { UpdatePosMachineSettingDto } from './dto/update-pos-machine-setting.dto';
import { PosMachineSettingsService } from './pos-machine-settings.service';

@Controller('pos-machine-settings')
@UseGuards(AccessTokenGuard)
export class PosMachineSettingsController {
  constructor(
    private readonly posMachineSettingsService: PosMachineSettingsService,
  ) {}

  @Post()
  async create(@Body() dto: CreatePosMachineSettingDto) {
    const settings = await this.posMachineSettingsService.create(dto);

    return {
      success: true,
      message: 'Machine settings created successfully.',
      data: settings,
    };
  }

  @Get()
  async findAll() {
    const settings = await this.posMachineSettingsService.findAll();

    return {
      success: true,
      message: 'Machine settings retrieved successfully.',
      data: settings,
    };
  }

  @Get('machine/:machineId')
  async findByMachineId(
    @Param('machineId', new ParseUUIDPipe({ version: '4' }))
    machineId: string,
  ) {
    const settings =
      await this.posMachineSettingsService.findByMachineId(machineId);

    return {
      success: true,
      message: 'Machine settings retrieved successfully.',
      data: settings,
    };
  }

  @Put('machine/:machineId')
  async updateByMachineId(
    @Param('machineId', new ParseUUIDPipe({ version: '4' }))
    machineId: string,
    @Body() dto: UpdatePosMachineSettingDto,
  ) {
    const settings = await this.posMachineSettingsService.updateByMachineId(
      machineId,
      dto,
    );

    return {
      success: true,
      message: 'Machine settings updated successfully.',
      data: settings,
    };
  }

  @Delete('machine/:machineId')
  async removeByMachineId(
    @Param('machineId', new ParseUUIDPipe({ version: '4' }))
    machineId: string,
  ) {
    const result =
      await this.posMachineSettingsService.removeByMachineId(machineId);

    return {
      success: true,
      message: 'Machine settings deleted successfully.',
      data: result,
    };
  }
}
