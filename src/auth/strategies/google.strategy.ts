import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['profile', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;

    // Vérifie si l'utilisateur existe déjà dans la DB
    const user = await this.userService.getUserByEmail(emails[0].value);

    if (!user) {
      console.log('🆕 Nouvel utilisateur détecté via Google OAuth');
      return done(null, {
        email: emails[0].value,
        firstName: name.givenName,
        lastName: name.familyName,
        picture: photos[0].value,
        googleId: profile.id,
        newUser: true, // Indique que c'est un nouvel utilisateur
      });
    }

    if (!user.emailVerified) {
      console.warn('❌ L’email de l’utilisateur n’est pas vérifié.');
      return done(null, false, { message: 'Email not verified' });
    }

    return done(null, user);
  }
}
