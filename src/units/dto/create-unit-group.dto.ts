import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateUnitGroupDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  group_code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  group_name_th: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  group_name_en?: string | null;
}
