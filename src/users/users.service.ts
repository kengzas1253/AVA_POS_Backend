import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHmac } from 'crypto';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async findAll() {
    const users = await this.userRepository.find({
      order: { created_at: 'ASC' },
    });

    return users.map((user) => this.toSafeUser(user));
  }

  async update(userId: string, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.username !== undefined) {
      user.username = updateUserDto.username;
    }

    if (updateUserDto.password !== undefined) {
      user.password_hash = await bcrypt.hash(updateUserDto.password, 10);
    }

    if (updateUserDto.full_name !== undefined) {
      user.full_name = updateUserDto.full_name;
    }

    if (updateUserDto.phone_number !== undefined) {
      user.phone_number = updateUserDto.phone_number;
    }

    if (updateUserDto.role !== undefined) {
      user.role = updateUserDto.role;
    }

    if (updateUserDto.pin_code !== undefined) {
      user.pin_code = await bcrypt.hash(updateUserDto.pin_code, 10);
      user.pin_lookup_hash = this.createPinLookupHash(updateUserDto.pin_code);
    }

    if (updateUserDto.is_active !== undefined) {
      user.is_active = updateUserDto.is_active;
    }

    try {
      const savedUser = await this.userRepository.save(user);

      return {
        status: 'ok',
        message: 'User updated successfully',
        data: this.toSafeUser(savedUser),
      };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async remove(userId: string) {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.remove(user);

    return {
      status: 'ok',
      message: 'User deleted successfully',
      data: {
        user_id: userId,
      },
    };
  }

  private handleDatabaseError(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as {
        code?: string;
        constraint?: string;
      };

      if (driverError.code === '23505') {
        throw new ConflictException(
          driverError.constraint?.includes('pin')
            ? 'PIN already exists'
            : 'Username already exists',
        );
      }
    }

    throw error;
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

  private createPinLookupHash(pinCode: string) {
    const secret = this.configService.get<string>(
      'JWT_SECRET',
      'ava-pos-secret',
    );

    return createHmac('sha256', secret).update(pinCode).digest('hex');
  }
}
