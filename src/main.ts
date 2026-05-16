import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();
console.log('DEBUG: .env loaded. MONGODB_URI length:', process.env.MONGODB_URI?.length || 0);
console.log('DEBUG: .env loaded. SUPABASE_URL length:', process.env.SUPABASE_URL?.length || 0);

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static files
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

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

  // Configure Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('Soul Card API')
    .setDescription(
      'Soul Card Authentication API - Complete documentation for all REST endpoints',
    )
    .setVersion('1.0.0')
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Game Sessions', 'Game session management endpoints')
    .addTag('AI - Gemini', 'Google Gemini AI integration endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

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
