import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAdminDto,
  CreateCompanyDto,
  CreateIndividualDto,
  CreateStudentDto,
} from 'src/dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { User } from '@prisma/client';
import { LoginDto } from 'src/dto/login.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async createStudent(data: CreateStudentDto): Promise<void> {
    const hashedPassword = await this.hashPassword(data.password);

    await this.prisma.user.create({
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

  async createIndividual(data: CreateIndividualDto): Promise<void> {
    const hashedPassword = await this.hashPassword(data.password);

    await this.prisma.user.create({
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

  async createCompany(data: CreateCompanyDto): Promise<void> {
    const hashedPassword = await this.hashPassword(data.password);

    await this.prisma.user.create({
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

  async createAdmin(data: CreateAdminDto): Promise<void> {
    const hashedPassword = await this.hashPassword(data.password);

    await this.prisma.user.create({
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
  async validateUser(data: LoginDto): Promise<User> {
    const { email, password } = data;

    // 🔥 Recherche unique de l'utilisateur
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new NotFoundException({
        errorCode: 'EMAIL_NOT_FOUND',
      });
    }

    // 🔥 Vérification du mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        errorCode: 'INVALID_CREDENTIALS',
      });
    }

    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async getUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { userId }, //Requête plus rapide
    });
  }

  async getProfile(email: string) {
    try {
      const userProfile = await this.prisma.user.findUnique({
        where: { email },
        select: {
          email: true,
          accountType: true,
          student: {
            select: { lastName: true },
          },
          client: {
            select: {
              individual: { select: { firstName: true, lastName: true } },
              company: { select: { companyName: true } },
            },
          },
          admin: {
            select: { userName: true },
          },
        },
      });

      if (!userProfile) {
        throw new Error('Aucun utilisateur trouvé avec cet email.');
      }

      return userProfile;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil :', error);
      throw new Error('Impossible de récupérer le profil utilisateur.');
    }
  }
}
