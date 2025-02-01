import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: "L'email doit être valide." })
  email: string;

  @IsNotEmpty({ message: 'Le mot de passe est obligatoire.' })
  password: string;
}
