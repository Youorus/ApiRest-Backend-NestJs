import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  Get,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  CreateAdminDto,
  CreateCompanyDto,
  CreateIndividualDto,
  CreateStudentDto,
  UserDto,
} from 'src/dto/create-user.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Post('signup/student')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createStudent(@Body() createStudentDto: CreateStudentDto) {
    return this.userService.createStudent(createStudentDto);
  }

  @Public()
  @Post('signup/individual')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createIndividual(@Body() createIndividualDto: CreateIndividualDto) {
    return this.userService.createIndividual(createIndividualDto);
  }

  @Public()
  @Post('signup/company')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createCompany(@Body() createCompanyDto: CreateCompanyDto) {
    return this.userService.createCompany(createCompanyDto);
  }
  @Public()
  @Post('signup/admin')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createAdmin(@Body() createAdminDto: CreateAdminDto) {
    return this.userService.createAdmin(createAdminDto);
  }

  @Get('profile')
  async getProfile(@CurrentUser() user: UserDto) {
    return this.userService.getProfile(user.email);
  }
}
