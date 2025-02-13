import { IsDateString, IsInt, IsString, Min } from 'class-validator';

export class CreateAppointmentDto {
  @IsInt()
  adminId: number; // Admin sélectionné

  @IsDateString()
  date: string; // Format: 'YYYY-MM-DD'

  @IsString()
  subject: string;

  @IsDateString()
  time: string; // Format: 'YYYY-MM-DDTHH:mm:ss.sssZ'

  @IsInt()
  @Min(1)
  duration: number; // Durée en minutes

  @IsInt()
  projectId: number; // Projet lié au rendez-vous
}
