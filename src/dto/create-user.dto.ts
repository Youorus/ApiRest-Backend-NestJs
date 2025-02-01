import { IsEmail, IsNotEmpty, IsEnum, IsArray, IsDate } from 'class-validator';
import { SchoolLevel } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CreateStudentDto {
  @IsEmail() email: string;
  @IsNotEmpty() password: string;
  @IsNotEmpty() country: string;
  @IsNotEmpty() city: string;
  @IsNotEmpty() firstName: string;
  @IsNotEmpty() lastName: string;
  @IsNotEmpty() schoolName: string;
  @IsEnum(SchoolLevel) schoolLevel: SchoolLevel;
  @IsArray() skills: string[];
  @IsNotEmpty()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  dob: Date;
}

export class CreateIndividualDto {
  @IsEmail() email: string;
  @IsNotEmpty() password: string;
  @IsNotEmpty() country: string;
  @IsNotEmpty() city: string;
  @IsNotEmpty() firstName: string;
  @IsNotEmpty() lastName: string;
}

export class CreateCompanyDto {
  @IsEmail() email: string;
  @IsNotEmpty() password: string;
  @IsNotEmpty() country: string;
  @IsNotEmpty() city: string;
  @IsNotEmpty() companyName: string;
  @IsNotEmpty() siretNumber: string;
}

export class CreateAdminDto {
  @IsEmail() email: string;
  @IsNotEmpty() password: string;
  @IsNotEmpty() country: string;
  @IsNotEmpty() city: string;
  @IsNotEmpty() userName: string;
}
