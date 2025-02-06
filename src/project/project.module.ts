import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { AdminModule } from 'src/admin/admin.module';
import { ClientModule } from 'src/client/client.module';

@Module({
  imports: [AdminModule, ClientModule],
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectModule {}
