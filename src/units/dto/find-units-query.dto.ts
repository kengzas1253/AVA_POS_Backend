import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class FindUnitsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  unit_group_id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  query?: string;
}
