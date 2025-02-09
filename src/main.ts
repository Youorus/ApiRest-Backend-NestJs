import { JwtService } from '@nestjs/jwt';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as cookieParser from 'cookie-parser';
import { AuthGuard } from './auth/auth.guard';

async function bootstrap() {
  const httpsOptions = {
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert'),
  };
  const app = await NestFactory.create(AppModule, { httpsOptions });
  const reflector = app.get(Reflector);
  const jwtService = app.get(JwtService);

  // Activer Cookie-Parser (nécessaire pour lire les tokens stockés en cookie)
  app.use(cookieParser());

  //  Appliquer le AuthGuard globalement
  app.useGlobalGuards(new AuthGuard(jwtService, reflector));

  app.enableCors({
    origin: 'https://localhost:3010', // Accepter uniquement ce domaine
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Autoriser l'envoi de cookies (si nécessaire)
  });
  await app.listen(process.env.PORT ?? 3009);
}
bootstrap();
