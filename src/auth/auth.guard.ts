// src/auth/guards/auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';

// Étendre l'interface Request pour inclure "user"
interface AuthenticatedRequest extends Request {
  user?: any; // Remplace `any` par une interface spécifique si nécessaire
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Vérifie si la route est marquée comme publique
    const isPublic = this.reflector.get<boolean>(
      IS_PUBLIC_KEY,
      context.getHandler(),
    );
    console.log('🔒 Route publique :', isPublic);
    if (isPublic) {
      return true; // ✅ Autoriser l'accès si la route est publique
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const accessToken = request.cookies?.['access_token']; // Vérifie si le token est présent dans les cookies

    if (!accessToken) {
      throw new UnauthorizedException('No access token provided');
    }

    try {
      const payload = this.jwtService.verify(accessToken, {
        secret: process.env.JWT_SECRET, // Clé secrète JWT
      });

      request.user = payload; // Attache les infos de l'utilisateur à la requête
      console.log('User authenticated:', payload);

      return true;
    } catch (error) {
      console.error('Token verification failed:', error.message);
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
