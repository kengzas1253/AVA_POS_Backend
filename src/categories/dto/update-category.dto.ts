import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CategoryStatus } from '../entities/category.entity';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  category_name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort_order?: number;

  @IsOptional()
  @IsEnum(CategoryStatus)
  status?: CategoryStatus;
}
