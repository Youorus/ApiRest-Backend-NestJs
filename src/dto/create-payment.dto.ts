import {
  IsInt,
  IsPositive,
  IsString,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { PaymentStatus } from '@prisma/client';

export class CreatePaymentDto {
  @IsInt()
  @IsPositive()
  projectId: number;

  @IsPositive({ message: 'Le montant doit être un nombre positif' })
  amount: number;

  @IsString({ message: 'La devise doit être une chaîne de caractères' })
  currency: string;

  @IsEnum(PaymentStatus, { message: 'Le statut du paiement est invalide' })
  status: PaymentStatus;

  @IsInt()
  @IsPositive()
  subscriptionId?: number;

  @IsString({ message: 'L’identifiant du paiement Stripe est requis' })
  stripePaymentId: string;

  @IsString({ message: 'L’identifiant de la session Stripe est requis' })
  stripeSessionId: string;

  @IsOptional()
  @IsString({
    message: 'La méthode de paiement doit être une chaîne de caractères',
  })
  paymentMethod?: string | null;

  @IsOptional()
  @IsString({ message: 'L’URL du reçu doit être une chaîne de caractères' })
  paymentReceiptUrl?: string | null;
}
