import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/auth/auth.service';
import { LoginDto } from '../../src/auth/dto/login.dto';
import { SignupDto } from '../../src/auth/dto/signup.dto';
import { ForgotPasswordDto } from '../../src/auth/dto/forgot-password.dto';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('signup', () => {
    it('should create a new user', async () => {
      const signupDto: SignupDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123',
        confirmPassword: 'TestPass123',
        termsAccepted: true,
      };

      const result = await service.signup(signupDto);
      expect(result.success).toBe(true);
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw error if passwords do not match', async () => {
      const signupDto: SignupDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123',
        confirmPassword: 'DifferentPass',
        termsAccepted: true,
      };

      await expect(service.signup(signupDto)).rejects.toThrow(
        'Passwords do not match',
      );
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      const signupDto: SignupDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123',
        confirmPassword: 'TestPass123',
        termsAccepted: true,
      };
      await service.signup(signupDto);
    });

    it('should login successfully', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'TestPass123',
      };

      const result = await service.login(loginDto);
      expect(result.success).toBe(true);
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw error for invalid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'invalid@example.com',
        password: 'WrongPass',
      };

      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid email or password',
      );
    });
  });

  describe('forgotPassword', () => {
    it('should process forgot password', async () => {
      const forgotPasswordDto: ForgotPasswordDto = {
        email: 'test@example.com',
      };

      const result = await service.forgotPassword(forgotPasswordDto);
      expect(result.success).toBe(true);
    });
  });
});
