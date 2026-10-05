import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class JoinSessionDto {
  @ApiProperty({
    description: '6-digit OTP join code or permanent session share code',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{6}$/, {
    message: 'Code must be exactly 6 digits',
  })
  code: string;

  @ApiProperty({
    description: 'Display name for the participant',
    example: 'JohnDoe',
  })
  @IsNotEmpty()
  @IsString()
  displayName: string;
}
