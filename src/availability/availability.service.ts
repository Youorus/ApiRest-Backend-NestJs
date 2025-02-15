import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as dayjs from 'dayjs';
import { PrismaService } from '../prisma/prisma.service';
import { UnavailabilityService } from '../unavailability/unavailability.service';

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

      return Array.from(availableDates);
    } catch (error) {
      console.error('Error fetching available dates:', error);
      throw new Error('Failed to retrieve available dates');
    }
  }

  async getAvailableTimeSlots(date: string) {
    if (!dayjs(date, 'YYYY-MM-DD', true).isValid()) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    const parsedDate = new Date(date);

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

    if (availabilities.length === 0) {
      throw new NotFoundException('No availability for this date');
    }

    const unavailabilities =
      await this.unavailabilityService.getUnavailabilitiesForDate(date);

    return availabilities.flatMap(({ startTime, endTime, adminId }) => {
      const slots: Array<{
        startTime: string;
        endTime: string;
        adminId: number;
      }> = [];

      // Combine date with availability times
      const startDate = dayjs(parsedDate)
        .set('hour', startTime.getHours())
        .set('minute', startTime.getMinutes());

      const endDate = dayjs(parsedDate)
        .set('hour', endTime.getHours())
        .set('minute', endTime.getMinutes());

      let current = startDate;

      while (current.isBefore(endDate)) {
        const next = current.add(1, 'hour');
        if (next.isAfter(endDate)) break;

        // Nouvelle vérification robuste
        const isBlocked = unavailabilities.some((unavail) => {
          const unavailStart = dayjs(unavail.startTime);
          const unavailEnd = dayjs(unavail.endTime);
          return (
            unavail.adminId === adminId &&
            current.isBefore(unavailEnd) &&
            next.isAfter(unavailStart)
          );
        });

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
