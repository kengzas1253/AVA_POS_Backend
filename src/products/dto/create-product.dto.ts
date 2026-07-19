import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
} from 'class-validator';
import {
  ProductPriceMode,
  ProductStatus,
} from '../entities/product.entity';

export class CreateProductDto {
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @Length(1, 50)
  sku?: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  barcode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  product_name: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  category_id?: number;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  unit_code?: string;

  @IsOptional()
  @IsEnum(ProductPriceMode)
  price_mode?: ProductPriceMode;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cost_price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  sale_price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  stock_qty?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  min_stock_qty?: number | null;

  @IsOptional()
  @IsBoolean()
  track_stock?: boolean;

  @IsOptional()
  @IsBoolean()
  allow_discount?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  image_url?: string | null;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
