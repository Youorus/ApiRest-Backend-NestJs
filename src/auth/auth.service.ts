import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from 'src/dto/login.dto';
import { UserService } from 'src/user/user.service';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UserService,
  ) {}

  async login(loginRequest: LoginDto, res: Response) {
    try {
      const user = await this.usersService.validateUser(loginRequest);

      const payload = {
        sub: user.email,
        role: user.accountType,
      };

      this.generateAccessToken(res, payload);
      this.generateRefreshToken(res, payload);

      return res.json({
        sub: user.email,
        role: user.accountType,
      });
    } catch (error) {
      console.error('🚨 Erreur lors du login :', error);

      // Si l'erreur est une exception NestJS, on renvoie la réponse appropriée
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        return res.status(error.getStatus()).json(error.getResponse());
      }

      // Si c'est une erreur inconnue, renvoyer une erreur 500
      return res.status(500).json({
        errorCode: 'INTERNAL_SERVER_ERROR',
      });
    }
  }

  generateAccessToken(res: Response, payload: any): string {
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.ACCESS_TOKEN_EXPIRATION || '15m',
    });

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      expires: new Date(Date.now() + 15 * 60 * 1000), // Expire en même temps que le token
    });
    return accessToken;
  }

  generateRefreshToken(res: Response, payload: any): string {
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.REFRESH_SECRET,
      expiresIn: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expire après 7 jours
    });
    return refreshToken;
  }

  async userExists(email: string): Promise<boolean> {
    try {
      const user = await this.usersService.getUserByEmail(email);
      return Boolean(user);
    } catch (error) {
      console.error(
        `🚨 Erreur lors de la vérification de l'utilisateur :`,
        error,
      );
      return false;
    }
  }
}
