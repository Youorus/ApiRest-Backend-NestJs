import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { Public } from 'src/auth/decorators/public.decorator';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-payment-session')
  async createPaymentSession(
    @Body() body: { projectId: number; amount: number },
  ) {
    return this.paymentService.createPaymentSession(
      body.projectId,
      body.amount,
    );
  }

  @Public()
  @Post('webhook')
  handleWebhook(@Req() req: Request, @Res() res: Response) {
    return this.paymentService.addPayment(req, res);
  }
}
