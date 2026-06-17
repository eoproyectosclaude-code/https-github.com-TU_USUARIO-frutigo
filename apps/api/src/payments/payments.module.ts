import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PAYMENT_GATEWAYS } from './gateway.interface';
import { StripeGateway } from './gateways/stripe.gateway';
import { YappyGateway } from './gateways/yappy.gateway';
import { VisaGateway } from './gateways/visa.gateway';
import { CryptoGateway } from './gateways/crypto.gateway';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [LoyaltyModule, NotificationsModule, AdminModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    StripeGateway,
    YappyGateway,
    VisaGateway,
    CryptoGateway,
    {
      provide: PAYMENT_GATEWAYS,
      useFactory: (stripe: StripeGateway, yappy: YappyGateway, visa: VisaGateway, crypto: CryptoGateway) => [stripe, yappy, visa, crypto],
      inject: [StripeGateway, YappyGateway, VisaGateway, CryptoGateway],
    },
  ],
})
export class PaymentsModule {}
