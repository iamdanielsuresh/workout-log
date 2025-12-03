/**
 * Locale-aware date and time formatting utilities
 * Used throughout the app for consistent date/time display
 */

/**
 * Format a date according to user's locale preferences
 * @param {Date|string} date - The date to format
 * @param {Object} options - Formatting options
 * @param {string} options.timezone - User's timezone
 * @param {string} options.country - User's country code
 * @param {string} options.format - 'short' | 'long' | 'relative'
 * @returns {string} Formatted date string
 */
export function formatDate(date, { timezone, country, format = 'short' } = {}) {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  const locale = getLocaleFromCountry(country);
  
  const options = {
    timeZone: timezone || undefined,
  };
  
  switch (format) {
    case 'long':
      options.weekday = 'long';
      options.year = 'numeric';
      options.month = 'long';
      options.day = 'numeric';
      break;
    case 'medium':
      options.weekday = 'short';
      options.month = 'short';
      options.day = 'numeric';
      break;
    case 'relative':
      return formatRelativeDate(dateObj, timezone);
    case 'short':
    default:
      options.year = 'numeric';
      options.month = 'short';
      options.day = 'numeric';
      break;
  }
  
  try {
    return dateObj.toLocaleDateString(locale, options);
  } catch {
    return dateObj.toLocaleDateString('en-US', options);
  }
}

/**
 * Format a time according to user's locale preferences
 * @param {Date|string} date - The date/time to format
 * @param {Object} options - Formatting options
 * @param {string} options.timezone - User's timezone
 * @param {string} options.country - User's country code
 * @param {boolean} options.includeSeconds - Whether to include seconds
 * @returns {string} Formatted time string
 */
export function formatTime(date, { timezone, country, includeSeconds = false } = {}) {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid time';
  }
  
  const locale = getLocaleFromCountry(country);
  
  const options = {
    timeZone: timezone || undefined,
    hour: 'numeric',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
  };
  
  try {
    return dateObj.toLocaleTimeString(locale, options);
  } catch {
    return dateObj.toLocaleTimeString('en-US', options);
  }
}

/**
 * Format a date and time together
 * @param {Date|string} date - The date/time to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date/time string
 */
export function formatDateTime(date, { timezone, country, format = 'short' } = {}) {
  const formattedDate = formatDate(date, { timezone, country, format });
  const formattedTime = formatTime(date, { timezone, country });
  return `${formattedDate} at ${formattedTime}`;
}

/**
 * Format a relative date (e.g., "today", "yesterday", "2 days ago")
 * @param {Date} date - The date to format
 * @param {string} timezone - User's timezone
 * @returns {string} Relative date string
 */
export function formatRelativeDate(date, timezone) {
  // Use Intl.DateTimeFormat for more reliable timezone handling
  let nowInTz, targetInTz;
  
  try {
    if (timezone) {
      // Get current date parts in the target timezone
      const nowFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      });
      const nowParts = nowFormatter.formatToParts(new Date());
      const nowDate = new Date(
        parseInt(nowParts.find(p => p.type === 'year')?.value || new Date().getFullYear()),
        parseInt(nowParts.find(p => p.type === 'month')?.value || 1) - 1,
        parseInt(nowParts.find(p => p.type === 'day')?.value || 1)
      );
      
      const targetParts = nowFormatter.formatToParts(date);
      const targetDate = new Date(
        parseInt(targetParts.find(p => p.type === 'year')?.value || date.getFullYear()),
        parseInt(targetParts.find(p => p.type === 'month')?.value || 1) - 1,
        parseInt(targetParts.find(p => p.type === 'day')?.value || 1)
      );
      
      nowInTz = nowDate;
      targetInTz = targetDate;
    } else {
      nowInTz = new Date();
      nowInTz.setHours(0, 0, 0, 0);
      targetInTz = new Date(date);
      targetInTz.setHours(0, 0, 0, 0);
    }
  } catch {
    // Fallback if timezone is invalid
    nowInTz = new Date();
    nowInTz.setHours(0, 0, 0, 0);
    targetInTz = new Date(date);
    targetInTz.setHours(0, 0, 0, 0);
  }
  
  const diffDays = Math.floor((nowInTz - targetInTz) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays === -1) return 'Tomorrow';
  if (diffDays > 1 && diffDays <= 7) return `${diffDays} days ago`;
  if (diffDays < -1 && diffDays >= -7) return `In ${Math.abs(diffDays)} days`;
  
  // For dates more than a week away, return formatted date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Get the current date/time context for AI prompts
 * @param {Object} options - User locale options
 * @returns {Object} Date/time context object
 */
