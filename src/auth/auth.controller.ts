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
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '../dto/login.dto'; // Vérifie que ce fichier existe bien
import { Response } from 'express';
import { UserExistsDto } from 'src/dto/create-user.dto';
import { Public } from './decorators/public.decorator';

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

  @Public()
  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    return this.authService.login(loginDto, res);
  }

  @Public()
  @Post('refresh')
  async refreshToken(@Req() req: CustomRequest, @Res() res: Response) {
    console.log('📥 Requête reçue sur /auth/refresh');
    console.log('🔍 Cookies reçus :', req.cookies);

    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      console.warn('⚠️ Aucun refresh token trouvé dans les cookies !');
      throw new UnauthorizedException('No refresh token provided');
    }

    return this.authService.refreshAccessToken(refreshToken, res);
  }

  @Post('logout')
  logout(@Res() res: Response) {
    res.clearCookie('refresh_token');
    return res.status(200).json({ message: 'Logged out' });
  }

  @Get('user-exists')
  async userExists(@Query() query: UserExistsDto) {
    const { email } = query;

    const exists = await this.authService.userExists(email);
    return { exists };
  }
}
