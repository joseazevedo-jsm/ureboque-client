/**
 * Logger System for Ureboque Client
 * Provides structured logging with environment-aware behavior
 */

// Log levels with priority values
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4
};

// Colors for console output (development only)
const LOG_COLORS = {
  DEBUG: '\x1b[36m',    // Cyan
  INFO: '\x1b[32m',     // Green
  WARN: '\x1b[33m',     // Yellow
  ERROR: '\x1b[31m',    // Red
  CRITICAL: '\x1b[35m', // Magenta
  RESET: '\x1b[0m'      // Reset
};

class Logger {
  constructor() {
    this.isDevelopment = __DEV__;
    this.minLogLevel = this.isDevelopment ? LOG_LEVELS.DEBUG : LOG_LEVELS.ERROR;
    this.logBuffer = [];
    this.maxBufferSize = 100;
  }

  /**
   * Set minimum log level
   * @param {string} level - Log level (DEBUG, INFO, WARN, ERROR, CRITICAL)
   */
  setLogLevel(level) {
    if (LOG_LEVELS.hasOwnProperty(level)) {
      this.minLogLevel = LOG_LEVELS[level];
    }
  }

  /**
   * Check if a log level should be processed
   * @param {string} level - Log level to check
   * @returns {boolean} - Should log
   */
  shouldLog(level) {
    return LOG_LEVELS[level] >= this.minLogLevel;
  }

  /**
   * Format log message with metadata
   * @param {string} level - Log level
   * @param {string} component - Component name
   * @param {string} message - Log message
   * @param {any} data - Additional data
   * @returns {object} - Formatted log entry
   */
  formatLogEntry(level, component, message, data = null) {
    const timestamp = new Date().toISOString();
    const entry = {
      timestamp,
      level,
      component,
      message,
      data,
      session: this.getSessionId()
    };

    return entry;
  }

  /**
   * Get or create session ID for tracking
   * @returns {string} - Session identifier
   */
  getSessionId() {
    if (!this.sessionId) {
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return this.sessionId;
  }

  /**
   * Core logging method
   * @param {string} level - Log level
   * @param {string} component - Component name
   * @param {string} message - Log message
   * @param {any} data - Additional data
   */
  log(level, component, message, data = null) {
    if (!this.shouldLog(level)) return;

    const logEntry = this.formatLogEntry(level, component, message, data);
    
    // Add to buffer for potential remote logging
    this.addToBuffer(logEntry);
    
    // Console output
    this.outputToConsole(logEntry);
  }

  /**
   * Add log entry to buffer
   * @param {object} logEntry - Formatted log entry
   */
  addToBuffer(logEntry) {
    this.logBuffer.push(logEntry);
    
    // Maintain buffer size
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }
  }

  /**
   * Output log to console with formatting
   * @param {object} logEntry - Formatted log entry
   */
  outputToConsole(logEntry) {
    const { level, component, message, data, timestamp } = logEntry;
    
    if (this.isDevelopment) {
      const color = LOG_COLORS[level] || LOG_COLORS.RESET;
      const resetColor = LOG_COLORS.RESET;
      const timeStr = new Date(timestamp).toLocaleTimeString();
      
      console.log(
        `${color}[${level}]${resetColor} ${timeStr} [${component}] ${message}`,
        data ? data : ''
      );
    } else {
      // Production: simpler format, errors only
      if (LOG_LEVELS[level] >= LOG_LEVELS.ERROR) {
        console.error(`[${level}] [${component}] ${message}`, data || '');
      }
    }
  }

  /**
   * Debug level logging
   * @param {string} component - Component name
   * @param {string} message - Log message
   * @param {any} data - Additional data
   */
  debug(component, message, data) {
    this.log('DEBUG', component, message, data);
  }

  /**
   * Info level logging
   * @param {string} component - Component name
   * @param {string} message - Log message
   * @param {any} data - Additional data
   */
  info(component, message, data) {
    this.log('INFO', component, message, data);
  }

  /**
   * Warning level logging
   * @param {string} component - Component name
   * @param {string} message - Log message
   * @param {any} data - Additional data
   */
  warn(component, message, data) {
    this.log('WARN', component, message, data);
  }

  /**
   * Error level logging
   * @param {string} component - Component name
   * @param {string} message - Log message
   * @param {any} data - Additional data
   */
  error(component, message, data) {
    this.log('ERROR', component, message, data);
  }

  /**
   * Critical level logging
   * @param {string} component - Component name
   * @param {string} message - Log message
   * @param {any} data - Additional data
   */
  critical(component, message, data) {
    this.log('CRITICAL', component, message, data);
  }

  /**
   * Log API request
   * @param {string} component - Component making the request
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {any} requestData - Request payload
   */
  logApiRequest(component, method, url, requestData = null) {
    this.info(component, `API Request: ${method} ${url}`, {
      method,
      url,
      data: requestData,
      type: 'api_request'
    });
  }

  /**
   * Log API response
   * @param {string} component - Component receiving the response
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {number} status - Response status
   * @param {any} responseData - Response data
   * @param {number} duration - Request duration in ms
   */
  logApiResponse(component, method, url, status, responseData = null, duration = null) {
    const level = status >= 400 ? 'ERROR' : 'INFO';
    this.log(level, component, `API Response: ${method} ${url} - ${status}`, {
      method,
      url,
      status,
      data: responseData,
      duration,
      type: 'api_response'
    });
  }

  /**
   * Log user interaction
   * @param {string} component - Component where interaction occurred
   * @param {string} action - Action performed
   * @param {any} details - Additional details
   */
  logUserInteraction(component, action, details = null) {
    this.info(component, `User Interaction: ${action}`, {
      action,
      details,
      type: 'user_interaction'
    });
  }

  /**
   * Log navigation event
   * @param {string} from - Source screen
   * @param {string} to - Destination screen
   * @param {any} params - Navigation parameters
   */
  logNavigation(from, to, params = null) {
    this.info('Navigation', `Navigate: ${from} -> ${to}`, {
      from,
      to,
      params,
      type: 'navigation'
    });
  }

  /**
   * Log component lifecycle event
   * @param {string} component - Component name
   * @param {string} event - Lifecycle event (mount, unmount, update)
   * @param {any} details - Additional details
   */
  logLifecycle(component, event, details = null) {
    this.debug(component, `Lifecycle: ${event}`, {
      event,
      details,
      type: 'lifecycle'
    });
  }

  /**
   * Get log buffer (for potential remote sending)
   * @returns {Array} - Array of log entries
   */
  getLogBuffer() {
    return [...this.logBuffer];
  }

  /**
   * Clear log buffer
   */
  clearLogBuffer() {
    this.logBuffer = [];
  }

  /**
   * Log performance metrics
   * @param {string} component - Component name
   * @param {string} operation - Operation being measured
   * @param {number} startTime - Start timestamp
   * @param {number} endTime - End timestamp
   * @param {any} details - Additional details
   */
  logPerformance(component, operation, startTime, endTime, details = null) {
    const duration = endTime - startTime;
    this.debug(component, `Performance: ${operation} took ${duration}ms`, {
      operation,
      duration,
      startTime,
      endTime,
      details,
      type: 'performance'
    });
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;