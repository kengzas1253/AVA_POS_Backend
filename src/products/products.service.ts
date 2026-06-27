import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    const product = this.productRepository.create({
      ...createProductDto,
      category_id: createProductDto.category_id?.toString(),
      cost_price: createProductDto.cost_price?.toString(),
      sale_price: createProductDto.sale_price?.toString(),
      stock_qty: createProductDto.stock_qty?.toString(),
      min_stock_qty: createProductDto.min_stock_qty?.toString(),
    });

    try {
      const savedProduct = await this.productRepository.save(product);
      const productWithCategory = await this.productRepository.findOne({
        where: { id: savedProduct.id },
        relations: { category: true },
      });

      return {
        status: 'ok',
        message: 'Product created successfully',
        data: productWithCategory,
      };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  findAll() {
    return this.productRepository.find({
      relations: { category: true },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: string) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: { category: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.productRepository.preload({
      id,
      ...updateProductDto,
      category_id: updateProductDto.category_id?.toString(),
      cost_price: updateProductDto.cost_price?.toString(),
      sale_price: updateProductDto.sale_price?.toString(),
      stock_qty: updateProductDto.stock_qty?.toString(),
      min_stock_qty: updateProductDto.min_stock_qty?.toString(),
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    try {
      await this.productRepository.save(product);
      const updatedProduct = await this.findOne(id);

      return {
        status: 'ok',
        message: 'Product updated successfully',
        data: updatedProduct,
      };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async remove(id: string) {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    try {
      await this.productRepository.remove(product);

      return {
        status: 'ok',
        message: 'Product deleted successfully',
        data: {
          id,
        },
      };
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as { code?: string };

        if (driverError.code === '23503') {
          throw new ConflictException(
            'Product cannot be deleted because it is being used',
          );
        }
      }

      throw error;
    }
  }

  private handleDatabaseError(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as {
        code?: string;
        constraint?: string;
      };

      if (driverError.code === '23505') {
        throw new ConflictException(
          driverError.constraint?.includes('barcode')
            ? 'Barcode already exists'
            : 'SKU already exists',
        );
      }

      if (driverError.code === '23503') {
        throw new BadRequestException('Category does not exist');
      }
    }

    throw error;
  }
}
