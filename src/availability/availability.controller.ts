import { Controller, Get } from '@nestjs/common';
import { AvailabilityService } from './availability.service';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get('all')
  async getAvailableDates() {
    return this.availabilityService.getAvailableDates();
  }
}
