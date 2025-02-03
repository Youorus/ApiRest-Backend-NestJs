// src/user/interfaces/user-service.interface.ts
import { User } from '@prisma/client';
import {
  CreateAdminDto,
  CreateCompanyDto,
  CreateIndividualDto,
  CreateStudentDto,
} from 'src/dto/create-user.dto';

export interface IUserCreateService {
  createStudent(data: CreateStudentDto): Promise<User>;
  createIndividual(data: CreateIndividualDto): Promise<User>;
  createCompany(data: CreateCompanyDto): Promise<User>;
  createAdmin(data: CreateAdminDto): Promise<User>;
}
