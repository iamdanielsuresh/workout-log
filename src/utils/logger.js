/**
 * Logger utility - only logs in development mode
 * In production, logs are silently ignored
 */

const isDev = import.meta.env.DEV;

/**
 * Development logger - logs only in development mode
 */
export const logger = {
  /**
   * Log informational messages (development only)
   */
  log: (...args) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Log error messages (always logs, but can be sent to error service in production)
   */
  error: (...args) => {
    if (isDev) {
      console.error(...args);
    } else {
      // In production, you could send to an error reporting service
      // errorReportingService.captureMessage(args.join(' '));
    }
  },

  /**
   * Log warning messages (development only)
   */
  warn: (...args) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Log debug messages with a prefix (development only)
   */
  debug: (prefix, ...args) => {
    if (isDev) {
      console.log(`[${prefix}]`, ...args);
    }
  },

  /**
   * Log grouped messages (development only)
   */
  group: (label, fn) => {
    if (isDev) {
      console.group(label);
      fn();
      console.groupEnd();
    }
  },

  /**
   * Log table data (development only)
   */
  table: (data) => {
    if (isDev) {
      console.table(data);
    }
  }
};

/**
 * Create a scoped logger with a prefix
 */
export function createLogger(scope) {
  return {
    log: (...args) => logger.debug(scope, ...args),
    error: (...args) => logger.error(`[${scope}]`, ...args),
    warn: (...args) => logger.warn(`[${scope}]`, ...args),
  };
}

export default logger;
