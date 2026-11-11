export const MIN_PASSWORD_LENGTH = 6;
export const MAX_NAME_LENGTH = 60;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required';
  if (!EMAIL_PATTERN.test(email.trim())) return 'Enter a valid email';
  return null;
}

export function validateNewPassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  return null;
}

export function validatePasswordConfirmation(password: string, confirmation: string) {
  if (!confirmation) return 'Confirm your password';
  if (password !== confirmation) return 'Passwords do not match';
  return null;
}

export function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Name is required';
  if (trimmed.length > MAX_NAME_LENGTH) return `Name must be ${MAX_NAME_LENGTH} characters or fewer`;
  return null;
}
