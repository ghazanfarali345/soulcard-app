/**
 * User Entity
 * Represents user data structure
 * Note: Currently uses in-memory storage. Replace with database implementation.
 */

export class User {
  id: number;
  username: string;
  email: string;
  password: string; // In production, this should be hashed using bcrypt
  termsAccepted: boolean;
  createdAt: Date;
  updatedAt?: Date;
  resetToken?: string; // For password reset functionality
  resetTokenExpiry?: Date;
}
