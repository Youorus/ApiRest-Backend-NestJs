import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CurrentUser } from 'src/auth/decorators/urrent-user.decorator';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from 'src/dto/create-appointment.dto';
import { UserDto } from 'src/dto/create-user.dto';

@Controller('appointment')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post('create')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createAppointment(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @CurrentUser() user: UserDto, // Récupère l'utilisateur connecté
  ) {
    return this.appointmentService.createAppointmentWithUnavailability(
      createAppointmentDto,
      user.email, // Passe l'email du client connecté
    );
  }

  @Get('client')
  async getUserAppointments(
    @CurrentUser() user: UserDto,
    @Query('email') email?: string,
  ) {
    const targetEmail = email ?? user.email; // Utilise l'email fourni ou celui de l'utilisateur connecté
    return this.appointmentService.findAllAppointmentsClient(targetEmail);
  }
}
