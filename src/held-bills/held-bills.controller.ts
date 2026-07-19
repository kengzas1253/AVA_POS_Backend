import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CreateHeldBillDto } from './dto/create-held-bill.dto';
import { UpdateHeldBillDto } from './dto/update-held-bill.dto';
import { UpdateHeldBillItemsDto } from './dto/update-held-bill-items.dto';
import { HeldBillsService } from './held-bills.service';

@Controller('held-bills')
@UseGuards(AccessTokenGuard)
export class HeldBillsController {
  constructor(private readonly heldBillsService: HeldBillsService) {}

  // Create a new held bill.
  @Post()
  create(@Body() createHeldBillDto: CreateHeldBillDto) {
    return this.heldBillsService.create(createHeldBillDto);
  }

  // List active held bills.
  @Get()
  findAllHeld() {
    return this.heldBillsService.findAllHeld();
  }

  // Get a held bill by id with items.
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.heldBillsService.findOne(id.toString());
  }

  // Restore a held bill back to the frontend cart.
  @Post(':id/restore')
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.heldBillsService.restore(id.toString());
  }

  // Update only the held bill name.
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHeldBillDto: UpdateHeldBillDto,
  ) {
    return this.heldBillsService.update(id.toString(), updateHeldBillDto);
  }

  // Replace all items in a held bill.
  @Put(':id/items')
  updateItems(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHeldBillItemsDto: UpdateHeldBillItemsDto,
  ) {
    return this.heldBillsService.updateItems(
      id.toString(),
      updateHeldBillItemsDto,
    );
  }

  // Cancel a held bill without deleting data.
  @Patch(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.heldBillsService.cancel(id.toString());
  }

  // Delete a held bill and its items.
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.heldBillsService.remove(id.toString());
  }
}
