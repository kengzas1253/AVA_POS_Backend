import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { CreateUnitDto } from './dto/create-unit.dto';
import { FindUnitsQueryDto } from './dto/find-units-query.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { UnitGroup } from './entities/unit-group.entity';
import { Unit } from './entities/unit.entity';

@Injectable()
export class UnitsService {
  constructor(
    @InjectRepository(Unit)
    private readonly unitRepository: Repository<Unit>,
    @InjectRepository(UnitGroup)
    private readonly unitGroupRepository: Repository<UnitGroup>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createUnitDto: CreateUnitDto) {
    await this.ensureUnitGroupExists(createUnitDto.unit_group_id.toString());

    const unit = this.unitRepository.create(this.normalizeUnit(createUnitDto));

    try {
      await this.unitRepository.save(unit);

      return {
        success: true,
        message: 'Unit created successfully',
      };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async findAll(query: FindUnitsQueryDto) {
    const queryBuilder = this.unitRepository
      .createQueryBuilder('unit')
      .orderBy('unit.id', 'ASC');

    if (query.unit_group_id) {
      queryBuilder.andWhere('unit.unit_group_id = :unitGroupId', {
        unitGroupId: query.unit_group_id.toString(),
      });
    }

    if (query.query?.trim()) {
      queryBuilder.andWhere(
        `(
          unit.unit_code ILIKE :query
          OR unit.unit_name_th ILIKE :query
          OR unit.unit_name_en ILIKE :query
          OR unit.symbol ILIKE :query
        )`,
        { query: `%${query.query.trim()}%` },
      );
    }

    return {
      success: true,
      data: await queryBuilder.getMany(),
    };
  }

  async findOne(id: string) {
    const unit = await this.unitRepository.findOne({ where: { id } });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    return {
      success: true,
      data: unit,
    };
  }

  async update(id: string, updateUnitDto: UpdateUnitDto) {
    if (updateUnitDto.unit_group_id) {
      await this.ensureUnitGroupExists(updateUnitDto.unit_group_id.toString());
    }

    const unit = await this.unitRepository.preload({
      id,
      ...this.normalizeUnit(updateUnitDto),
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    try {
      await this.unitRepository.save(unit);

      return {
        success: true,
        message: 'Unit updated successfully',
      };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async remove(id: string) {
    const unit = await this.unitRepository.findOne({ where: { id } });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    const usedProductCount = await this.productRepository.count({
      where: { unit_code: unit.unit_code },
    });

    if (usedProductCount > 0) {
      throw new ConflictException('Cannot delete unit while products use it');
    }

    await this.unitRepository.remove(unit);

    return {
      success: true,
      message: 'Deleted successfully',
    };
  }

  private async ensureUnitGroupExists(id: string) {
    const exists = await this.unitGroupRepository.exists({ where: { id } });

    if (!exists) {
      throw new NotFoundException('Unit group not found');
    }
  }

  private normalizeUnit(dto: CreateUnitDto | UpdateUnitDto): Partial<Unit> {
    return {
      ...dto,
      unit_group_id: dto.unit_group_id?.toString(),
      unit_code: dto.unit_code?.trim().toUpperCase(),
      unit_name_th: dto.unit_name_th?.trim(),
      unit_name_en: dto.unit_name_en?.trim() || null,
      symbol: dto.symbol?.trim() || null,
    };
  }

  private handleDatabaseError(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as { code?: string };

      if (driverError.code === '23505') {
        throw new ConflictException('Unit code already exists');
      }
    }

    throw error;
  }
}
