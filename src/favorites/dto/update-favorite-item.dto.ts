import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class UpdateFavoriteItemDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  favorite_group_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  product_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort_order?: number;
}
