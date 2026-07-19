import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateUnitDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  unit_group_id?: number;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  unit_code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  unit_name_th?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  unit_name_en?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  symbol?: string | null;

  @IsOptional()
  @IsBoolean()
  is_decimal?: boolean;
}
