import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CreateFavoriteItemDto } from './dto/create-favorite-item.dto';
import { UpdateFavoriteItemDto } from './dto/update-favorite-item.dto';
import { FavoriteItemsService } from './favorite-items.service';

@Controller('favorite-items')
@UseGuards(AccessTokenGuard)
export class FavoriteItemsController {
  constructor(private readonly service: FavoriteItemsService) {}

  @Post()
  create(@Body() dto: CreateFavoriteItemDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @Query('favorite_group_id', new ParseIntPipe({ optional: true }))
    favoriteGroupId?: number,
  ) {
    return this.service.findAll(favoriteGroupId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id.toString());
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFavoriteItemDto,
  ) {
    return this.service.update(id.toString(), dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id.toString());
  }
}
