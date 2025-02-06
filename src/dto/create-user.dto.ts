import {
  IsEmail,
  IsNotEmpty,
  IsEnum,
  IsArray,
  IsDate,
  IsBoolean,
} from 'class-validator';
import { SchoolLevel } from '@prisma/client';
import { Transform } from 'class-transformer';

export class UserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

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
  @IsBoolean()
  termsAccepted: boolean;
}

export class CreateIndividualDto {
  @IsEmail() email: string;
  @IsNotEmpty() password: string;
  @IsNotEmpty() country: string;
  @IsNotEmpty() city: string;
  @IsNotEmpty() firstName: string;
  @IsNotEmpty() lastName: string;
  @IsBoolean()
  termsAccepted: boolean;
}

export class CreateCompanyDto {
  @IsEmail() email: string;
  @IsNotEmpty() password: string;
  @IsNotEmpty() country: string;
  @IsNotEmpty() city: string;
  @IsNotEmpty() companyName: string;
  @IsNotEmpty() siretNumber: string;
  @IsBoolean()
  termsAccepted: boolean;
}

export class CreateAdminDto {
  @IsEmail() email: string;
  @IsNotEmpty() password: string;
  @IsNotEmpty() country: string;
  @IsNotEmpty() city: string;
  @IsNotEmpty() userName: string;
  @IsBoolean()
  termsAccepted: boolean;
}

export class UserExistsDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
