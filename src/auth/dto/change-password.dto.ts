import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password for verification',
    example: 'CurrentPassword123',
  })
  @IsString()
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword: string;

  @ApiProperty({
    description:
      'New password (minimum 6 characters, must contain uppercase, lowercase, and numbers)',
    example: 'NewPassword123',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(6, { message: 'New password must be at least 6 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'New password must contain uppercase, lowercase, and numbers',
  })
  newPassword: string;

  @ApiProperty({
    description: 'Confirmation of new password',
    example: 'NewPassword123',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password confirmation is required' })
  confirmNewPassword: string;
}
