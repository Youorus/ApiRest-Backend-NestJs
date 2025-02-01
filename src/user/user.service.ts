import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAdminDto,
  CreateCompanyDto,
  CreateIndividualDto,
  CreateStudentDto,
} from 'src/dto/create-user.dto';
import { IUserService } from './interfaces/user-service.interface';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService implements IUserService {
  constructor(private readonly prisma: PrismaService) {}

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async createStudent(data: CreateStudentDto) {
    const hashedPassword = await this.hashPassword(data.password);

    return this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        country: data.country,
        city: data.city,
        accountType: 'STUDENT',
        termsAccepted: data.termsAccepted,
        student: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
            birthDate: data.dob,
            schoolName: data.schoolName,
            schoolLevel: data.schoolLevel,
            skills: data.skills,
          },
        },
      },
    });
  }

  async createIndividual(data: CreateIndividualDto) {
    const hashedPassword = await this.hashPassword(data.password);

    return this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        country: data.country,
        city: data.city,
        accountType: 'INDIVIDUAL',
        termsAccepted: data.termsAccepted,
        client: {
          create: {
            type: 'INDIVIDUAL',
            individual: {
              create: {
                firstName: data.firstName,
                lastName: data.lastName,
              },
            },
          },
        },
      },
    });
  }

  async createCompany(data: CreateCompanyDto) {
    const hashedPassword = await this.hashPassword(data.password);

    return this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        country: data.country,
        city: data.city,
        accountType: 'COMPANY',
        termsAccepted: data.termsAccepted,
        client: {
          create: {
            type: 'COMPANY',
            company: {
              create: {
                companyName: data.companyName,
                siretNumber: data.siretNumber,
              },
            },
          },
        },
      },
    });
  }

  async createAdmin(data: CreateAdminDto) {
    const hashedPassword = await this.hashPassword(data.password);

    return this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        country: data.country,
        city: data.city,
        accountType: 'ADMIN',
        termsAccepted: data.termsAccepted,
        admin: {
          create: {
            userName: data.userName,
          },
        },
      },
    });
  }
}
