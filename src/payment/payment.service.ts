import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreatePaymentDto } from 'src/dto/create-payment.dto';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   *  Crée un paiement et l'enregistre en base de données
   */
  async createPayment(data: CreatePaymentDto) {
    try {
      const payment = await this.prisma.payment.create({ data });

      console.log(
        ` Paiement enregistré avec succès pour le projet ${data.projectId}`,
      );
      return payment;
    } catch (error) {
      console.error(' Erreur lors de l’enregistrement du paiement:', error);
      throw new InternalServerErrorException(
        'Erreur interne lors de la création du paiement',
      );
    }
  }
}
