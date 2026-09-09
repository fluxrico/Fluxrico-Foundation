const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns an error message, or null when the value is acceptable. */
export function validateName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Enter your full name.';
  if (trimmed.length < 2) return 'That name looks a little short.';
  return null;
}

export function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Enter your email address.';
  if (!EMAIL_PATTERN.test(trimmed)) return 'Enter a valid email address, like you@domain.com.';
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return 'Enter a password.';
  if (value.length < 8) return 'Use at least 8 characters.';
  return null;
}

export function validatePasswordConfirmation(password: string, confirmation: string): string | null {
  if (!confirmation) return 'Confirm your new password.';
  if (password !== confirmation) return 'Passwords do not match yet.';
  return null;
}
