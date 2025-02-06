// src/dto/create-project.dto.ts
import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { ProjectCategory, ServiceType } from '@prisma/client';

export class CreateProjectDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsEnum(ServiceType)
  service: ServiceType;

  @IsNotEmpty()
  @IsEnum(ProjectCategory)
  category: ProjectCategory;
}
