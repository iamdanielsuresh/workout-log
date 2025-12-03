/**
 * AI Client Configuration Helper
 * 
 * Centralized module for AI configuration that all AI features share.
 * Provides consistent access to API key, model settings, and enabled status.
 */

// Default model configuration
const AI_CONFIG = {
  model: 'gemini-2.0-flash',
  apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
  defaultTemperature: 0.7,
  maxOutputTokens: 8192,
};

/**
 * Get the full API URL for a specific model
 * @param {string} model - Model name (default: gemini-2.0-flash)
 * @returns {string} Full API URL
 */
export function getApiUrl(model = AI_CONFIG.model) {
  return `${AI_CONFIG.apiEndpoint}/${model}:generateContent`;
}

/**
 * Get AI client configuration
 * Returns all settings needed for AI features to operate
 * 
 * @param {Object} options
 * @param {boolean} options.aiEnabled - Whether AI is enabled in settings
 * @param {string|null} options.apiKey - Google AI API key
 * @returns {Object} AI configuration object
 */
export function getAiClientConfig({ aiEnabled = false, apiKey = null } = {}) {
  const isConfigured = !!(aiEnabled && apiKey && apiKey.startsWith('AIza'));
  
  return {
    // Core settings
    enabled: aiEnabled,
    apiKey: apiKey,
    model: AI_CONFIG.model,
    
    // Computed states
    isConfigured,        // True only if enabled AND valid key present
    canMakeRequests: isConfigured,
    
    // Request configuration
    apiUrl: getApiUrl(),
    temperature: AI_CONFIG.defaultTemperature,
    maxOutputTokens: AI_CONFIG.maxOutputTokens,
    
    // Helper methods
    getRequestBody: (prompt, options = {}) => ({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options.temperature || AI_CONFIG.defaultTemperature,
        maxOutputTokens: options.maxOutputTokens || AI_CONFIG.maxOutputTokens,
      }
    }),
  };
}

/**
 * Check if AI features should be available
 * Used by components to determine if AI buttons should be enabled
 * 
 * @param {Object} options
 * @param {boolean} options.aiEnabled - Whether AI is enabled in settings
 * @param {string|null} options.apiKey - Google AI API key
 * @returns {Object} Availability status with reason
 */
export function checkAiAvailability({ aiEnabled = false, apiKey = null } = {}) {
  if (!aiEnabled) {
    return {
      available: false,
      reason: 'AI features are disabled',
      reasonCode: 'DISABLED',
    };
  }
  
  if (!apiKey) {
    return {
      available: false,
      reason: 'API key not configured',
      reasonCode: 'NO_KEY',
    };
  }
  
  if (!apiKey.startsWith('AIza') || apiKey.length < 20) {
    return {
      available: false,
      reason: 'Invalid API key format',
      reasonCode: 'INVALID_KEY',
    };
  }
  
  return {
    available: true,
    reason: null,
    reasonCode: null,
  };
}

/**
 * Build user profile string for AI prompts
 * Creates a consistent description of the user for personalization
 * 
 * @param {Object} profile - User profile data
 * @returns {string} Formatted profile string
 */
export function buildUserProfileString(profile) {
  if (!profile) return 'a fitness enthusiast';
  
  const parts = [];
  
  // Add experience level
  if (profile.experience_level) {
    parts.push(`${profile.experience_level} level`);
  }
  
  // Add age if available
  if (profile.age) {
    parts.push(`${profile.age} years old`);
  }
  
  // Add name context
  const name = profile.display_name || profile.name;
  if (name) {
    parts.push(`named ${name}`);
  }
  
  if (parts.length === 0) {
    return 'a fitness enthusiast';
  }
  
  return `a ${parts.join(', ')} lifter`;
}

/**
 * Get AI feature status message for UI display
 * Provides user-friendly messages about AI availability
 * 
 * @param {Object} options
 * @param {boolean} options.aiEnabled
 * @param {string|null} options.apiKey
 * @returns {Object} Status with message and type
 */
export function getAiStatusMessage({ aiEnabled = false, apiKey = null } = {}) {
  const availability = checkAiAvailability({ aiEnabled, apiKey });
  
  if (availability.available) {
    return {
      message: 'AI features are ready',
      type: 'success',
      icon: 'check',
    };
  }
  
  switch (availability.reasonCode) {
    case 'DISABLED':
      return {
        message: 'Enable AI in Settings to use this feature',
        type: 'info',
        icon: 'info',
      };
    case 'NO_KEY':
      return {
        message: 'Add your API key in Settings',
        type: 'warning',
        icon: 'key',
      };
    case 'INVALID_KEY':
      return {
        message: 'Check your API key in Settings',
        type: 'error',
        icon: 'alert',
      };
    default:
      return {
        message: 'AI features unavailable',
        type: 'error',
        icon: 'alert',
      };
  }
}

export default {
  getAiClientConfig,
  checkAiAvailability,
  buildUserProfileString,
  getAiStatusMessage,
  getApiUrl,
  AI_CONFIG,
};
