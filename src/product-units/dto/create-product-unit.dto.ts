import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductUnitDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  unitId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  barcode: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  conversionToBase: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salePrice: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costPrice: number;

  @IsOptional()
  @IsBoolean()
  isBase?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}
