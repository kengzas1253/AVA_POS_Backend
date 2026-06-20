import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegisterPosDeviceDto } from './dto/register-pos-device.dto';
import { PosDevice } from './entities/pos-device.entity';

@Injectable()
export class PosDevicesService {
  constructor(
    @InjectRepository(PosDevice)
    private readonly posDeviceRepository: Repository<PosDevice>,
  ) {}

  async register(registerPosDeviceDto: RegisterPosDeviceDto) {
    const existingDevice = await this.posDeviceRepository.findOne({
      where: { machine_id: registerPosDeviceDto.machine_id },
    });

    const device = this.posDeviceRepository.create({
      ...existingDevice,
      ...registerPosDeviceDto,
    });

    const savedDevice = await this.posDeviceRepository.save(device);

    return {
      status: 'ok',
      message: existingDevice
        ? 'POS device updated successfully'
        : 'POS device registered successfully',
      data: savedDevice,
    };
  }

  findAll() {
    return this.posDeviceRepository.find({
      order: { id: 'ASC' },
    });
  }

  async findByMachineId(machineId: string) {
    const device = await this.posDeviceRepository.findOne({
      where: { machine_id: machineId },
    });

    if (!device) {
      throw new NotFoundException('POS device not found');
    }

    return device;
  }
}
