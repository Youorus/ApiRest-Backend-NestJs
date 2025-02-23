import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs-extra';
import { join } from 'path';
import * as Handlebars from 'handlebars';
import Stripe from 'stripe';

@Injectable()
export class InvoiceService {
  private readonly invoiceFolder = join('invoicesFacture');

  constructor() {
    // ✅ Vérifie et crée le dossier des factures si nécessaire
    fs.ensureDirSync(this.invoiceFolder);
  }

  /**
   * ✅ Générer une facture PDF et retourner son URL
   */
  async generateInvoice(
    invoice: Stripe.Invoice | Stripe.Checkout.Session,
  ): Promise<string> {
    try {
      // ✅ Vérifier s'il s'agit d'une Invoice ou d'une Checkout Session
      const isInvoice = invoice.object === 'invoice';
      const paymentId = invoice.id;
      const fileName = `invoice_${paymentId}.pdf`;
      const filePath = join(this.invoiceFolder, fileName);

      console.log(`📝 Génération de la facture pour : ${paymentId}`);

      // ✅ Extraction des informations client
      let userName: string;
      let userEmail: string;

      if (isInvoice) {
        userName = 'Client Stripe'; // Stripe ne fournit pas toujours le nom du client pour les invoices
        userEmail =
          (invoice as Stripe.Invoice).customer_email || 'Non spécifié';
      } else {
        const customerDetails = (invoice as Stripe.Checkout.Session)
          .customer_details;
        userName = customerDetails?.name || 'Client inconnu';
        userEmail = customerDetails?.email || 'Non spécifié';
      }

      console.log(`👤 Client : ${userName} - ${userEmail}`);

      // ✅ Récupération du titre du projet et du service depuis les **métadonnées**
      const metadata = (invoice as Stripe.Checkout.Session).metadata || {};
      const projectTitle = metadata.projectTitle || 'Projet inconnu';
      const serviceName = metadata.serviceName || 'Service inconnu';

      console.log(`📌 Projet : ${projectTitle}, Service : ${serviceName}`);

      // ✅ Extraction du montant et de la devise
      const amount =
        ((invoice as Stripe.Invoice).amount_paid ??
          (invoice as Stripe.Checkout.Session).amount_total ??
          0) / 100;
      const currency = invoice.currency?.toUpperCase() || 'EUR';

      console.log(`💰 Montant : ${amount} ${currency}`);

      // ✅ Lire et compiler le modèle HTML avec Handlebars
      const templateHtml = await fs.readFile(
        join('src/templates/invoices.html'),
        'utf8',
      );

      const template = Handlebars.compile(templateHtml);
      const htmlContent = template({
        userName,
        userEmail,
        projectTitle, // ✅ Utilisation du titre du projet depuis les métadonnées
        serviceName, // ✅ Utilisation du nom du service depuis les métadonnées
        amount,
        currency,
        date: new Date().toLocaleDateString(),
      });

      // ✅ Générer le PDF avec Puppeteer
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      await page.pdf({ path: filePath, format: 'A4' });
      await browser.close();

      console.log(`✅ Facture générée avec succès : ${filePath}`);
      return `/invoices/${fileName}`; // URL relative pour accéder à la facture
    } catch (error) {
      console.error('❌ Erreur de génération de la facture:', error);
      throw new InternalServerErrorException(
        'Impossible de générer la facture.',
      );
    }
  }
}
