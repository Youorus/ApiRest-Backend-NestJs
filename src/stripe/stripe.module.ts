import { Module } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { PaymentModule } from 'src/payment/payment.module';
import { SubscriptionModule } from 'src/subscription/subscription.module';
import { ConfigModule } from '@nestjs/config';
import { ProjectModule } from 'src/project/project.module';
import { InvoiceModule } from 'src/invoice/invoice.module';

@Module({
  imports: [
    PaymentModule,
    SubscriptionModule,
    ConfigModule,
    ProjectModule,
    InvoiceModule,
  ],
  controllers: [StripeController],
  providers: [StripeService],
})
export class StripeModule {}
