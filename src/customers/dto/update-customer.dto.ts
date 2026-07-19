import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  customer_code?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  customer_name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 30)
  phone_number?: string | null;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  address?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  total_purchase_amount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  points_balance?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  first_purchase_at?: Date | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  last_purchase_at?: Date | null;
}
