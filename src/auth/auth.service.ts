import { Injectable, UnauthorizedException } from '@nestjs/common';
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
    const user = await this.usersService.validateUser(loginRequest);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.userId,
      role: user.accountType,
    };

    this.generateAccessToken(res, payload);
    this.generateRefreshToken(res, payload);

    return res.json({
      userInfo: {
        sub: user.userId,
        role: user.accountType,
      },
    });
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
}
