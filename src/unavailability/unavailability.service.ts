import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UnavailabilityService {
  constructor(private readonly prisma: PrismaService) {}
  async getUnavailabilitiesForDate(date: string) {
    const parsedDate = new Date(date);

    // 📌 Récupérer les indisponibilités (y compris les créneaux pris par des rendez-vous)
    return await this.prisma.unavailability.findMany({
      where: { date: parsedDate },
      select: {
        startTime: true,
        endTime: true,
        adminId: true,
      },
    });
  }
}
