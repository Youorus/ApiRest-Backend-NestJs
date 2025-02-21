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
        title: createProjectDto.title,
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
          // Inclut l'admin responsable du projet
          select: {
            adminId: true,
            userName: true, // Récupérer le nom de l'admin
            user: {
              select: {
                email: true, // Récupérer l'email de l'admin
              },
            },
          },
        },
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

  async findProjectById(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { projectId: parseInt(projectId) },
      include: {
        admin: {
          // ✅ Récupérer l'admin sous forme d'objet complet
          select: {
            adminId: true,
            userName: true,
          },
        },
        mission: {
          // ✅ Récupérer les étudiants contributeurs via les missions
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
        payement: {
          // ✅ Corrigé "payement" en "payment" conformément à ton schéma
          select: {
            amount: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Projet avec l'ID ${projectId} introuvable.`);
    }

    // ✅ Calcul du montant total payé
    const totalPaid = project.payement.reduce(
      (sum, payement) => sum + (payement.amount ?? 0),
      0,
    );

    // ✅ Calcul de la progression du paiement (éviter la division par zéro)
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

      // ✅ Retourne l'admin sous forme d'objet structuré
      admin: project.admin,

      // ✅ Retourne les étudiants assignés sous forme de tableau propre
      students: project.mission
        .map((mission) => mission.assignedStudent) // Extrait directement les étudiants assignés
        .filter((student) => student !== null) // ✅ Évite les valeurs nulles
        .map((student) => ({
          id: student!.studentId,
          firstName: student!.firstName,
          lastName: student!.lastName,
        })),
    };
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
