import { AdminService } from './../admin/admin.service';
import { Injectable } from '@nestjs/common';
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

    // 2. Créer le projet avec la relation client et admin
    const newProject = await this.prisma.project.create({
      data: {
        title: createProjectDto.title,
        description: createProjectDto.description,
        service: createProjectDto.service,
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
}
