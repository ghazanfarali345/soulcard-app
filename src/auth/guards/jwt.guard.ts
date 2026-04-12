import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Guard for protecting routes
 * Usage: @UseGuards(JwtGuard)
 */
@Injectable()
export class JwtGuard extends AuthGuard('jwt') {}
