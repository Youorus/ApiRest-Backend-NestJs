import {
  PrismaClient,
  AccountType,
  ProjectCategory,
  ProjectStatus,
  ServiceType,
  SchoolLevel,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10; // Niveau de sécurité du hachage

// Fonction pour hacher un mot de passe
async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

// Fonction pour définir un prix en fonction du type de service
function getPriceByServiceType(service: ServiceType): number {
  const prices: Record<ServiceType, number> = {
    WEBSITE_CREATION: 1000,
    WEBSITE_REDESIGN: 800,
    WORDPRESS_SITE: 600,
    SEO_OPTIMIZATION: 500,
    ECOMMERCE_SITE: 1500,
    PAYMENT_INTEGRATION: 400,
    MOBILE_APP: 2000,
    LOGO_REDESIGN: 300,
    UI_UX_DESIGN: 700,
    API_AUTOMATION: 1200,
    SITE_SECURITY: 900,
    REGULAR_MAINTENANCE: 350,
    EMERGENCY_REPAIR: 600,
  };

  return prices[service] ?? 500;
}

async function main() {
  console.log('🚀 Seeding database...');
  const hashedPassword = await hashPassword('password1');

  // 🔹 Vérifie et crée un Admin
  let adminUser = await prisma.user.findUnique({
    where: { email: 'admin@example.com' },
    include: { admin: true },
  });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        country: 'France',
        city: 'Paris',
        accountType: AccountType.ADMIN,
        termsAccepted: true,
        emailVerified: true,
        admin: { create: { userName: 'SuperAdmin' } },
      },
      include: { admin: true },
    });
  }

  // 🔹 Vérifie et crée un Étudiant
  let studentUser = await prisma.user.findUnique({
    where: { email: 'student@example.com' },
    include: { student: true },
  });
  if (!studentUser) {
    studentUser = await prisma.user.create({
      data: {
        email: 'student@example.com',
        password: hashedPassword,
        country: 'France',
        city: 'Lyon',
        accountType: AccountType.STUDENT,
        termsAccepted: true,
        emailVerified: true,
        student: {
          create: {
            firstName: 'Jean',
            lastName: 'Dupont',
            birthDate: new Date('2000-06-15'),
            schoolName: 'Université de Lyon',
            schoolLevel: SchoolLevel.BACHELOR,
            profileVerified: true,
            skills: ['React', 'Node.js'],
          },
        },
      },
      include: { student: true },
    });
  }

  // 🔹 Vérifie et crée un Client
  let clientUser = await prisma.user.findUnique({
    where: { email: 'client@example.com' },
    include: { client: { include: { individual: true } } },
  });
  if (!clientUser) {
    clientUser = await prisma.user.create({
      data: {
        email: 'client@example.com',
        password: hashedPassword,
        country: 'France',
        city: 'Marseille',
        accountType: AccountType.INDIVIDUAL,
        termsAccepted: true,
        emailVerified: true,
        client: {
          create: {
            type: AccountType.INDIVIDUAL,
            individual: { create: { firstName: 'Marie', lastName: 'Curie' } },
          },
        },
      },
      include: { client: { include: { individual: true } } },
    });
  }

  console.log('🎉 Seeding complete!');
}

// Exécute le seed
main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
