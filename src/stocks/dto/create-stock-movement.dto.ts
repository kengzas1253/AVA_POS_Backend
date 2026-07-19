import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { StockMovementType } from '../entities/stock-movement-type.enum';

export class CreateStockMovementDto {
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
  productUnitId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  storeId?: number = 1;

  @IsOptional()
  @IsEnum(StockMovementType)
  movementType?: StockMovementType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  inputQty?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  qty?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  conversionToBase?: number = 1;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined,
  )
  @IsString()
  @MaxLength(30)
  referenceType?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined,
  )
  @IsString()
  @MaxLength(100)
  referenceId?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined,
  )
  @IsString()
  @MaxLength(50)
  reasonCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined,
  )
  @IsString()
  note?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  deviceId?: number;
}
