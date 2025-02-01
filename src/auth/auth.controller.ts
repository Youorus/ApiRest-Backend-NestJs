import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '../dto/login.dto'; // Vérifie que ce fichier existe bien

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async login(@Body() loginDto: LoginDto) {
    try {
      const user = await this.authService.validateUser(
        loginDto.email,
        loginDto.password,
      );

      if (!user) {
        new HttpException(
          'Identifiants incorrects, veuillez réessayer.',
          HttpStatus.UNAUTHORIZED,
        );
      }

      return {
        user,
      };
    } catch (error) {
      console.log(error);
    }
  }
}
