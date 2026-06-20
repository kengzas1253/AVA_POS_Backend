import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginWithPasswordDto } from './dto/login-with-password.dto';
import { LoginWithPinDto } from './dto/login-with-pin.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterUserDto } from './dto/register-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  @Post('login')
  loginWithPassword(@Body() loginWithPasswordDto: LoginWithPasswordDto) {
    return this.authService.loginWithPassword(loginWithPasswordDto);
  }

  @Post('login-pin')
  loginWithPin(@Body() loginWithPinDto: LoginWithPinDto) {
    return this.authService.loginWithPin(loginWithPinDto);
  }

  @Post('refresh')
  refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refresh_token);
  }

  @Post('logout')
  logout(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.logout(refreshTokenDto.refresh_token);
  }
}
