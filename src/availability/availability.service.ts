import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as dayjs from 'dayjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { UnavailabilityService } from 'src/unavailability/unavailability.service';

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unavailabilityService: UnavailabilityService,
  ) {}

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

  async getAvailableTimeSlots(date: string) {
    // 📌 Vérification du format de la date
    if (!dayjs(date, 'YYYY-MM-DD', true).isValid()) {
      throw new BadRequestException(
        'Invalid date format. Expected format: YYYY-MM-DD',
      );
    }

    const parsedDate = new Date(date);

    // 📌 Récupérer les disponibilités pour la date choisie
    const availabilities = await this.prisma.availability.findMany({
      where: {
        startDate: { lte: parsedDate },
        endDate: { gte: parsedDate },
      },
      select: {
        startTime: true,
        endTime: true,
        adminId: true,
      },
    });

    if (!availabilities.length) {
      throw new NotFoundException(
        'No available time slots for the selected date.',
      );
    }

    // 📌 Récupérer les indisponibilités (rendez-vous pris inclus)
    const unavailabilities =
      await this.unavailabilityService.getUnavailabilitiesForDate(date);

    // 📌 Générer les créneaux horaires de 1 heure et exclure ceux qui sont bloqués
    return availabilities.flatMap(({ startTime, endTime, adminId }) => {
      const slots: { startTime: string; endTime: string; adminId: number }[] =
        [];
      let current = dayjs(startTime);
      const end = dayjs(endTime);

      while (current.isBefore(end)) {
        const next = current.add(1, 'hour');
        if (next.isAfter(end)) break;

        // ✅ Exclure les créneaux déjà bloqués
        const isBlocked = unavailabilities.some(
          (unavail) =>
            unavail.adminId === adminId &&
            dayjs(unavail.startTime).isBefore(next) &&
            dayjs(unavail.endTime).isAfter(current),
        );

        if (!isBlocked) {
          slots.push({
            startTime: current.format('HH:mm'),
            endTime: next.format('HH:mm'),
            adminId,
          });
        }

        current = next;
      }

      return slots;
    });
  }
}
