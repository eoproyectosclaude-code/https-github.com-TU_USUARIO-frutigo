import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { CacheModule } from './cache/cache.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { ImagesModule } from './images/images.module';
import { AdminModule } from './admin/admin.module';
import { ProvisioningModule } from './provisioning/provisioning.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { RealtimeModule } from './realtime/realtime.module';
import { NotificationsModule } from './notifications/notifications.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { MailModule } from './mail/mail.module';
import { HealthController } from './health.controller';
import { LoggingInterceptor } from './common/logging.interceptor';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    CacheModule,
    AuthModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
    SuppliersModule,
    ImagesModule,
    AdminModule,
    ProvisioningModule,
    DeliveriesModule,
    RealtimeModule,
    NotificationsModule,
    LoyaltyModule,
    MailModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
