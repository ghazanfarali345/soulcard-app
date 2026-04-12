import { IsString, IsNotEmpty } from 'class-validator';

/**
 * Standardized auth response for mobile apps
 */
export class AuthResponseDto {
  success: boolean;
  message: string;
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
