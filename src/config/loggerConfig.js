/**
 * Logger Configuration for Ureboque Client
 */

// Default configuration for different environments
export const LOGGER_CONFIG = {
  development: {
    minLevel: 'DEBUG',
    enableConsole: true,
  },
  
  production: {
    minLevel: 'ERROR',
    enableConsole: true,
  }
};

// Get configuration based on environment
export const getLoggerConfig = () => {
  return __DEV__ ? LOGGER_CONFIG.development : LOGGER_CONFIG.production;
};

/**
 * Check if a component should log at a specific level
 */
export const shouldComponentLog = (component, level) => {
  const config = getLoggerConfig();
  const LOG_LEVEL_HIERARCHY = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    CRITICAL: 4
  };
  
  const minLevelValue = LOG_LEVEL_HIERARCHY[config.minLevel] || 0;
  const requestedLevelValue = LOG_LEVEL_HIERARCHY[level] || 0;
  
  return requestedLevelValue >= minLevelValue;
};