import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { CreateFavoriteGroupDto } from './dto/create-favorite-group.dto';
import { UpdateFavoriteGroupDto } from './dto/update-favorite-group.dto';
import { FavoriteGroup } from './entities/favorite-group.entity';

@Injectable()
export class FavoriteGroupsService {
  constructor(
    @InjectRepository(FavoriteGroup)
    private readonly groupRepository: Repository<FavoriteGroup>,
  ) {}

  async create(dto: CreateFavoriteGroupDto) {
    const groupName = this.normalizeName(dto.group_name);
    await this.ensureNameIsUnique(groupName);

    const group = await this.save(
      this.groupRepository.create({ ...dto, group_name: groupName }),
    );

    return {
      status: 'ok',
      message: 'Favorite group created successfully',
      data: { ...group, items: [] },
    };
  }

  findAll() {
    return this.groupRepository.find({
      relations: { items: { product: true } },
      order: {
        sort_order: 'ASC',
        id: 'ASC',
        items: { sort_order: 'ASC', id: 'ASC' },
      },
    });
  }

  async findOne(id: string) {
    const group = await this.groupRepository.findOne({
      where: { id },
      relations: { items: { product: true } },
      order: { items: { sort_order: 'ASC', id: 'ASC' } },
    });

    if (!group) {
      throw new NotFoundException('Favorite group not found');
    }

    return group;
  }

  async update(id: string, dto: UpdateFavoriteGroupDto) {
    const group = await this.groupRepository.findOne({ where: { id } });

    if (!group) {
      throw new NotFoundException('Favorite group not found');
    }

    const updates = { ...dto };
    if (updates.group_name !== undefined) {
      updates.group_name = this.normalizeName(updates.group_name);
      await this.ensureNameIsUnique(updates.group_name, id);
    }

    this.groupRepository.merge(group, updates);
    await this.save(group);

    return {
      status: 'ok',
      message: 'Favorite group updated successfully',
      data: await this.findOne(id),
    };
  }

  async remove(id: string) {
    const group = await this.groupRepository.findOne({ where: { id } });

    if (!group) {
      throw new NotFoundException('Favorite group not found');
    }

    await this.groupRepository.remove(group);

    return {
      status: 'ok',
      message: 'Favorite group deleted successfully',
      data: { id },
    };
  }

  private normalizeName(name: string) {
    const normalizedName = name.trim();
    if (!normalizedName) {
      throw new BadRequestException('Favorite group name must not be empty');
    }
    return normalizedName;
  }

  private async ensureNameIsUnique(name: string, excludeId?: string) {
    const query = this.groupRepository
      .createQueryBuilder('favorite_group')
      .where('LOWER(TRIM(favorite_group.group_name)) = LOWER(:name)', { name });

    if (excludeId) {
      query.andWhere('favorite_group.id != :excludeId', { excludeId });
    }

    if (await query.getOne()) {
      throw new ConflictException('Favorite group name already exists');
    }
  }

  private async save(group: FavoriteGroup) {
    try {
      return await this.groupRepository.save(group);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('Favorite group name already exists');
      }
      throw error;
    }
  }
}
