import { ServiceType } from '@prisma/client';

export const ServiceTypeLabels: Record<ServiceType, string> = {
  WEBSITE_CREATION: 'Création de site web',
  WEBSITE_REDESIGN: 'Refonte de site web',
  WORDPRESS_SITE: 'Site WordPress',
  SEO_OPTIMIZATION: 'Optimisation SEO',
  ECOMMERCE_SITE: 'Site e-commerce',
  PAYMENT_INTEGRATION: 'Intégration de paiements',
  MOBILE_APP: 'Application mobile',
  LOGO_REDESIGN: 'Refonte de logo',
  UI_UX_DESIGN: 'Design UI/UX',
  API_AUTOMATION: "Automatisation d'API",
  SITE_SECURITY: 'Sécurité du site',
  REGULAR_MAINTENANCE: 'Maintenance régulière',
  EMERGENCY_REPAIR: "Réparation d'urgence",
};
