import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getApiStatus() {
    return {
      status: 'ok',
      message: 'AVA API connected successfully',
      port: 2021,
      timestamp: new Date().toISOString(),
    };
  }
}
