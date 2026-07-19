import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegisterPosDeviceDto } from './dto/register-pos-device.dto';
import { UpdatePosDeviceDto } from './dto/update-pos-device.dto';
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

  async update(machineId: string, updatePosDeviceDto: UpdatePosDeviceDto) {
    const device = await this.posDeviceRepository.findOne({
      where: { machine_id: machineId },
    });

    if (!device) {
      throw new NotFoundException('POS device not found');
    }

    const updatedDevice = this.posDeviceRepository.merge(
      device,
      updatePosDeviceDto,
    );
    const savedDevice = await this.posDeviceRepository.save(updatedDevice);

    return {
      status: 'ok',
      message: 'POS device updated successfully',
      data: savedDevice,
    };
  }

  async remove(machineId: string) {
    const device = await this.posDeviceRepository.findOne({
      where: { machine_id: machineId },
    });

    if (!device) {
      throw new NotFoundException('POS device not found');
    }

    await this.posDeviceRepository.remove(device);

    return {
      status: 'ok',
      message: 'POS device deleted successfully',
      data: {
        machine_id: machineId,
      },
    };
  }
}
