import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EditProfileDto {
  @ApiProperty({
    description: 'New username (optional, minimum 3 characters)',
    example: 'neweusername',
    required: false,
    minLength: 3,
  })
  @IsString()
  @IsOptional()
  @MinLength(3, { message: 'Username must be at least 3 characters' })
  username?: string;

  @ApiProperty({
    description: 'New email address (optional)',
    example: 'newemail@example.com',
    required: false,
  })
  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Full name (optional)',
    example: 'John Doe',
    required: false,
  })
  @IsString()
  @IsOptional()
  fullName?: string;
}
