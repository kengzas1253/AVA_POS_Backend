import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CreateUnitGroupDto } from './dto/create-unit-group.dto';
import { UpdateUnitGroupDto } from './dto/update-unit-group.dto';
import { UnitGroupsService } from './unit-groups.service';

@Controller('unit-groups')
@UseGuards(AccessTokenGuard)
export class UnitGroupsController {
  constructor(private readonly unitGroupsService: UnitGroupsService) {}

  @Get('with-units')
  findAllWithUnits() {
    return this.unitGroupsService.findAllWithUnits();
  }

  @Get()
  findAll() {
    return this.unitGroupsService.findAll();
  }

  @Post()
  create(@Body() createUnitGroupDto: CreateUnitGroupDto) {
    return this.unitGroupsService.create(createUnitGroupDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUnitGroupDto: UpdateUnitGroupDto,
  ) {
    return this.unitGroupsService.update(id.toString(), updateUnitGroupDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.unitGroupsService.remove(id.toString());
  }
}