export function getDateTimeContext({ timezone, country } = {}) {
  const now = new Date();
  const locale = getLocaleFromCountry(country);
  
  let userTime = now;
  if (timezone) {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      const parts = formatter.formatToParts(now);
      const partMap = {};
      parts.forEach(p => partMap[p.type] = p.value);
      
      return {
        localTime: formatTime(now, { timezone, country }),
        localDate: formatDate(now, { timezone, country }),
        dayOfWeek: partMap.weekday || now.toLocaleDateString('en-US', { weekday: 'long' }),
        timeOfDay: getTimeOfDay(parseInt(partMap.hour) || now.getHours()),
        timezone: timezone,
        currentTimestamp: now.toISOString(),
      };
    } catch (e) {
      // Fall through to default
    }
  }
  
  const hour = now.getHours();
  return {
    localTime: formatTime(now, { country }),
    localDate: formatDate(now, { country }),
    dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
    timeOfDay: getTimeOfDay(hour),
    timezone: timezone || 'local',
    currentTimestamp: now.toISOString(),
  };
}

/**
 * Get time of day label based on hour
 * @param {number} hour - Hour (0-23)
 * @returns {string} Time of day label
 */
function getTimeOfDay(hour) {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Interpret a relative date phrase like "today", "tomorrow", "this week"
 * @param {string} phrase - The phrase to interpret
 * @param {Object} options - User locale options
 * @returns {Object} Object with start and end dates
 */
export function interpretRelativeDate(phrase, { timezone } = {}) {
  const now = new Date();
  let localNow = now;
  
  if (timezone) {
    try {
      localNow = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    } catch {
      // Use system time
    }
  }
  
  const normalizedPhrase = phrase.toLowerCase().trim();
  
  // Today
  if (normalizedPhrase === 'today') {
    const start = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end, label: 'Today' };
  }
  
  // Tomorrow
  if (normalizedPhrase === 'tomorrow') {
    const start = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate() + 1);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end, label: 'Tomorrow' };
  }
  
  // Yesterday
  if (normalizedPhrase === 'yesterday') {
    const start = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate() - 1);
    const end = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate());
    return { start, end, label: 'Yesterday' };
  }
  
  // This week
  if (normalizedPhrase === 'this week') {
    const dayOfWeek = localNow.getDay();
    const start = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate() - dayOfWeek);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start, end, label: 'This Week' };
  }
  
  // Next week
  if (normalizedPhrase === 'next week') {
    const dayOfWeek = localNow.getDay();
    const start = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate() + (7 - dayOfWeek));
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start, end, label: 'Next Week' };
  }
  
  // Last week
  if (normalizedPhrase === 'last week') {
    const dayOfWeek = localNow.getDay();
    const start = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate() - dayOfWeek - 7);
    const end = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate() - dayOfWeek);
    return { start, end, label: 'Last Week' };
  }
  
  // This month
  if (normalizedPhrase === 'this month') {
    const start = new Date(localNow.getFullYear(), localNow.getMonth(), 1);
    const end = new Date(localNow.getFullYear(), localNow.getMonth() + 1, 1);
    return { start, end, label: 'This Month' };
  }
  
  return null;
}

/**
 * Format a duration in seconds to a human-readable string
 * @param {number} seconds - Duration in seconds
 * @param {string} format - 'short' | 'long'
 * @returns {string} Formatted duration
 */
export function formatDuration(seconds, format = 'short') {
  if (!seconds || seconds < 0) return format === 'long' ? '0 minutes' : '0 min';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (format === 'long') {
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
}

/**
 * Get locale string from country code
 * @param {string} countryCode - ISO country code
 * @returns {string} Locale string
 */
function getLocaleFromCountry(countryCode) {
  const localeMap = {
    'US': 'en-US',
    'GB': 'en-GB',
    'CA': 'en-CA',
    'AU': 'en-AU',
    'DE': 'de-DE',
    'FR': 'fr-FR',
    'ES': 'es-ES',
    'IT': 'it-IT',
    'JP': 'ja-JP',
    'KR': 'ko-KR',
    'CN': 'zh-CN',
    'IN': 'en-IN',
    'BR': 'pt-BR',
    'MX': 'es-MX',
    'NL': 'nl-NL',
    'SE': 'sv-SE',
    'NO': 'nb-NO',
    'DK': 'da-DK',
    'FI': 'fi-FI',
    'PL': 'pl-PL',
    'RU': 'ru-RU',
    'NZ': 'en-NZ',
    'SG': 'en-SG',
    'AE': 'ar-AE',
    'ZA': 'en-ZA',
    'PT': 'pt-PT',
    'AT': 'de-AT',
    'CH': 'de-CH',
    'BE': 'nl-BE',
    'IE': 'en-IE',
  };
  
  return localeMap[countryCode] || 'en-US';
}

export { getLocaleFromCountry };
