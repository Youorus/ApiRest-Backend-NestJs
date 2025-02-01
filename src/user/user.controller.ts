// src/user/user.controller.ts
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

@Controller('user/signup')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('student')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createStudent(@Body() createStudentDto: CreateStudentDto) {
    return this.userService.createStudent(createStudentDto);
  }

  @Post('individual')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createIndividual(@Body() createIndividualDto: CreateIndividualDto) {
    return this.userService.createIndividual(createIndividualDto);
  }

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
