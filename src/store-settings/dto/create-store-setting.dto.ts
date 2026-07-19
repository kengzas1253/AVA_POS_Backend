import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateStoreSettingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  store_name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  owner_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  tax_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  branch_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  branch_no?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string;

  @IsOptional()
  @IsString()
  logo_url?: string;

  @IsOptional()
  @IsString()
  receipt_image_url?: string;

  @IsOptional()
  @IsString()
  receipt_header?: string;

  @IsOptional()
  @IsString()
  receipt_footer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  receipt_paper_size?: string;

  @IsOptional()
  @IsBoolean()
  show_logo?: boolean;

  @IsOptional()
  @IsBoolean()
  show_receipt_image?: boolean;

  @IsOptional()
  @IsBoolean()
  auto_print_receipt?: boolean;

  @IsOptional()
  @IsBoolean()
  show_promptpay_qr?: boolean;

  @IsOptional()
  @IsBoolean()
  vat_enabled?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  vat_rate?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;

  @IsOptional()
  @IsBoolean()
  allow_negative_stock?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  default_customer_name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  default_payment_account_id?: number;
}
