import { IsIP, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class RegisterPosDeviceDto {
  @IsString()
  @IsNotEmpty()
  device_name: string;

  @IsUUID()
  machine_id: string;

  @IsString()
  @IsNotEmpty()
  hostname: string;

  @IsIP()
  ip_address: string;

  @IsString()
  @IsNotEmpty()
  os_platform: string;

  @IsString()
  @IsNotEmpty()
  os_release: string;

  @IsString()
  @IsNotEmpty()
  app_version: string;

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
