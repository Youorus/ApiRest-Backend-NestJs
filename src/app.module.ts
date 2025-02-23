import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { ProjectModule } from './project/project.module';
import { AdminModule } from './admin/admin.module';
import { ClientModule } from './client/client.module';
import { AvailabilityModule } from './availability/availability.module';
import { AppointmentModule } from './appointment/appointment.module';
import { UnavailabilityModule } from './unavailability/unavailability.module';
import { PaymentModule } from './payment/payment.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { StripeModule } from './stripe/stripe.module';
import { InvoiceModule } from './invoice/invoice.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    UserModule,
    AuthModule,
    PrismaModule,
    ProjectModule,
    AdminModule,
    ClientModule,
    AvailabilityModule,
    AppointmentModule,
    UnavailabilityModule,
    PaymentModule,
    SubscriptionModule,
    StripeModule,
    InvoiceModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
