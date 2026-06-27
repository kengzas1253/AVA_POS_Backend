import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateFavoriteGroupDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  group_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  icon?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort_order?: number;
}
