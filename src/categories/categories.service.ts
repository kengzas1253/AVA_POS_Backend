import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import {
  Category,
  CategoryStatus,
} from './entities/category.entity';

@Injectable()
export class CategoriesService implements OnModuleInit {
  private readonly generalCategoryName = 'General';

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    await this.ensureGeneralCategory();
    await this.dataSource.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_categories_name_ci
      ON categories (LOWER(TRIM(category_name)))
    `);
  }

  async create(createCategoryDto: CreateCategoryDto) {
    const categoryName = this.normalizeName(createCategoryDto.category_name);
    await this.ensureNameIsUnique(categoryName);

    const category = this.categoryRepository.create({
      ...createCategoryDto,
      category_name: categoryName,
    });
    const savedCategory = await this.saveCategory(category);

    return {
      status: 'ok',
      message: 'Category created successfully',
      data: {
        ...savedCategory,
        product_count: 0,
      },
    };
  }

  async findAll() {
    const { entities, raw } = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoin('category.products', 'product')
      .addSelect('COUNT(product.id)', 'product_count')
      .groupBy('category.id')
      .orderBy('category.sort_order', 'ASC')
      .addOrderBy('category.id', 'ASC')
      .getRawAndEntities();

    return entities.map((category, index) => ({
      ...category,
      product_count: Number(raw[index].product_count),
    }));
  }

  async findOne(id: string) {
    const { entities, raw } = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoin('category.products', 'product')
      .addSelect('COUNT(product.id)', 'product_count')
      .where('category.id = :id', { id })
      .groupBy('category.id')
      .getRawAndEntities();

    const category = entities[0];

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      ...category,
      product_count: Number(raw[0].product_count),
    };
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const updates = { ...updateCategoryDto };

    if (updates.category_name !== undefined) {
      const categoryName = this.normalizeName(updates.category_name);

      if (
        this.isGeneralCategory(category.category_name) &&
        categoryName !== this.generalCategoryName
      ) {
        throw new ConflictException('General category name cannot be changed');
      }

      await this.ensureNameIsUnique(categoryName, id);
      updates.category_name = categoryName;
    }

    this.categoryRepository.merge(category, updates);
    await this.saveCategory(category);

    return {
      status: 'ok',
      message: 'Category updated successfully',
      data: await this.findOne(id),
    };
  }

  async remove(id: string) {
    const result = await this.dataSource.transaction(async (manager) => {
      const categoryRepository = manager.getRepository(Category);
      const category = await categoryRepository.findOne({ where: { id } });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      if (this.isGeneralCategory(category.category_name)) {
        throw new ConflictException('General category cannot be deleted');
      }

      const existingGeneralCategory = await categoryRepository
        .createQueryBuilder('category')
        .where('LOWER(TRIM(category.category_name)) = LOWER(:name)', {
          name: this.generalCategoryName,
        })
        .getOne();

      const generalCategory =
        existingGeneralCategory ??
        (await categoryRepository.save(
          categoryRepository.create({
            category_name: this.generalCategoryName,
            sort_order: 0,
            status: CategoryStatus.ACTIVE,
          }),
        ));

      const updateResult = await manager
        .createQueryBuilder()
        .update('products')
        .set({ category_id: generalCategory.id })
        .where('category_id = :id', { id })
        .execute();

      await categoryRepository.remove(category);

      return {
        generalCategoryId: generalCategory.id,
        movedProductCount: updateResult.affected ?? 0,
      };
    });

    return {
      status: 'ok',
      message: 'Category deleted successfully',
      data: {
        id,
        moved_product_count: result.movedProductCount,
        moved_to_category_id: result.generalCategoryId,
        moved_to_category_name: this.generalCategoryName,
      },
    };
  }

  private async ensureGeneralCategory() {
    const generalCategory = await this.categoryRepository
      .createQueryBuilder('category')
      .where('LOWER(TRIM(category.category_name)) = LOWER(:name)', {
        name: this.generalCategoryName,
      })
      .getOne();

    if (!generalCategory) {
      await this.categoryRepository.save(
        this.categoryRepository.create({
          category_name: this.generalCategoryName,
          sort_order: 0,
          status: CategoryStatus.ACTIVE,
        }),
      );
    }
  }

  private async ensureNameIsUnique(categoryName: string, excludeId?: string) {
    const query = this.categoryRepository
      .createQueryBuilder('category')
      .where('LOWER(TRIM(category.category_name)) = LOWER(:name)', {
        name: categoryName,
      });

    if (excludeId) {
      query.andWhere('category.id != :excludeId', { excludeId });
    }

    if (await query.getOne()) {
      throw new ConflictException(
        'Duplicate category found in the system',
      );
    }
  }

  private async saveCategory(category: Category) {
    try {
      return await this.categoryRepository.save(category);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as { code?: string };

        if (driverError.code === '23505') {
          throw new ConflictException(
            'Duplicate category found in the system',
          );
        }
      }

      throw error;
    }
  }

  private normalizeName(categoryName: string) {
    const normalizedName = categoryName.trim();

    if (!normalizedName) {
      throw new BadRequestException('Category name must not be empty');
    }

    return normalizedName;
  }

  private isGeneralCategory(categoryName: string) {
    return (
      categoryName.trim().toLowerCase() ===
      this.generalCategoryName.toLowerCase()
    );
  }
}
