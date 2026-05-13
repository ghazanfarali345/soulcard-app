import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class JoinSessionDto {
  @ApiProperty({
    description: '12-character OTP join code',
    example: 'ABC123!@#456',
    minLength: 12,
    maxLength: 12,
  })
  @IsNotEmpty()
  @IsString()
  @Length(12, 12, { message: 'Join code must be exactly 12 characters' })
  code: string;

  @ApiProperty({
    description: 'Display name for the participant',
    example: 'JohnDoe',
  })
  @IsNotEmpty()
  @IsString()
  displayName: string;
}
