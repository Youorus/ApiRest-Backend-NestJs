import { Controller, Get, Param } from '@nestjs/common';
import { AvailabilityService } from './availability.service';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get('all')
  async getAvailableDates() {
    return this.availabilityService.getAvailableDates();
  }

  @Get(':date')
  async getAvailableTimeSlots(@Param('date') date: string) {
    return this.availabilityService.getAvailableTimeSlots(date);
  }
}
