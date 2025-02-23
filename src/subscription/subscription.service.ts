import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSubscriptionDto } from 'src/dto/create-subscription.dto';

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 📌 Crée un abonnement en base de données
   */
  async createSubscription(data: CreateSubscriptionDto) {
    try {
      const subscription = await this.prisma.subscription.create({
        data,
      });

      console.log(
        `✅ Abonnement créé avec succès pour le projet ${data.projectId}`,
      );
      return subscription;
    } catch (error) {
      console.error('❌ Erreur lors de la création de l’abonnement:', error);
      throw new InternalServerErrorException(
        'Erreur interne lors de la création de l’abonnement',
      );
    }
  }

  /**
   *  Récupère une subscription via son `ubscriptionId`
   */
  async getSubscriptionById(id: number) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { subscriptionId: id },
    });

    if (!subscription) {
      throw new NotFoundException(` Abonnement introuvable pour ${id}`);
    }

    return subscription;
  }

  /**
   *  Met à jour la date de fin d'une subscription (renouvellement)
   */
  async updateSubscriptionEndDate(
    subscriptionId: number,
    currentEndDate: Date,
  ) {
    try {
      const newEndDate = new Date(
        new Date(currentEndDate).setMonth(
          new Date(currentEndDate).getMonth() + 1,
        ),
      );

      await this.prisma.subscription.update({
        where: { subscriptionId },
        data: { endDate: newEndDate },
      });

      console.log(
        `Abonnement prolongé jusqu'au ${newEndDate.toISOString()} pour l'ID ${subscriptionId}`,
      );
    } catch (error) {
      console.error(' Erreur lors de la mise à jour de l’abonnement:', error);
      throw new InternalServerErrorException(
        'Erreur lors du renouvellement de l’abonnement',
      );
    }
  }

  /**
   * ✅ Active une souscription (premier paiement validé)
   */
  async activateSubscription(subscriptionId: number) {
    try {
      await this.prisma.subscription.update({
        where: { subscriptionId },
        data: { isActive: true },
      });

      console.log(
        `✅ Abonnement activé avec succès pour l'ID ${subscriptionId}`,
      );
    } catch (error) {
      console.error('❌ Erreur lors de l’activation de l’abonnement:', error);
      throw new InternalServerErrorException(
        "Erreur lors de l'activation de l’abonnement",
      );
    }
  }

  /**
   * 🔄 Renouvelle un abonnement en mettant à jour sa date de fin
   */
  async renewSubscription(subscriptionId: number, newEndDate: Date) {
    try {
      await this.prisma.subscription.update({
        where: { subscriptionId },
        data: { endDate: newEndDate, isActive: true },
      });

      console.log(
        `🔄 Abonnement renouvelé avec succès pour l'ID ${subscriptionId} jusqu'au ${newEndDate.toISOString()}`,
      );
    } catch (error) {
      console.error('❌ Erreur lors du renouvellement de l’abonnement:', error);
      throw new InternalServerErrorException(
        'Erreur lors du renouvellement de l’abonnement',
      );
    }
  }

  async getSubscriptionByStripeId(stripeSubscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId },
    });

    if (!subscription)
      throw new NotFoundException(
        `Abonnement non trouvé pour Stripe ID: ${stripeSubscriptionId}`,
      );

    return subscription;
  }
}
