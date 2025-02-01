import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from '@prisma/client';
import bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async validateUser(email: string, password: string): Promise<User> {
    // Vérifier si l'utilisateur existe dans la base de données
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

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
}
