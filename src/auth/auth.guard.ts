import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

// Étendre l'interface Request pour inclure "user"
interface AuthenticatedRequest extends Request {
  user?: any; // Idéalement, remplace `any` par une interface spécifique à ton utilisateur
}
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const accessToken = request.cookies?.['access_token']; // Vérifie si les cookies existent
    console.log('accessToken:', accessToken);

    if (!accessToken) {
      throw new UnauthorizedException('No access token provided');
    }

    try {
      const payload = this.jwtService.verify(accessToken, {
        secret: process.env.JWT_SECRET, // Assure-toi que JWT_SECRET est bien défini
      });

      request['user'] = payload; // Attache l'utilisateur à la requête pour un accès ultérieur
      console.log('Authenticated user:', request.user);

      return true;
    } catch (error) {
      console.error('Token verification failed:', error.message);
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
