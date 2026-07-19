import {
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class UpdateUnitGroupDto {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  group_code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  group_name_th?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  group_name_en?: string | null;
}
