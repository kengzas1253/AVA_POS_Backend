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
import { CreateFavoriteGroupDto } from './dto/create-favorite-group.dto';
import { UpdateFavoriteGroupDto } from './dto/update-favorite-group.dto';
import { FavoriteGroupsService } from './favorite-groups.service';

@Controller('favorite-groups')
@UseGuards(AccessTokenGuard)
export class FavoriteGroupsController {
  constructor(private readonly service: FavoriteGroupsService) {}

  @Post()
  create(@Body() dto: CreateFavoriteGroupDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id.toString());
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFavoriteGroupDto,
  ) {
    return this.service.update(id.toString(), dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id.toString());
  }
}
