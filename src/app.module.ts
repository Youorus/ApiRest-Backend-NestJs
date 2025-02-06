import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectModule } from './project/project.module';
import { AdminModule } from './admin/admin.module';
import { ClientModule } from './client/client.module';

@Module({
  imports: [
    UserModule,
    AuthModule,
    PrismaModule,
    ProjectModule,
    AdminModule,
    ClientModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
