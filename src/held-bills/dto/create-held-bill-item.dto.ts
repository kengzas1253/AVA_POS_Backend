import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateHeldBillItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  product_id: number;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  sku?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  barcode?: string | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  product_name: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  category_id?: number | null;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  unit_code?: string | null;

  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  price_mode: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  qty: number;

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

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unit_price: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discount_amount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  total_amount?: number;

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
  note?: string | null;
}
