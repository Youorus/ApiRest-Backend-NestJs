import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // Récupérer l'admin avec le moins de projets
  async getAdminWithLeastProjects() {
    const admin = await this.prisma.admin.findFirst({
      orderBy: {
        project: {
          _count: 'asc', // Trie les admins par nombre de projets croissant
        },
      },
    });

    if (!admin) {
      throw new NotFoundException('Aucun administrateur disponible.');
    }

    return admin;
  }
}
