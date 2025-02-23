import {
  IsInt,
  IsPositive,
  IsEnum,
  IsDate,
  IsBoolean,
  IsString,
} from 'class-validator';
import { SubscriptionType } from '@prisma/client';

export class CreateSubscriptionDto {
  @IsInt()
  @IsPositive()
  projectId: number;

  @IsEnum(SubscriptionType)
  type: SubscriptionType;

  @IsPositive({ message: 'Le prix doit être un montant positif' })
  price: number;

  @IsString()
  stripeSubscriptionId?: string;

  @IsDate()
  startDate: Date;

  @IsDate()
  endDate: Date;

  @IsBoolean()
  isActive: boolean;
}
