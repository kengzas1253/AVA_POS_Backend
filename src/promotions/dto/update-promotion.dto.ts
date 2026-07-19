import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PromotionRuleDto } from './create-promotion.dto';
import {
  PromotionMixType,
  PromotionStatus,
  PromotionType,
} from '../entities/promotion.entity';

export class UpdatePromotionDto {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  promotion_code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  promotion_name?: string;

  @IsOptional()
  @IsEnum(PromotionType)
  promotion_type?: PromotionType;

  @IsOptional()
  @IsBoolean()
  allow_mix?: boolean;

  @IsOptional()
  @IsEnum(PromotionMixType)
  mix_type?: PromotionMixType;

  @IsOptional()
  @IsDateString()
  start_date?: string | null;

  @IsOptional()
  @IsDateString()
  end_date?: string | null;

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

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PromotionRuleDto)
  rules?: PromotionRuleDto[];

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  product_ids?: number[];
}
