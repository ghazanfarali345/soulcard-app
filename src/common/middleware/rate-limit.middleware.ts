import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private limiter = rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW_MS
      ? parseInt(process.env.RATE_LIMIT_WINDOW_MS)
      : 15 * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX_REQUESTS
      ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
      : 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });

  use(req: Request, res: Response, next: NextFunction) {
    this.limiter(req, res, next);
  }
}
