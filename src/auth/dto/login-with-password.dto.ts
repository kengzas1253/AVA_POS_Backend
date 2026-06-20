import { IsNotEmpty, IsString } from 'class-validator';

export class LoginWithPasswordDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
