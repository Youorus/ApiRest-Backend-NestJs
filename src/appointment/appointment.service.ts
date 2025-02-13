import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import dayjs from 'dayjs';
import { ClientService } from 'src/client/client.service';
import { CreateAppointmentDto } from 'src/dto/create-appointment.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AppointmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clientService: ClientService,
  ) {}

  async createAppointmentWithUnavailability(
    dto: CreateAppointmentDto,
    userEmail: string,
  ) {
    return this.prisma.$transaction(async (prisma) => {
      // 🔍 Trouver le client via son email
      const client = await this.clientService.getClientByEmail(userEmail);

      // 1️⃣ Créer l'Appointment
      const appointment = await prisma.appointment.create({
        data: {
          clientId: client.clientId, // Utiliser l'ID du client trouvé
          adminId: dto.adminId,
          projectId: dto.projectId,
          date: new Date(dto.date),
          subject: dto.subject,
          time: new Date(dto.time),
          duration: dto.duration,
          status: 'CONFIRMED', // Par défaut, l'appointment est confirmé
        },
      });

      // 2️⃣ Créer une Unavailability pour l'Admin
      const startTime = new Date(dto.time);
      const endTime = new Date(startTime.getTime() + dto.duration * 60000); // Ajoute la durée

      await prisma.unavailability.create({
        data: {
          adminId: dto.adminId,
          date: new Date(dto.date),
          startTime: startTime,
          endTime: endTime,
          reason: 'BOOKED', // Motif de l'indisponibilité
        },
      });

      return appointment;
    });
  }

  async findAllAppointmentsClient(targetEmail: string) {
    return this.prisma.appointment.findMany({
      where: {
        client: {
          user: {
            email: targetEmail, // Recherche uniquement les rendez-vous du client
          },
        },
      },
      include: {
        client: { include: { user: true } },
        admin: { include: { user: true } },
      },
    });
  }
}
