import { Controller, Post, Body, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { StripeService } from './stripe.service';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('create-payment-session')
  async createPaymentSession(
    @Body() body: { projectId: string; amount: number },
  ) {
    return this.stripeService.createPaymentSession(body.projectId, body.amount);
  }

  @Post('create-subscription-session')
  async createSubscriptionSession(
    @Body() body: { projectId: string; plan: string },
  ) {
    return this.stripeService.createSubscriptionSession(
      body.projectId,
      body.plan,
    );
  }

  @Public()
  @Post('webhook')
  handleWebhook(@Req() req: Request, @Res() res: Response) {
    return this.stripeService.addPayment(req, res);
  }
}
