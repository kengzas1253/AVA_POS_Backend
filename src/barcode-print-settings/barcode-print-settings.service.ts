import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { PosDevice } from '../pos-devices/entities/pos-device.entity';
import { CreateBarcodePrintSettingDto } from './dto/create-barcode-print-setting.dto';
import { UpdateBarcodePrintSettingDto } from './dto/update-barcode-print-setting.dto';
import { BarcodePrintSetting } from './entities/barcode-print-setting.entity';

@Injectable()
export class BarcodePrintSettingsService {
  constructor(
    @InjectRepository(BarcodePrintSetting)
    private readonly settingRepository: Repository<BarcodePrintSetting>,
    @InjectRepository(PosDevice)
    private readonly posDeviceRepository: Repository<PosDevice>,
  ) {}

  async create(dto: CreateBarcodePrintSettingDto) {
    const setting = this.settingRepository.create(
      await this.toEntityInput(dto),
    );

    try {
      const savedSetting = await this.settingRepository.save(setting);

      return {
        status: 'ok',
        message: 'Barcode print setting created successfully',
        data: await this.findOne(savedSetting.id),
      };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  findAll() {
    return this.settingRepository.find({
      relations: { device: true },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: string) {
    const setting = await this.settingRepository.findOne({
      where: { id },
      relations: { device: true },
    });

    if (!setting) {
      throw new NotFoundException('Barcode print setting not found');
    }

    return setting;
  }

  async findByMachineId(machineId: string) {
    const setting = await this.findOneByMachineId(machineId);

    return setting;
  }

  async updateByMachineId(
    machineId: string,
    dto: UpdateBarcodePrintSettingDto,
  ) {
    const setting = await this.findOneByMachineId(machineId);

    this.settingRepository.merge(setting, {
      ...(await this.toEntityInput({ ...dto, machine_id: machineId })),
      machine_id: machineId,
    });

    try {
      await this.settingRepository.save(setting);

      return {
        status: 'ok',
        message: 'Barcode print setting updated successfully',
        data: await this.findOne(setting.id),
      };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async removeByMachineId(machineId: string) {
    const setting = await this.findOneByMachineId(machineId);

    await this.settingRepository.remove(setting);

    return {
      status: 'ok',
      message: 'Barcode print setting deleted successfully',
      data: { machine_id: machineId },
    };
  }

  private async findOneByMachineId(machineId: string) {
    const setting = await this.settingRepository.findOne({
      where: { machine_id: machineId },
      relations: { device: true },
      order: { id: 'DESC' },
    });

    if (!setting) {
      throw new NotFoundException('Barcode print setting not found');
    }

    return setting;
  }

  async update(id: string, dto: UpdateBarcodePrintSettingDto) {
    const setting = await this.settingRepository.findOne({ where: { id } });

    if (!setting) {
      throw new NotFoundException('Barcode print setting not found');
    }

    this.settingRepository.merge(setting, await this.toEntityInput(dto));

    try {
      await this.settingRepository.save(setting);

      return {
        status: 'ok',
        message: 'Barcode print setting updated successfully',
        data: await this.findOne(id),
      };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async remove(id: string) {
    const setting = await this.settingRepository.findOne({ where: { id } });

    if (!setting) {
      throw new NotFoundException('Barcode print setting not found');
    }

    await this.settingRepository.remove(setting);

    return {
      status: 'ok',
      message: 'Barcode print setting deleted successfully',
      data: { id },
    };
  }

  private async toEntityInput(
    dto: CreateBarcodePrintSettingDto | UpdateBarcodePrintSettingDto,
  ) {
    const device = await this.resolveDevice(dto);

    return {
      ...dto,
      device_id: device?.id ?? dto.device_id,
      machine_id: device?.machine_id ?? dto.machine_id,
      label_margin: dto.label_margin?.toString(),
    };
  }

  private async resolveDevice(
    dto: CreateBarcodePrintSettingDto | UpdateBarcodePrintSettingDto,
  ) {
    if (dto.machine_id) {
      const device = await this.posDeviceRepository.findOne({
        where: { machine_id: dto.machine_id },
      });

      if (!device) {
        throw new BadRequestException('POS device does not exist');
      }

      return device;
    }

    if (dto.device_id !== undefined) {
      const device = await this.posDeviceRepository.findOne({
        where: { id: dto.device_id },
      });

      if (!device) {
        throw new BadRequestException('POS device does not exist');
      }

      return device;
    }

    return undefined;
  }

  private handleDatabaseError(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as { code?: string };

      if (driverError.code === '23503') {
        throw new BadRequestException('POS device does not exist');
      }
    }

    throw error;
  }
}
