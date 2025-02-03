import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const httpsOptions = {
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert'),
  };
  const app = await NestFactory.create(AppModule, { httpsOptions });

  // Activer Cookie-Parser (nécessaire pour lire les tokens stockés en cookie)
  app.use(cookieParser());

  app.enableCors({
    origin: 'https://localhost:3005', // Accepter uniquement ce domaine
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Autoriser l'envoi de cookies (si nécessaire)
  });
  await app.listen(process.env.PORT ?? 3003);
}
bootstrap();
