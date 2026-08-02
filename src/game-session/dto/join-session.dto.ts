import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class JoinSessionDto {
  @ApiProperty({
    description: '6-digit numeric OTP join code',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'Join code must be exactly 6 characters' })
  // Ensure it's numeric digits only
  // (validation on server will also check existence/expiry)
  code: string;

  @ApiProperty({
    description: 'Display name for the participant',
    example: 'JohnDoe',
  })
  @IsNotEmpty()
  @IsString()
  displayName: string;
}
