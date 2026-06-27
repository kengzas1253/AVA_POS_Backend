import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class CreateFavoriteItemDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  favorite_group_id: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  product_id: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort_order?: number;
}
