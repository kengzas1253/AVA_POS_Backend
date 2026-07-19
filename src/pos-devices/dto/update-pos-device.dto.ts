import { IsIP, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdatePosDeviceDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  device_name?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  hostname?: string;

  @IsIP()
  @IsOptional()
  ip_address?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  os_platform?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  os_release?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  app_version?: string;

  @IsString()
  @IsOptional()
  printer_name?: string;

  @IsString()
  @IsOptional()
  printer_type?: string;

  @IsString()
  @IsOptional()
  printer_slip?: string;

  @IsString()
  @IsOptional()
  paper_slip_size?: string;
}
