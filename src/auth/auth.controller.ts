import { JwtService } from '@nestjs/jwt';
import { UserService } from './../user/user.service';
import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  Res,
  Get,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '../dto/login.dto'; // Vérifie que ce fichier existe bien
import { Response } from 'express';
import { AuthGuard } from './auth.guard';

interface CustomRequest extends Request {
  cookies: { refresh_token?: string };
}
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly JwtService: JwtService,
  ) {}

  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    return this.authService.login(loginDto, res);
  }

  @Post('refresh')
  async refreshToken(@Req() req: CustomRequest, @Res() res: Response) {
    const refreshToken = req.cookies?.refresh_token; // Récupère le token stocké en cookie

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }
    try {
      const payload = this.JwtService.verify(refreshToken, {
        secret: process.env.REFRESH_SECRET,
      });

      //  Vérifier si l'utilisateur existe toujours
      const user = await this.userService.getUserById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User no longer exists');
      }

      // 🔥 Générer un nouvel Access Token
      this.authService.generateAccessToken(res, {
        sub: user.userId,
        role: user.accountType,
      });
      return res.status(200).json({ message: 'Token refreshed' });
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @Post('logout')
  logout(@Res() res: Response) {
    res.clearCookie('refresh_token');
    return res.status(200).json({ message: 'Logged out' });
  }
}
