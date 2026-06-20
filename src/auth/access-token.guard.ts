import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

type AccessTokenPayload = {
  sub: string;
  username: string;
  role: string;
  type: 'access';
};

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<
      Request & { user?: AccessTokenPayload }
    >();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Access token is required');
    }

    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(
        token,
        { secret: this.getAccessTokenSecret() },
      );

      if (payload.type !== 'access' || !payload.sub) {
        throw new UnauthorizedException('Invalid access token');
      }

      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  private extractBearerToken(request: Request) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type?.toLowerCase() === 'bearer' ? token : undefined;
  }

  private getAccessTokenSecret() {
    return this.configService.get<string>(
      'ACCESS_TOKEN_SECRET',
      this.configService.get<string>('JWT_SECRET', 'ava-pos-secret'),
    );
  }
}
