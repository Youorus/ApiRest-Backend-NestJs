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
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { LoginDto } from 'src/dto/login.dto';
import { IUserCreateService } from './interfaces/user-service.interface';

@Injectable()
export class UserService implements IUserCreateService {
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

  async validateUser(data: LoginDto): Promise<User> {
    const { email, password } = data;

    // 🔥 Utilisation de la nouvelle méthode `getUserByEmail`
    const user = await this.getUserByEmail(email);

    // Si l'utilisateur n'existe pas
    if (!user) {
      throw new NotFoundException(
        "Cet email n'est pas enregistré. Veuillez créer un compte.",
      );
    }

    // Vérifier si le mot de passe est correct
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Le mot de passe est incorrect. Réessayez.',
      );
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
}
