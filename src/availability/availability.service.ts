import { Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  async getAvailableDates() {
    try {
      const availabilities = await this.prisma.availability.findMany({
        select: {
          startDate: true,
          endDate: true,
        },
      });

      // Transformer les disponibilités en liste de dates uniques
      const availableDates = new Set<string>();

      availabilities.forEach((slot) => {
        let currentDate = dayjs(slot.startDate);
        const endDate = dayjs(slot.endDate);

        while (
          currentDate.isBefore(endDate) ||
          currentDate.isSame(endDate, 'day')
        ) {
          availableDates.add(currentDate.format('YYYY-MM-DD'));
          currentDate = currentDate.add(1, 'day');
        }
      });

      return Array.from(availableDates); // Retourne un tableau de dates prêtes à l'emploi
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des disponibilités :',
        error,
      );
      throw new Error('Impossible de récupérer les dates disponibles.');
    }
  }
}
