import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { CreateFavoriteItemDto } from './dto/create-favorite-item.dto';
import { UpdateFavoriteItemDto } from './dto/update-favorite-item.dto';
import { FavoriteGroup } from './entities/favorite-group.entity';
import { FavoriteItem } from './entities/favorite-item.entity';

@Injectable()
export class FavoriteItemsService {
  constructor(
    @InjectRepository(FavoriteItem)
    private readonly itemRepository: Repository<FavoriteItem>,
    @InjectRepository(FavoriteGroup)
    private readonly groupRepository: Repository<FavoriteGroup>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(dto: CreateFavoriteItemDto) {
    await this.ensureReferencesExist(dto.favorite_group_id, dto.product_id);

    const item = this.itemRepository.create({
      favorite_group_id: dto.favorite_group_id.toString(),
      product_id: dto.product_id.toString(),
      sort_order: dto.sort_order,
    });
    const savedItem = await this.save(item);

    return {
      status: 'ok',
      message: 'Favorite item created successfully',
      data: await this.findOne(savedItem.id),
    };
  }

  findAll(favoriteGroupId?: number) {
    return this.itemRepository.find({
      where:
        favoriteGroupId === undefined
          ? {}
          : { favorite_group_id: favoriteGroupId.toString() },
      relations: { favorite_group: true, product: true },
      order: { sort_order: 'ASC', id: 'ASC' },
    });
  }

  async findOne(id: string) {
    const item = await this.itemRepository.findOne({
      where: { id },
      relations: { favorite_group: true, product: true },
    });

    if (!item) {
      throw new NotFoundException('Favorite item not found');
    }

    return item;
  }

  async update(id: string, dto: UpdateFavoriteItemDto) {
    const item = await this.itemRepository.findOne({ where: { id } });

    if (!item) {
      throw new NotFoundException('Favorite item not found');
    }

    const groupId = dto.favorite_group_id ?? Number(item.favorite_group_id);
    const productId = dto.product_id ?? Number(item.product_id);
    await this.ensureReferencesExist(groupId, productId);

    this.itemRepository.merge(item, {
      ...dto,
      favorite_group_id: groupId.toString(),
      product_id: productId.toString(),
    });
    await this.save(item);

    return {
      status: 'ok',
      message: 'Favorite item updated successfully',
      data: await this.findOne(id),
    };
  }

  async remove(id: string) {
    const item = await this.itemRepository.findOne({ where: { id } });

    if (!item) {
      throw new NotFoundException('Favorite item not found');
    }

    await this.itemRepository.remove(item);

    return {
      status: 'ok',
      message: 'Favorite item deleted successfully',
      data: { id },
    };
  }

  private async ensureReferencesExist(groupId: number, productId: number) {
    const [group, product] = await Promise.all([
      this.groupRepository.findOne({ where: { id: groupId.toString() } }),
      this.productRepository.findOne({ where: { id: productId.toString() } }),
    ]);

    if (!group) {
      throw new BadRequestException('Favorite group does not exist');
    }
    if (!product) {
      throw new BadRequestException('Product does not exist');
    }
  }

  private async save(item: FavoriteItem) {
    try {
      return await this.itemRepository.save(item);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const code = (error.driverError as { code?: string }).code;
        if (code === '23505') {
          throw new ConflictException(
            'Product already exists in this favorite group',
          );
        }
        if (code === '23503') {
          throw new BadRequestException(
            'Favorite group or product does not exist',
          );
        }
      }
      throw error;
    }
  }
}
