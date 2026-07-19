import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { PaymentAccountsService } from './payment-accounts.service';

@Controller('payment-accounts')
@UseGuards(AccessTokenGuard)
export class PaymentAccountsController {
  constructor(
    private readonly paymentAccountsService: PaymentAccountsService,
  ) {}

  @Get()
  findAll() {
    return this.paymentAccountsService.findAll();
  }

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.paymentAccountsService.create(body);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
  ) {
    return this.paymentAccountsService.update(id.toString(), body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.paymentAccountsService.remove(id.toString());
  }
}
