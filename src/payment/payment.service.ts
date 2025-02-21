import {
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { PaymentStatus, SubscriptionType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PaymentService {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    if (!stripeSecretKey) {
      throw new InternalServerErrorException(
        'STRIPE_SECRET_KEY is not set in environment variables',
      );
    }

    if (!webhookSecret) {
      throw new InternalServerErrorException(
        'STRIPE_WEBHOOK_SECRET is not set in environment variables',
      );
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-01-27.acacia', // ✅ Utiliser la dernière version stable de Stripe
    });

    this.webhookSecret = webhookSecret;
  }

  /**
   * 🔥 Crée une session de paiement Stripe
   */
  async createPaymentSession(projectId: number, amount: number) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        success_url: 'http://localhost:3000/success',
        cancel_url: 'http://localhost:3000/cancel',
        metadata: { projectId: projectId.toString() }, // ✅ Stocke l'ID du projet pour le Webhook
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: { name: `Paiement pour le projet #${projectId}` },
              unit_amount: amount * 100, // Montant en centimes
            },
            quantity: 1,
          },
        ],
      });

      return { url: session.url };
    } catch (error) {
      console.error('🚨 Erreur Stripe :', error);
      throw new Error('Impossible de créer une session de paiement');
    }
  }

  async createSubscriptionSession(
    userId: string,
    projectId: number,
    plan: string,
  ) {
    try {
      const price = this.getSubscriptionPrice(plan); // ✅ Récupérer le prix

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        success_url: `http://localhost:3000/success`,
        cancel_url: `http://localhost:3000/cancel`,
        metadata: { userId, projectId, plan }, // ✅ Stocker les infos pour le webhook
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Abonnement ${plan}`,
                description: `Abonnement ${plan} pour le projet ${projectId}`,
              },
              recurring: { interval: 'month' },
              unit_amount: price, // ✅ Utilisation du prix dynamique
            },
            quantity: 1,
          },
        ],
      });

      return { url: session.url };
    } catch (error) {
      console.error('🚨 Erreur Stripe :', error);
      throw new Error('Impossible de créer une session d’abonnement');
    }
  }

  /**
   * Webhook Stripe pour gérer les paiements
   */
  async addPayment(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      console.error('❌ Signature Stripe absente');
      return res
        .status(HttpStatus.BAD_REQUEST)
        .send('Signature Stripe absente');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        req.body,
        sig,
        this.webhookSecret,
      );
    } catch (err: any) {
      console.error('🚨 Erreur Webhook Stripe:', err);
      return res.status(HttpStatus.BAD_REQUEST).send(`Webhook Error: ${err}`);
    }

    console.log('✅ Webhook Stripe reçu :', event);

    // ✅ Vérifier si c'est un paiement unique ou un abonnement
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('✅ Paiement confirmé :', session);

      const projectId = session.metadata?.projectId;
      const plan = session.metadata?.plan; // Si c'est un abonnement, ce champ existe

      if (!projectId) {
        console.error('❌ Aucun projectId trouvé dans la session Stripe');
        return res
          .status(HttpStatus.BAD_REQUEST)
          .send('Aucun projectId trouvé');
      }

      try {
        if (plan) {
          // 🔥 Création de la subscription uniquement lors du 1er paiement
          await this.prisma.subscription.create({
            data: {
              projectId: parseInt(projectId),
              type: plan as SubscriptionType,
              price: (session.amount_total ?? 0) / 100,
              startDate: new Date(),
              endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), // 🔥 Ajoute 1 mois
              isActive: true,
            },
          });

          console.log(`🎉 Abonnement activé pour le projet ${projectId}`);
        }

        // 🔥 Création du paiement (1ère fois)
        await this.prisma.payment.create({
          data: {
            projectId: parseInt(projectId),
            amount: (session.amount_total ?? 0) / 100, // Convertir centimes en euros
            currency: session.currency ?? 'eur',
            status: PaymentStatus.COMPLETED,
            stripePaymentId: session.payment_intent as string,
            stripeSessionId: session.id,
            paymentMethod: session.payment_method_types?.[0] || null,
            paymentReceiptUrl: session.receipt_url || null,
          },
        });

        console.log(
          `💰 Paiement enregistré pour le projet ${projectId} : ${session.amount_total! / 100} €`,
        );
      } catch (dbError) {
        console.error(
          '🚨 Erreur lors de l’enregistrement du paiement:',
          dbError,
        );
      }
    }

    // ✅ Gestion du renouvellement automatique d'un abonnement
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;

      if (!subscriptionId) {
        console.error('❌ Aucun subscriptionId trouvé');
        return res
          .status(HttpStatus.BAD_REQUEST)
          .send('Aucun subscriptionId trouvé');
      }

      try {
        // 🔥 Récupérer l'abonnement lié
        const subscription = await this.prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subscriptionId as string },
        });

        if (!subscription) {
          console.error(`❌ Abonnement introuvable pour ${subscriptionId}`);
          return res
            .status(HttpStatus.BAD_REQUEST)
            .send('Abonnement introuvable');
        }

        // 🔥 Mettre à jour la date de fin pour prolonger l'abonnement d’un mois
        await this.prisma.subscription.update({
          where: { subscriptionId: subscription.subscriptionId },
          data: {
            endDate: new Date(
              new Date(subscription.endDate!).setMonth(
                new Date(subscription.endDate!).getMonth() + 1,
              ),
            ),
          },
        });

        console.log(`📆 Abonnement prolongé pour ${subscriptionId}`);

        // 🔥 Ajouter un nouveau paiement pour ce renouvellement
        await this.prisma.payment.create({
          data: {
            projectId: subscription.projectId,
            amount: (invoice.amount_paid ?? 0) / 100, // Convertir centimes en euros
            currency: invoice.currency ?? 'eur',
            status: PaymentStatus.COMPLETED,
            stripePaymentId: invoice.payment_intent as string,
            stripeSessionId: invoice.id,
          },
        });

        console.log(
          `💰 Paiement de renouvellement enregistré pour ${subscription.projectId} : ${invoice.amount_paid! / 100} €`,
        );
      } catch (dbError) {
        console.error(
          '🚨 Erreur lors du renouvellement de l’abonnement:',
          dbError,
        );
      }
    }

    return res.status(HttpStatus.OK).send();
  }

  /**
   * 🔥 Définit le prix d'un abonnement en fonction du type
   */
  private getSubscriptionPrice(plan: string): number {
    const prices: Record<string, number> = {
      BASIC: 2900, // 29.00 EUR
      PREMIUM: 4900, // 49.00 EUR
      ENTERPRISE: 9900, // 99.00 EUR
    };

    return prices[plan] ?? 4900; // Valeur par défaut: PREMIUM
  }
}
