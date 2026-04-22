import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteAccountDto {
  @ApiProperty({
    description: 'Your password to confirm account deletion',
    example: 'Password123',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required to delete your account' })
  password: string;
}
