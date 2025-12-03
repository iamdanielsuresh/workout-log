/**
 * Countries and Timezones for user profile
 * Used for AI locale awareness
 */

export const COUNTRIES = [
  { code: 'US', name: 'United States', timezone: 'America/New_York' },
  { code: 'GB', name: 'United Kingdom', timezone: 'Europe/London' },
  { code: 'CA', name: 'Canada', timezone: 'America/Toronto' },
  { code: 'AU', name: 'Australia', timezone: 'Australia/Sydney' },
  { code: 'DE', name: 'Germany', timezone: 'Europe/Berlin' },
  { code: 'FR', name: 'France', timezone: 'Europe/Paris' },
  { code: 'ES', name: 'Spain', timezone: 'Europe/Madrid' },
  { code: 'IT', name: 'Italy', timezone: 'Europe/Rome' },
  { code: 'JP', name: 'Japan', timezone: 'Asia/Tokyo' },
  { code: 'KR', name: 'South Korea', timezone: 'Asia/Seoul' },
  { code: 'CN', name: 'China', timezone: 'Asia/Shanghai' },
  { code: 'IN', name: 'India', timezone: 'Asia/Kolkata' },
  { code: 'BR', name: 'Brazil', timezone: 'America/Sao_Paulo' },
  { code: 'MX', name: 'Mexico', timezone: 'America/Mexico_City' },
  { code: 'NL', name: 'Netherlands', timezone: 'Europe/Amsterdam' },
  { code: 'SE', name: 'Sweden', timezone: 'Europe/Stockholm' },
  { code: 'NO', name: 'Norway', timezone: 'Europe/Oslo' },
  { code: 'DK', name: 'Denmark', timezone: 'Europe/Copenhagen' },
  { code: 'FI', name: 'Finland', timezone: 'Europe/Helsinki' },
  { code: 'PL', name: 'Poland', timezone: 'Europe/Warsaw' },
  { code: 'RU', name: 'Russia', timezone: 'Europe/Moscow' },
  { code: 'NZ', name: 'New Zealand', timezone: 'Pacific/Auckland' },
  { code: 'SG', name: 'Singapore', timezone: 'Asia/Singapore' },
  { code: 'AE', name: 'United Arab Emirates', timezone: 'Asia/Dubai' },
  { code: 'ZA', name: 'South Africa', timezone: 'Africa/Johannesburg' },
  { code: 'PT', name: 'Portugal', timezone: 'Europe/Lisbon' },
  { code: 'AT', name: 'Austria', timezone: 'Europe/Vienna' },
  { code: 'CH', name: 'Switzerland', timezone: 'Europe/Zurich' },
  { code: 'BE', name: 'Belgium', timezone: 'Europe/Brussels' },
  { code: 'IE', name: 'Ireland', timezone: 'Europe/Dublin' },
];

/**
 * Common timezones grouped by region
 */
export const TIMEZONES = [
  // Americas
  { value: 'America/New_York', label: 'Eastern Time (US)', region: 'Americas' },
  { value: 'America/Chicago', label: 'Central Time (US)', region: 'Americas' },
  { value: 'America/Denver', label: 'Mountain Time (US)', region: 'Americas' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)', region: 'Americas' },
  { value: 'America/Toronto', label: 'Toronto', region: 'Americas' },
  { value: 'America/Vancouver', label: 'Vancouver', region: 'Americas' },
  { value: 'America/Mexico_City', label: 'Mexico City', region: 'Americas' },
  { value: 'America/Sao_Paulo', label: 'São Paulo', region: 'Americas' },
  
  // Europe
  { value: 'Europe/London', label: 'London', region: 'Europe' },
  { value: 'Europe/Paris', label: 'Paris', region: 'Europe' },
  { value: 'Europe/Berlin', label: 'Berlin', region: 'Europe' },
  { value: 'Europe/Rome', label: 'Rome', region: 'Europe' },
  { value: 'Europe/Madrid', label: 'Madrid', region: 'Europe' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam', region: 'Europe' },
  { value: 'Europe/Moscow', label: 'Moscow', region: 'Europe' },
  
  // Asia Pacific
  { value: 'Asia/Tokyo', label: 'Tokyo', region: 'Asia/Pacific' },
  { value: 'Asia/Shanghai', label: 'Shanghai', region: 'Asia/Pacific' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong', region: 'Asia/Pacific' },
  { value: 'Asia/Singapore', label: 'Singapore', region: 'Asia/Pacific' },
  { value: 'Asia/Seoul', label: 'Seoul', region: 'Asia/Pacific' },
  { value: 'Asia/Kolkata', label: 'Mumbai/Kolkata', region: 'Asia/Pacific' },
  { value: 'Asia/Dubai', label: 'Dubai', region: 'Asia/Pacific' },
  { value: 'Australia/Sydney', label: 'Sydney', region: 'Asia/Pacific' },
  { value: 'Australia/Melbourne', label: 'Melbourne', region: 'Asia/Pacific' },
  { value: 'Pacific/Auckland', label: 'Auckland', region: 'Asia/Pacific' },
  
  // Africa
  { value: 'Africa/Johannesburg', label: 'Johannesburg', region: 'Africa' },
  { value: 'Africa/Cairo', label: 'Cairo', region: 'Africa' },
];

/**
 * Get the default timezone for a country
 */
export function getDefaultTimezone(countryCode) {
  const country = COUNTRIES.find(c => c.code === countryCode);
  return country?.timezone || 'UTC';
}

/**
 * Get country info by code
 */
export function getCountryByCode(countryCode) {
  return COUNTRIES.find(c => c.code === countryCode);
}

/**
 * Detect user's timezone from browser
 */
export function detectUserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/**
 * Detect user's country from timezone (best effort)
 */
export function detectCountryFromTimezone(timezone) {
  const country = COUNTRIES.find(c => c.timezone === timezone);
  return country?.code || null;
}
