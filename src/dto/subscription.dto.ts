import { SubscriptionType } from '@prisma/client';
import {
  IsInt,
  IsPositive,
  IsEnum,
  IsDate,
  IsBoolean,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSubscriptionDto {
  @IsInt()
  @IsPositive()
  projectId: number;

  @IsEnum(SubscriptionType)
  type: SubscriptionType; // Mieux typé (SubscriptionType directement)

  @IsPositive()
  price: number;
  // Rendu optionnel pour correspondre au modèle
  @IsString()
  stripeSubscriptionId?: string;

  @IsDate()
  startDate: Date;

  @IsOptional()
  @IsDate()
  endDate?: Date; // Peut être null si l'abonnement est illimité

  @IsBoolean()
  isActive: boolean;
}
