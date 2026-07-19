import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { RegisterPosDeviceDto } from './dto/register-pos-device.dto';
import { UpdatePosDeviceDto } from './dto/update-pos-device.dto';
import { PosDevicesService } from './pos-devices.service';

@Controller('pos-devices')
export class PosDevicesController {
  constructor(private readonly posDevicesService: PosDevicesService) {}

  @Post('register')
  register(@Body() registerPosDeviceDto: RegisterPosDeviceDto) {
    return this.posDevicesService.register(registerPosDeviceDto);
  }

  @Get()
  findAll() {
    return this.posDevicesService.findAll();
  }

  @Get(':machine_id')
  findByMachineId(@Param('machine_id') machineId: string) {
    return this.posDevicesService.findByMachineId(machineId);
  }

  @Put(':machine_id')
  update(
    @Param('machine_id') machineId: string,
    @Body() updatePosDeviceDto: UpdatePosDeviceDto,
  ) {
    return this.posDevicesService.update(machineId, updatePosDeviceDto);
  }

  @Delete(':machine_id')
  remove(@Param('machine_id') machineId: string) {
    return this.posDevicesService.remove(machineId);
  }
}
