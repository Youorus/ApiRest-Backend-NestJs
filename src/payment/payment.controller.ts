import { Controller, Get } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserDto } from 'src/dto/create-user.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Endpoint pour récupérer tous les paiements des projets de l'utilisateur connecté
   */
  @Get('me')
  async getUserPayments(@CurrentUser() user: UserDto) {
    return this.paymentService.getUserPayments(user);
  }
}
