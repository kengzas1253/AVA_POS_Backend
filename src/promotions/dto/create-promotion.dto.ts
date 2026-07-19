import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  PromotionMixType,
  PromotionStatus,
  PromotionType,
} from '../entities/promotion.entity';

export class PromotionRuleDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  min_qty: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  bundle_price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  unit_price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(100)
  discount_percent?: number;
}

export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  promotion_code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  promotion_name: string;

  @IsEnum(PromotionType)
  promotion_type: PromotionType;

  @IsOptional()
  @IsBoolean()
  allow_mix?: boolean;

  @IsOptional()
  @IsEnum(PromotionMixType)
  mix_type?: PromotionMixType;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priority?: number;

  @IsOptional()
  @IsBoolean()
  can_combine?: boolean;

  @IsOptional()
  @IsEnum(PromotionStatus)
  status?: PromotionStatus;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PromotionRuleDto)
  rules: PromotionRuleDto[];

  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  product_ids: number[];
}
