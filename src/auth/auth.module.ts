import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from 'src/user/user.module';
import { GoogleStrategy } from './strategies/google.strategy';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    UserModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'superSecretKey',
      signOptions: { expiresIn: '15m' }, // 🔥 Expiration courte pour l'access token
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, ConfigService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
