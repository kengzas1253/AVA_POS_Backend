import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreateHeldBillItemDto } from './create-held-bill-item.dto';

export class CreateHeldBillDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  hold_name: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  customer_id?: string | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  machine_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  user_id: string;

  @IsOptional()
  @IsString()
  note?: string | null;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateHeldBillItemDto)
  items: CreateHeldBillItemDto[];
}
