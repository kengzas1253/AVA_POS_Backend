import { IsNotEmpty, IsString } from 'class-validator';

export class LoginWithPinDto {
  @IsString()
  @IsNotEmpty()
  pin_code: string;
}
