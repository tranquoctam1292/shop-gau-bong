/**
 * Password Utilities
 * 
 * Handles password hashing, verification, and strength validation
 */

import bcrypt from 'bcryptjs';

/**
 * Password strength validation result
 */
export interface PasswordStrengthResult {
  valid: boolean;
  errors: string[];
}

/**
 * Hash password using bcrypt
 * 
 * @param password - Plain text password
 * @param saltRounds - Number of salt rounds (default: 12 for production, 10 for dev)
 * @returns Hashed password
 */
export async function hashPassword(
  password: string,
  saltRounds: number = process.env.NODE_ENV === 'production' ? 12 : 10
): Promise<string> {
  if (!password || password.trim().length === 0) {
    throw new Error('Password cannot be empty');
  }

  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}

/**
 * Compare plain password with hashed password
 * 
 * @param password - Plain text password
 * @param hash - Hashed password from database
 * @returns true if passwords match, false otherwise
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  if (!password || !hash) {
    return false;
  }

  try {
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  } catch (error) {
    // Handle bcrypt errors (invalid hash format, etc.)
    return false;
  }
}

/**
 * Validate password strength
 * 
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - Optional: At least one special character (recommended but not required)
 * 
 * @param password - Password to validate
 * @returns Validation result with errors array
 */
export function validatePasswordStrength(password: string): PasswordStrengthResult {
  const errors: string[] = [];

  if (!password || password.length < 8) {
    errors.push('Mật khẩu phải có ít nhất 8 ký tự');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất một chữ cái viết hoa');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất một chữ cái viết thường');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất một chữ số');
  }

  // Optional: Check for special characters (recommended but not required)
  // Uncomment if you want to require special characters
  // if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
  //   errors.push('Mật khẩu phải có ít nhất một ký tự đặc biệt');
  // }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate a secure random password
 * Useful for resetting passwords or creating temporary passwords
 * 
 * @param length - Password length (default: 16)
 * @returns Random password
 */
export function generateRandomPassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = uppercase + lowercase + numbers + special;
  
  let password = '';
  
  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
