import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { Repository } from 'typeorm';
import { LoginWithPasswordDto } from './dto/login-with-password.dto';
import { LoginWithPinDto } from './dto/login-with-pin.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { User } from './entities/user.entity';

type RefreshTokenPayload = {
  sub: string;
  type: 'refresh';
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    const existingUser = await this.userRepository.findOne({
      where: { username: registerUserDto.username },
    });

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const pinLookupHash = this.createPinLookupHash(registerUserDto.pin_code);
    const existingPinUser = await this.findUserByPin(registerUserDto.pin_code);

    if (existingPinUser) {
      throw new ConflictException('PIN already exists');
    }

    const user = this.userRepository.create({
      username: registerUserDto.username,
      password_hash: await bcrypt.hash(registerUserDto.password, 10),
      full_name: registerUserDto.full_name,
      phone_number: registerUserDto.phone_number,
      role: registerUserDto.role ?? 'cashier',
      pin_code: await bcrypt.hash(registerUserDto.pin_code, 10),
      pin_lookup_hash: pinLookupHash,
      is_active: registerUserDto.is_active ?? true,
    });

    const savedUser = await this.userRepository.save(user);

    return {
      status: 'ok',
      message: 'User registered successfully',
      data: this.toSafeUser(savedUser),
    };
  }

  async loginWithPassword(loginWithPasswordDto: LoginWithPasswordDto) {
    const user = await this.findActiveUser(loginWithPasswordDto.username);
    const isValid = await this.verifySecret(
      loginWithPasswordDto.password,
      user.password_hash,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    if (!this.isBcryptHash(user.password_hash)) {
      user.password_hash = await bcrypt.hash(loginWithPasswordDto.password, 10);
    }

    return this.finishLogin(user);
  }

  async loginWithPin(loginWithPinDto: LoginWithPinDto) {
    const user = await this.findUserByPin(loginWithPinDto.pin_code);

    if (!user || !user.is_active) {
      throw new UnauthorizedException('Invalid PIN or inactive user');
    }

    if (user.pin_code && !this.isBcryptHash(user.pin_code)) {
      user.pin_code = await bcrypt.hash(loginWithPinDto.pin_code, 10);
    }

    user.pin_lookup_hash = this.createPinLookupHash(loginWithPinDto.pin_code);

    return this.finishLogin(user);
  }

  async refreshToken(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);
    const user = await this.findUserWithRefreshToken(payload.sub);

    if (
      !user ||
      !user.is_active ||
      !user.refresh_token_hash ||
      !this.isMatchingTokenHash(refreshToken, user.refresh_token_hash)
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.createTokenPair(user);
    user.refresh_token_hash = this.hashToken(tokens.refresh_token);
    await this.userRepository.save(user);

    return {
      status: 'ok',
      message: 'Token refreshed successfully',
      ...tokens,
    };
  }

  async logout(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);
    const user = await this.findUserWithRefreshToken(payload.sub);

    if (
      !user ||
      !user.refresh_token_hash ||
      !this.isMatchingTokenHash(refreshToken, user.refresh_token_hash)
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    user.refresh_token_hash = null;
    await this.userRepository.save(user);

    return {
      status: 'ok',
      message: 'Logout successfully',
    };
  }

  private async findUserByPin(pinCode: string) {
    const pinLookupHash = this.createPinLookupHash(pinCode);
    const userByLookup = await this.userRepository.findOne({
      where: { pin_lookup_hash: pinLookupHash },
    });

    if (userByLookup) {
      return userByLookup;
    }

    const usersWithPin = await this.userRepository.find({
      where: { is_active: true },
    });

    for (const user of usersWithPin) {
      if (user.pin_code && (await this.verifySecret(pinCode, user.pin_code))) {
        return user;
      }
    }

    return null;
  }

  private async findActiveUser(username: string) {
    const user = await this.userRepository.findOne({
      where: { username },
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('Invalid username or inactive user');
    }

    return user;
  }

  private async verifySecret(plainText: string, storedValue: string) {
    if (this.isBcryptHash(storedValue)) {
      return bcrypt.compare(plainText, storedValue);
    }

    return plainText === storedValue;
  }

  private async finishLogin(user: User) {
    user.last_login_at = new Date();
    const tokens = await this.createTokenPair(user);
    user.refresh_token_hash = this.hashToken(tokens.refresh_token);
    const savedUser = await this.userRepository.save(user);

    return {
      status: 'ok',
      message: 'Login successfully',
      token: tokens.access_token,
      ...tokens,
      data: this.toSafeUser(savedUser),
    };
  }

  private async createTokenPair(user: User) {
    const payload = {
      sub: user.user_id,
      username: user.username,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { ...payload, type: 'access' },
        {
          secret: this.getAccessTokenSecret(),
          expiresIn: this.configService.get<string>(
            'ACCESS_TOKEN_EXPIRES_IN',
            '15m',
          ) as never,
        },
      ),
      this.jwtService.signAsync(
        { sub: user.user_id, type: 'refresh', jti: randomUUID() },
        {
          secret: this.getRefreshTokenSecret(),
          expiresIn: this.configService.get<string>(
            'REFRESH_TOKEN_EXPIRES_IN',
            '30d',
          ) as never,
        },
      ),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 15 * 60,
      refresh_expires_in: 30 * 24 * 60 * 60,
    };
  }

  private async verifyRefreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        { secret: this.getRefreshTokenSecret() },
      );

      if (payload.type !== 'refresh' || !payload.sub) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private findUserWithRefreshToken(userId: string) {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.refresh_token_hash')
      .where('user.user_id = :userId', { userId })
      .getOne();
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private isMatchingTokenHash(token: string, storedHash: string) {
    const tokenHash = Buffer.from(this.hashToken(token), 'hex');
    const expectedHash = Buffer.from(storedHash, 'hex');

    return (
      tokenHash.length === expectedHash.length &&
      timingSafeEqual(tokenHash, expectedHash)
    );
  }

  private getAccessTokenSecret() {
    return this.configService.get<string>(
      'ACCESS_TOKEN_SECRET',
      this.configService.get<string>('JWT_SECRET', 'ava-pos-secret'),
    );
  }

  private getRefreshTokenSecret() {
    return this.configService.get<string>(
      'REFRESH_TOKEN_SECRET',
      this.configService.get<string>('JWT_SECRET', 'ava-pos-secret'),
    );
  }

  private toSafeUser(user: User) {
    return {
      user_id: user.user_id,
      username: user.username,
      full_name: user.full_name,
      phone_number: user.phone_number,
      role: user.role,
      is_active: user.is_active,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  private isBcryptHash(value: string) {
    return value.startsWith('$2a$') || value.startsWith('$2b$') || value.startsWith('$2y$');
  }

  private createPinLookupHash(pinCode: string) {
    const secret = this.configService.get<string>('JWT_SECRET', 'ava-pos-secret');

    return createHmac('sha256', secret).update(pinCode).digest('hex');
  }
}
