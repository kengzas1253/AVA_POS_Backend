import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class AdjustStockDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  unitId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  storeId?: number = 1;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stockBaseQty: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  deviceId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  referenceType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  reasonCode?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
