import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Product } from '../products/entities/product.entity';
import { FavoriteGroup } from './entities/favorite-group.entity';
import { FavoriteItem } from './entities/favorite-item.entity';
import { FavoriteGroupsController } from './favorite-groups.controller';
import { FavoriteGroupsService } from './favorite-groups.service';
import { FavoriteItemsController } from './favorite-items.controller';
import { FavoriteItemsService } from './favorite-items.service';
import { FavoritesSchemaService } from './favorites-schema.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FavoriteGroup, FavoriteItem, Product]),
    AuthModule,
  ],
  controllers: [FavoriteGroupsController, FavoriteItemsController],
  providers: [
    FavoriteGroupsService,
    FavoriteItemsService,
    FavoritesSchemaService,
  ],
})
export class FavoritesModule {}
