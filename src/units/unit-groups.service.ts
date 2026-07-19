import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { CreateUnitGroupDto } from './dto/create-unit-group.dto';
import { UpdateUnitGroupDto } from './dto/update-unit-group.dto';
import { UnitGroup } from './entities/unit-group.entity';
import { Unit } from './entities/unit.entity';

@Injectable()
export class UnitGroupsService {
  constructor(
    @InjectRepository(UnitGroup)
    private readonly unitGroupRepository: Repository<UnitGroup>,
    @InjectRepository(Unit)
    private readonly unitRepository: Repository<Unit>,
  ) {}

  async create(createUnitGroupDto: CreateUnitGroupDto) {
    const unitGroup = this.unitGroupRepository.create(
      this.normalizeUnitGroup(createUnitGroupDto),
    );

    try {
      await this.unitGroupRepository.save(unitGroup);

      return {
        success: true,
        message: 'Unit group created successfully',
      };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async findAll() {
    const unitGroups = await this.unitGroupRepository.find({
      order: { id: 'ASC' },
    });

    return {
      success: true,
      data: unitGroups,
    };
  }

  async findAllWithUnits() {
    const unitGroups = await this.unitGroupRepository.find({
      relations: { units: true },
      order: {
        id: 'ASC',
        units: {
          id: 'ASC',
        },
      },
    });

    return {
      success: true,
      data: unitGroups.map((unitGroup) => ({
        id: unitGroup.id,
        group_code: unitGroup.group_code,
        group_name_th: unitGroup.group_name_th,
        group_name_en: unitGroup.group_name_en,
        units: unitGroup.units.map((unit) => ({
          id: unit.id,
          unit_code: unit.unit_code,
          unit_name_th: unit.unit_name_th,
          unit_name_en: unit.unit_name_en,
          symbol: unit.symbol,
          is_decimal: unit.is_decimal,
        })),
      })),
    };
  }

  async update(id: string, updateUnitGroupDto: UpdateUnitGroupDto) {
    const unitGroup = await this.unitGroupRepository.preload({
      id,
      ...this.normalizeUnitGroup(updateUnitGroupDto),
    });

    if (!unitGroup) {
      throw new NotFoundException('Unit group not found');
    }

    try {
      await this.unitGroupRepository.save(unitGroup);

      return {
        success: true,
        message: 'Unit group updated successfully',
      };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async remove(id: string) {
    const unitGroup = await this.unitGroupRepository.findOne({
      where: { id },
    });

    if (!unitGroup) {
      throw new NotFoundException('Unit group not found');
    }

    const usedUnitCount = await this.unitRepository.count({
      where: { unit_group_id: id },
    });

    if (usedUnitCount > 0) {
      throw new ConflictException('Cannot delete unit group while units exist');
    }

    await this.unitGroupRepository.remove(unitGroup);

    return {
      success: true,
      message: 'Deleted successfully',
    };
  }

  private normalizeUnitGroup(
    dto: CreateUnitGroupDto | UpdateUnitGroupDto,
  ): Partial<UnitGroup> {
    return {
      ...dto,
      group_code: dto.group_code?.trim().toUpperCase(),
      group_name_th: dto.group_name_th?.trim(),
      group_name_en: dto.group_name_en?.trim() || null,
    };
  }

  private handleDatabaseError(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as { code?: string };

      if (driverError.code === '23505') {
        throw new ConflictException('Unit group code already exists');
      }
    }

    throw error;
  }
}
