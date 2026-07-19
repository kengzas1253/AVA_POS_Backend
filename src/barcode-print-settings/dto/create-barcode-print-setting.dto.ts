import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBarcodePrintSettingDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  device_id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  machine_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  printer_name?: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  paper_size: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  barcode_format: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  items_per_row?: number;

  @IsOptional()
  @IsBoolean()
  show_product_name?: boolean;

  @IsOptional()
  @IsBoolean()
  show_price?: boolean;

  @IsOptional()
  @IsBoolean()
  show_barcode_text?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(72)
  font_size?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  copies?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999.99)
  label_margin?: number;
}
