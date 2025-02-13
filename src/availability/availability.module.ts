import { Module } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { AvailabilityController } from './availability.controller';
import { UnavailabilityModule } from 'src/unavailability/unavailability.module';

@Module({
  imports: [UnavailabilityModule],
  providers: [AvailabilityService],
  controllers: [AvailabilityController],
})
export class AvailabilityModule {}
