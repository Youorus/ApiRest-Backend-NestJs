import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  Get,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
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
  async createStudent(
    @Body() createStudentDto: CreateStudentDto,
    @Res() res: Response,
  ) {
    await this.userService.createStudent(createStudentDto);
    return res.status(HttpStatus.CREATED).send();
  }

  @Public()
  @Post('signup/individual')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createIndividual(
    @Body() createIndividualDto: CreateIndividualDto,
    @Res() res: Response,
  ) {
    await this.userService.createIndividual(createIndividualDto);
    return res.status(HttpStatus.CREATED).send();
  }

  @Public()
  @Post('signup/company')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createCompany(
    @Body() createCompanyDto: CreateCompanyDto,
    @Res() res: Response,
  ) {
    await this.userService.createCompany(createCompanyDto);
    return res.status(HttpStatus.CREATED).send();
  }

  @Public()
  @Post('signup/admin')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createAdmin(
    @Body() createAdminDto: CreateAdminDto,
    @Res() res: Response,
  ) {
    await this.userService.createAdmin(createAdminDto);
    return res.status(HttpStatus.CREATED).send();
  }

  @Get('profile')
  async getProfile(@CurrentUser() user: UserDto) {
    return this.userService.getProfile(user.email);
  }
}
