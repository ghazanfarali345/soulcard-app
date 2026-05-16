import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: '6-digit verification code',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'Verification code must be 6 digits' })
  code: string;
}
