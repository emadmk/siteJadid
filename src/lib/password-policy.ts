// Strong password policy for production use

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

const MIN_LENGTH = 12;

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < MIN_LENGTH) {
    errors.push(`Password must be at least ${MIN_LENGTH} characters`);
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*...)');
  }

  // Check for common weak patterns
  const commonPasswords = [
    'password', '123456', 'qwerty', 'admin', 'letmein',
    'welcome', 'monkey', 'dragon', 'master', 'login',
  ];
  if (commonPasswords.some(p => password.toLowerCase().includes(p))) {
    errors.push('Password contains a common word that is too easy to guess');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getPasswordRequirementsText(): string {
  return `Password must be at least ${MIN_LENGTH} characters and include uppercase, lowercase, number, and special character.`;
}
