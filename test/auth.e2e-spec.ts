import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AuthModule } from '../../src/auth/auth.module';

describe('Auth Endpoints (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/signup', () => {
    it('should create a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'TestPass123',
          confirmPassword: 'TestPass123',
          termsAccepted: true,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.user.email).toBe('test@example.com');
        });
    });

    it('should fail if passwords do not match', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          username: 'testuser',
          email: 'test2@example.com',
          password: 'TestPass123',
          confirmPassword: 'DifferentPass123',
          termsAccepted: true,
        })
        .expect(400);
    });

    it('should fail if terms are not accepted', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          username: 'testuser',
          email: 'test3@example.com',
          password: 'TestPass123',
          confirmPassword: 'TestPass123',
          termsAccepted: false,
        })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPass123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should fail with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid@example.com',
          password: 'WrongPass123',
        })
        .expect(400);
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('should process forgot password request', () => {
      return request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({
          email: 'test@example.com',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should handle non-existent email gracefully', () => {
      return request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com',
        })
        .expect(200);
    });
  });
});
