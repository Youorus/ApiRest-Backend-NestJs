import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  CreateAdminDto,
  CreateCompanyDto,
  CreateIndividualDto,
  CreateStudentDto,
} from 'src/dto/create-user.dto';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('user/signup')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Post('student')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createStudent(@Body() createStudentDto: CreateStudentDto) {
    return this.userService.createStudent(createStudentDto);
  }

  @Public()
  @Post('individual')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createIndividual(@Body() createIndividualDto: CreateIndividualDto) {
    return this.userService.createIndividual(createIndividualDto);
  }

  @Public()
  @Post('company')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createCompany(@Body() createCompanyDto: CreateCompanyDto) {
    return this.userService.createCompany(createCompanyDto);
  }

  @Post('admin')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createAdmin(@Body() createAdminDto: CreateAdminDto) {
    return this.userService.createAdmin(createAdminDto);
  }
}
