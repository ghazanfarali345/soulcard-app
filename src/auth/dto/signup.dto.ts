import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  IsBoolean,
} from 'class-validator';

export class SignupDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Username must be at least 3 characters' })
  username: string;

  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and numbers',
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  confirmPassword: string;

  @IsBoolean()
  @IsNotEmpty()
  termsAccepted: boolean;
}
