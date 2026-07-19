import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BarcodePrintSettingsModule } from './barcode-print-settings/barcode-print-settings.module';
import { CategoriesModule } from './categories/categories.module';
import { CustomersModule } from './customers/customers.module';
import { FavoritesModule } from './favorites/favorites.module';
import { HeldBillsModule } from './held-bills/held-bills.module';
import { ImagesModule } from './images/images.module';
import { PaymentAccountsModule } from './payment-accounts/payment-accounts.module';
import { PosModule } from './pos/pos.module';
import { PosDevicesModule } from './pos-devices/pos-devices.module';
import { PosMachineSettingsModule } from './pos-machine-settings/pos-machine-settings.module';
import { ProductsModule } from './products/products.module';
import { ProductUnitsModule } from './product-units/product-units.module';
import { PromotionsModule } from './promotions/promotions.module';
import { StockModule } from './stocks/stock.module';
import { StoreSettingsModule } from './store-settings/store-settings.module';
import { UnitsModule } from './units/units.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: Number(configService.get<string>('DB_PORT', '5432')),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', ''),
        database: configService.get<string>('DB_DATABASE', 'AVA_POS_DB'),
        extra: {
          options: '-c timezone=Asia/Bangkok',
        },
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    AuthModule,
    BarcodePrintSettingsModule,
    CategoriesModule,
    CustomersModule,
    FavoritesModule,
    HeldBillsModule,
    ImagesModule,
    PaymentAccountsModule,
    PosModule,
    PosDevicesModule,
    PosMachineSettingsModule,
    ProductsModule,
    ProductUnitsModule,
    PromotionsModule,
    StockModule,
    StoreSettingsModule,
    UnitsModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
