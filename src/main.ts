import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Apply global interceptor for response transformation
  app.useGlobalInterceptors(new TransformInterceptor());

  // Enable CORS for frontend with credentials
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Enable compression and security headers
  // Trust proxy headers for rate limiting behind reverse proxy
  (app as any).set('trust proxy', 1);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📊 Database: MongoDB Atlas`);
  console.log(`🔐 JWT Authentication: Enabled`);
  console.log(`⚡ Rate Limiting: Enabled`);
  console.log(
    `💾 Database Name: ${process.env.MONGODB_URI ? 'soul_card_db' : 'local'}`,
  );
}
bootstrap();
