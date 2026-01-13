// Map of backend error patterns to user-friendly translation keys
const ERROR_PATTERN_MAP: Record<string, string> = {
  'duplicate key value violates unique constraint "users_pincode_key"':
    'errors.duplicatePincode',
  'duplicate key value violates unique constraint "users_username_key"':
    'errors.duplicateUsername',
  'duplicate key value violates unique constraint "users_email_key"':
    'errors.duplicateEmail',
  'duplicate key value violates unique constraint':
    'errors.duplicateField',
  'username': 'errors.invalidUsername',
  'password': 'errors.invalidPassword',
  'phone': 'errors.invalidPhone',
  'email': 'errors.invalidEmail',
};

// Fallback error messages for when translations are not available
const FALLBACK_MESSAGES: Record<string, string> = {
  'errors.duplicatePincode': 'PIN code already exists',
  'errors.duplicateUsername': 'Username already exists',
  'errors.duplicateEmail': 'Email already exists',
  'errors.duplicateField': 'This field value already exists',
  'errors.invalidUsername': 'Invalid username',
  'errors.invalidPassword': 'Invalid password',
  'errors.invalidPhone': 'Invalid phone number',
  'errors.invalidEmail': 'Invalid email address',
};

/**
 * Extract error message from axios error or any error object
 */
function extractErrorMessage(error: unknown): string {
  // Check if it's an axios error with response
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as any).response === 'object'
  ) {
    const response = (error as any).response;
    if (response.data?.message) {
      return response.data.message;
    }
    if (response.data?.error) {
      return response.data.error;
    }
  }

  // Check for standard Error object
  if (error instanceof Error) {
    return error.message || error.name || 'An error occurred';
  }

  // Check for string error
  if (typeof error === 'string') {
    return error;
  }

  // Check for object with message property
  if (typeof error === 'object' && error !== null) {
    const errorMessage = (error as { message?: string }).message;
    if (typeof errorMessage === 'string') {
      return errorMessage;
    }
  }

  return `Unknown error: ${error}`;
}

/**
 * Get translation key for error message based on error content
 */
function getErrorTranslationKey(errorMessage: string): string {
  const lowerMessage = errorMessage.toLowerCase();

  for (const [pattern, key] of Object.entries(ERROR_PATTERN_MAP)) {
    if (lowerMessage.includes(pattern.toLowerCase())) {
      return key;
    }
  }

  // If no pattern matches, return a generic error key
  return 'errors.registrationFailed';
}

/**
 * Get error message with translation key
 * Returns an object with both the key and fallback message
 */
export function getErrorMessage(error: unknown): string {
  const errorMessage = extractErrorMessage(error);
  return errorMessage;
}

/**
 * Get translated error message key and fallback
 * This should be used with the translation system
 */
export function getErrorMessageKey(error: unknown): {
  key: string;
  fallback: string;
} {
  const errorMessage = extractErrorMessage(error);
  const key = getErrorTranslationKey(errorMessage);
  const fallback = FALLBACK_MESSAGES[key] || 'An error occurred during registration';

  return { key, fallback };
}
