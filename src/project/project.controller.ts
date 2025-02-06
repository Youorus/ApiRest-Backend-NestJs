import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreateProjectDto } from 'src/dto/create-project.dto';
import { ProjectService } from './project.service';
import { CurrentUser } from 'src/auth/decorators/urrent-user.decorator';
import { UserDto } from 'src/dto/create-user.dto';

@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post('create')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createProject(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser() user: UserDto, // Assurez-vous que le `user` contient l'email
  ) {
    return this.projectService.createProject(createProjectDto, user.email);
  }
}
