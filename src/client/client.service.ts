import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ClientService {
  constructor(private readonly prisma: PrismaService) {}

  //  Récupérer un client par l'email de l'utilisateur
  async getClientByEmail(email: string) {
    const client = await this.prisma.client.findFirst({
      where: {
        user: {
          email: email,
        },
      },
      include: {
        user: true, // Inclure les infos utilisateur pour vérifier le rôle
      },
    });

    if (!client) {
      throw new NotFoundException('Client non trouvé pour cet email.');
    }

    return client;
  }
}
