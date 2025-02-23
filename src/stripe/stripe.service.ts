import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus, SubscriptionType } from '@prisma/client';
import { Request, Response } from 'express';
import { InvoiceService } from 'src/invoice/invoice.service';
import { PaymentService } from 'src/payment/payment.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ServiceTypeLabels } from 'src/project/enum/service-type.enum';
import { ProjectService } from 'src/project/project.service';
import { SubscriptionService } from 'src/subscription/subscription.service';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private webhookSecret: string;

  private readonly REDIRECT_URLS = {
    success: 'http://localhost:3000/success',
    cancel: 'http://localhost:3000/cancel',
  };

  private readonly PRICES: Record<string, number> = {
    BASIC: 2900,
    PREMIUM: 4900,
    ENTERPRISE: 9900,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
    private readonly configService: ConfigService,
    private readonly subscriptionService: SubscriptionService,
    private readonly invoiceService: InvoiceService,
    private readonly projectService: ProjectService,
  ) {
    this.initializeStripe();
  }

  private initializeStripe() {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    if (!stripeSecretKey || !webhookSecret) {
      throw new InternalServerErrorException(
        'Les clés Stripe ne sont pas configurées correctement',
      );
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-01-27.acacia',
    });
    this.webhookSecret = webhookSecret;
  }

  private handleError(message: string, error: any) {
    console.error(`🚨 ${message}:`, error);
    throw new InternalServerErrorException(message);
  }

  private async createStripeSession(
    mode: 'payment' | 'subscription',
    metadata: Record<string, any>,
    lineItems: Stripe.Checkout.SessionCreateParams.LineItem[],
  ) {
    try {
      return await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode,
        success_url: this.REDIRECT_URLS.success,
        cancel_url: this.REDIRECT_URLS.cancel,
        metadata,
        line_items: lineItems,
      });
    } catch (error) {
      this.handleError(
        `Impossible de créer une session Stripe (${mode})`,
        error,
      );
    }
  }

  async createPaymentSession(projectId: string, amount: number) {
    if (!amount || amount <= 0)
      throw new BadRequestException('Le montant doit être positif.');

    const project = await this.projectService.findProjectById(projectId);
    if (!project)
      throw new NotFoundException(`Projet avec ID ${projectId} non trouvé.`);

    const serviceName = ServiceTypeLabels[project.service] ?? project.service;

    const lineItems = [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Paiement pour le Service ${serviceName} du projet ${project.title}`,
          },
          unit_amount: amount * 100,
        },
        quantity: 1,
      },
    ];

    const metadata = {
      projectId,
      projectTitle: project.title,
      serviceName,
      amount: amount.toString(),
      currency: 'EUR',
    };

    const session = await this.createStripeSession(
      'payment',
      metadata,
      lineItems,
    );
    return { url: session?.url };
  }

  async createSubscriptionSession(projectId: string, plan: string) {
    if (!this.PRICES[plan])
      throw new BadRequestException(`Le plan "${plan}" est invalide.`);

    const project = await this.projectService.findProjectById(projectId);
    if (!project)
      throw new NotFoundException(`Projet avec l'ID ${projectId} introuvable.`);

    const lineItems = [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Abonnement ${plan}`,
            description: `Accès au plan ${plan} pour "${project.title}"`,
          },
          recurring: { interval: 'month' as Stripe.Price.Recurring.Interval },
          unit_amount: this.PRICES[plan],
        },
        quantity: 1,
      },
    ];

    const metadata = {
      projectId,
      projectTitle: project.title,
      serviceName: `Abonnement ${plan}`,
      plan,
      amount: this.PRICES[plan].toString(),
      currency: 'EUR',
    };

    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        success_url: this.REDIRECT_URLS.success,
        cancel_url: this.REDIRECT_URLS.cancel,
        metadata, // Metadata pour la Checkout Session
        subscription_data: { metadata }, // ✅ Metadata transmises à l'abonnement Stripe
        line_items: lineItems,
      });

      return { url: session.url };
    } catch (error) {
      this.handleError(
        'Impossible de créer une session Stripe (subscription)',
        error,
      );
    }
  }

  private validateStripeWebhook(req: Request): Stripe.Event {
    const sig = req.headers['stripe-signature'];
    if (!sig) {
      throw new BadRequestException('❌ Signature Stripe absente');
    }

    try {
      return this.stripe.webhooks.constructEvent(
        req.body,
        sig,
        this.webhookSecret,
      );
    } catch (error) {
      console.error('🚨 Erreur Webhook Stripe:', error);
      throw new BadRequestException(
        '❌ Erreur lors de la validation du webhook',
      );
    }
  }

  async addPayment(req: Request, res: Response) {
    try {
      const event = this.validateStripeWebhook(req);
      console.log(`🚀 Événement Stripe reçu : ${event.type}`);

      switch (event.type) {
        case 'checkout.session.completed':
          console.log(
            '🔍 Metadata reçues (checkout.session.completed):',
            event.data.object.metadata,
          );
          await this.handlePaymentCompleted(event.data.object);
          break;

        case 'customer.subscription.created':
          console.log(
            '🔍 Metadata reçues (customer.subscription.created):',
            event.data.object.metadata,
          );
          await this.handleSubscriptionCreated(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          console.log(
            '🔍 Metadata reçues (invoice.payment_succeeded):',
            event.data.object.metadata,
          );
          await this.handleSubscriptionPaymentSucceeded(event.data.object);
          break;

        default:
          console.warn(`⚠️ Événement non géré : ${event.type}`);
      }

      return res.status(HttpStatus.OK).send();
    } catch (error) {
      console.error('❌ Erreur dans le webhook:', error);
      return res.status(HttpStatus.BAD_REQUEST).send();
    }
  }

  // 🔸 Gérer paiement unique (Checkout sans abonnement)
  private async handlePaymentCompleted(session: Stripe.Checkout.Session) {
    const { projectId } = session.metadata || {};
    if (!projectId)
      throw new InternalServerErrorException('Aucun projectId trouvé');

    const invoiceUrl = await this.invoiceService.generateInvoice(session);

    await this.paymentService.createPayment({
      projectId: parseInt(projectId),
      amount: (session.amount_total ?? 0) / 100,
      currency: session.currency ?? 'eur',
      status: PaymentStatus.COMPLETED,
      stripePaymentId: session.payment_intent as string,
      stripeSessionId: session.id,
      paymentMethod: session.payment_method_types?.[0] || null,
      paymentReceiptUrl: invoiceUrl,
    });

    console.log(`💰 Paiement unique enregistré pour le projet ${projectId}`);
  }

  // 🔸 Gérer création initiale de l'abonnement (sans attendre le paiement)
  async handleSubscriptionCreated(subscription: Stripe.Subscription) {
    const { projectId, plan } = subscription.metadata || {};

    if (!projectId || !plan)
      throw new InternalServerErrorException(
        'projectId ou plan manquant dans metadata',
      );

    await this.subscriptionService.createSubscription({
      projectId: parseInt(projectId),
      type: plan as SubscriptionType,
      price: subscription.items.data[0].price.unit_amount! / 100,
      startDate: new Date(subscription.current_period_start * 1000),
      endDate: new Date(subscription.current_period_end * 1000),
      isActive: subscription.status === 'active',
      stripeSubscriptionId: subscription.id, // ✅ sauvegarde ID Stripe
    });

    await this.projectService.updateProjectSubscriptionStatus(
      parseInt(projectId),
      true,
    );

    console.log(`🆕 Abonnement initial créé pour projet ${projectId}`);
  }

  // 🔸 Gérer paiement réussi (initial ou renouvellement d'abonnement)
  private async handleSubscriptionPaymentSucceeded(invoice: Stripe.Invoice) {
    const subscriptionStripeId = invoice.subscription as string;

    const subscription =
      await this.subscriptionService.getSubscriptionByStripeId(
        subscriptionStripeId,
      );
    if (!subscription)
      throw new NotFoundException(
        `Abonnement non trouvé : ${subscriptionStripeId}`,
      );

    const isFirstPayment = invoice.billing_reason === 'subscription_create';

    if (isFirstPayment) {
      await this.subscriptionService.activateSubscription(
        subscription.subscriptionId,
      );
    } else {
      await this.subscriptionService.renewSubscription(
        subscription.subscriptionId,
        new Date(invoice.lines.data[0].period.end * 1000),
      );
    }

    const invoiceUrl = await this.invoiceService.generateInvoice(invoice);

    await this.paymentService.createPayment({
      projectId: subscription.projectId,
      subscriptionId: subscription.subscriptionId,
      amount: (invoice.amount_paid ?? 0) / 100,
      currency: invoice.currency ?? 'eur',
      status: PaymentStatus.COMPLETED,
      stripeSessionId: invoice.id,
      stripePaymentId: invoice.payment_intent as string,
      paymentReceiptUrl: invoiceUrl,
    });

    console.log(
      `💰 Paiement enregistré (${isFirstPayment ? 'Initial' : 'Renouvellement'}) pour le projet ${subscription.projectId}`,
    );
  }
}
