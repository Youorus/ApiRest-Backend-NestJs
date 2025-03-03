import { ServiceType } from '@prisma/client';
import { AdminService } from './../admin/admin.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ClientService } from 'src/client/client.service';
import { CreateProjectDto } from 'src/dto/create-project.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProjectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminService: AdminService,
    private readonly clientService: ClientService,
  ) {}

  async createProject(createProjectDto: CreateProjectDto, userEmail: string) {
    // Appel du service client
    const client = await this.clientService.getClientByEmail(userEmail);

    // Appel du service admin
    const admin = await this.adminService.getAdminWithLeastProjects();

    const price = getPriceByServiceType(createProjectDto.service);

    // 2. Créer le projet avec la relation client et admin
    const newProject = await this.prisma.project.create({
      data: {
        title:
          createProjectDto.title.charAt(0).toUpperCase() +
          createProjectDto.title.slice(1),
        description: createProjectDto.description,
        service: createProjectDto.service,
        price: price,
        category: createProjectDto.category,
        status: 'RECEIVED',
        progress: 0,
        createdAt: new Date(),
        client: {
          connect: { clientId: client.clientId },
        },
        admin: {
          connect: { adminId: admin.adminId },
        },
      },
    });

    return newProject;
  }
  async findAllClientProjects(userEmail: string) {
    return this.prisma.project.findMany({
      where: {
        client: {
          user: {
            email: userEmail,
          },
        },
      },
      include: {
        admin: {
          select: {
            adminId: true,
            userName: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        subscription: true,
      },
    });
  }

  async findAllProjectsOrderedByDate() {
    return this.prisma.project.findMany({
      orderBy: {
        createdAt: 'desc', // Trie du plus récent au plus ancien
      },
    });
  }

  async findProjectById(projectId: number) {
    const project = await this.prisma.project.findUnique({
      where: { projectId },
      include: {
        admin: {
          select: {
            adminId: true,
            userName: true,
          },
        },
        mission: {
          select: {
            assignedStudent: {
              select: {
                studentId: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        payment: {
          select: {
            amount: true,
          },
        },
        subscription: {
          select: {
            type: true, // ✅ Récupère le type d'abonnement lié au projet
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Projet avec l'ID ${projectId} introuvable.`);
    }

    const totalPaid = project.payment.reduce(
      (sum, payment) => sum + (payment.amount ?? 0),
      0,
    );

    const payementProgress =
      project.price > 0 ? Math.min((totalPaid / project.price) * 100, 100) : 0;

    return {
      id: project.projectId,
      title: project.title,
      description: project.description,
      category: project.category,
      service: project.service,
      progress: project.progress,
      price: project.price,
      status: project.status,
      payementProgress,
      totalPaid,

      // ✅ Ajout du subscriptionType
      subscriptionType: project.subscription?.type || null,

      admin: project.admin,

      students: project.mission
        .map((mission) => mission.assignedStudent)
        .filter((student) => student !== null)
        .map((student) => ({
          id: student!.studentId,
          firstName: student!.firstName,
          lastName: student!.lastName,
        })),
    };
  }

  async updateProjectSubscriptionStatus(
    projectId: number,
    hasSubscription: boolean,
  ) {
    return this.prisma.project.update({
      where: { projectId },
      data: { hasSubscription },
    });
  }
}

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

  return prices[service] || 0; // Par défaut, retourne 0 si le service n'existe pas
}
