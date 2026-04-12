import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Standardized auth response for mobile apps
 */
export class AuthResponseDto {
  @ApiProperty({
    description: 'Response success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Login successful',
  })
  message: string;

  @ApiProperty({
    description: 'Authentication response data',
    example: {
      user: {
        id: '507f1f77bcf86cd799439011',
        username: 'johndoe',
        email: 'user@example.com',
      },
      accessToken:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refreshToken:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      expiresIn: 3600,
    },
  })
  data: {
    user: {
      id: string;
      username: string;
      email: string;
    };
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

/**
 * Refresh token request DTO with validation
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'Valid refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString({ message: 'Refresh token must be a string' })
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken: string;
}

/**
 * JWT Payload interface
 */
export interface JwtPayload {
  sub: string; // user id
  email: string;
  username: string;
  iat?: number; // issued at
  exp?: number; // expiration
}
