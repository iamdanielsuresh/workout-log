/**
 * Input sanitization and validation utilities
 * Prevents XSS attacks and ensures data integrity
 */

/**
 * Sanitize a numeric input value
 * @param {string|number} value - The input value
 * @param {object} options - Configuration options
 * @param {number} options.max - Maximum allowed value
 * @param {number} options.min - Minimum allowed value (default: 0)
 * @param {boolean} options.allowDecimals - Allow decimal numbers
 * @param {number} options.maxDecimals - Max decimal places (default: 2)
 * @returns {string} Sanitized numeric string
 */
export function sanitizeNumber(value, options = {}) {
  const { 
    max, 
    min = 0, 
    allowDecimals = false, 
    maxDecimals = 2 
  } = options;

  if (value === null || value === undefined || value === '') {
    return '';
  }

  let sanitized = String(value);

  // Remove non-numeric characters (keep decimal point if allowed)
  if (allowDecimals) {
    // Keep only digits and first decimal point
    sanitized = sanitized.replace(/[^\d.]/g, '');
    const parts = sanitized.split('.');
    if (parts.length > 2) {
      sanitized = parts[0] + '.' + parts.slice(1).join('');
    }
    // Limit decimal places
    if (parts.length === 2 && parts[1].length > maxDecimals) {
      sanitized = parts[0] + '.' + parts[1].slice(0, maxDecimals);
    }
  } else {
    sanitized = sanitized.replace(/\D/g, '');
  }

  // Apply min/max constraints
  const num = parseFloat(sanitized);
  if (!isNaN(num)) {
    if (max !== undefined && num > max) {
      sanitized = String(max);
    }
    if (min !== undefined && num < min) {
      sanitized = String(min);
    }
  }

  return sanitized;
}

/**
 * Sanitize text input to prevent XSS
 * @param {string} value - The input value
 * @param {object} options - Configuration options
 * @param {number} options.maxLength - Maximum allowed length
 * @param {boolean} options.allowNewlines - Allow newline characters
 * @param {boolean} options.trim - Trim whitespace
 * @returns {string} Sanitized text string
 */
export function sanitizeText(value, options = {}) {
  const { 
    maxLength = 1000, 
    allowNewlines = true,
    trim = false 
  } = options;

  if (value === null || value === undefined) {
    return '';
  }

  let sanitized = String(value);

  // Remove potentially dangerous characters
  sanitized = sanitized
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, ''); // Remove event handlers

  // Handle newlines
  if (!allowNewlines) {
    sanitized = sanitized.replace(/[\r\n]/g, ' ');
  }

  // Trim if requested
  if (trim) {
    sanitized = sanitized.trim();
  }

  // Enforce max length
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize weight input (allows decimals, max 999)
 */
export function sanitizeWeight(value) {
  return sanitizeNumber(value, {
    max: 999,
    min: 0,
    allowDecimals: true,
    maxDecimals: 1
  });
}

/**
 * Sanitize reps input (integers only, max 100)
 */
export function sanitizeReps(value) {
  return sanitizeNumber(value, {
    max: 100,
    min: 0,
    allowDecimals: false
  });
}

/**
 * Sanitize sets input (integers only, max 20)
 */
export function sanitizeSets(value) {
  return sanitizeNumber(value, {
    max: 20,
    min: 1,
    allowDecimals: false
  });
}

/**
 * Sanitize workout notes
 */
export function sanitizeNotes(value) {
  return sanitizeText(value, {
    maxLength: 2000,
    allowNewlines: true,
    trim: false
  });
}

/**
 * Sanitize exercise name
 */
export function sanitizeExerciseName(value) {
  return sanitizeText(value, {
    maxLength: 100,
    allowNewlines: false,
    trim: true
  });
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate API key format (basic check for Gemini keys)
 */
export function isValidApiKey(key) {
  if (!key || typeof key !== 'string') return false;
  // Gemini API keys start with 'AIza' and are 39 characters
  return key.startsWith('AIza') && key.length === 39;
}

/**
 * Validate date of birth (must be in the past, reasonable age)
 */
export function isValidDateOfBirth(dateString) {
  if (!dateString) return false;
  
  const dob = new Date(dateString);
  const now = new Date();
  const minDate = new Date();
  minDate.setFullYear(now.getFullYear() - 120); // Max 120 years old
  
  return dob < now && dob > minDate;
}

/**
 * Validate height in cm (reasonable range)
 */
export function isValidHeight(height) {
  const h = parseFloat(height);
  return !isNaN(h) && h >= 50 && h <= 300;
}

/**
 * Validate weight in kg/lbs (reasonable range)
 */
export function isValidBodyWeight(weight) {
  const w = parseFloat(weight);
  return !isNaN(w) && w >= 20 && w <= 500;
}
