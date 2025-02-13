import { Module } from '@nestjs/common';
import { UnavailabilityService } from './unavailability.service';

@Module({
  providers: [UnavailabilityService],
  exports: [UnavailabilityService],
})
export class UnavailabilityModule {}
