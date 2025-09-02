/**
 * useLogger Hook
 * Simple React hook for component-specific logging
 */

import { useMemo } from 'react';
import Logger from '../utils/Logger';

/**
 * Hook for component-specific logging
 * @param {string} componentName - Name of the component using the logger
 * @returns {object} - Logger methods scoped to the component
 */
export const useLogger = (componentName) => {
  // Create component-scoped logger methods
  const componentLogger = useMemo(() => ({
    debug: (message, data) => {
      Logger.debug(componentName, message, data);
    },
    
    info: (message, data) => {
      Logger.info(componentName, message, data);
    },
    
    warn: (message, data) => {
      Logger.warn(componentName, message, data);
    },
    
    error: (message, data) => {
      Logger.error(componentName, message, data);
    },
    
    critical: (message, data) => {
      Logger.critical(componentName, message, data);
    },
    
    // Enhanced methods for complex logging
    startTimer: (operation) => {
      const startTime = Date.now();
      return {
        end: () => Date.now() - startTime
      };
    },
    
    logApiRequest: (method, url, data) => {
      Logger.logApiRequest(componentName, method, url, data);
    },
    
    logApiResponse: (method, url, status, responseData, duration) => {
      Logger.logApiResponse(componentName, method, url, status, responseData, duration);
    },
    
    logUserInteraction: (action, details) => {
      Logger.logUserInteraction(componentName, action, details);
    },
    
    logNavigation: (from, to, params) => {
      Logger.logNavigation(from, to, params);
    },
    
    logStateChange: (property, fromValue, toValue, reason) => {
      Logger.debug(componentName, `State change: ${property}`, {
        from: fromValue,
        to: toValue,
        reason,
        type: 'state_change'
      });
    },
    
    logError: (error, context) => {
      Logger.error(componentName, 'Operation error', { error, ...context });
    }
  }), [componentName]);

  return componentLogger;
};

export default useLogger;