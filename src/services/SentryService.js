import * as Sentry from '@sentry/react-native';

// Sentry utility functions for common operations
export const sentryService = {
  // Set user context
  setUser: (user) => {
    if (user) {
      Sentry.setUser({
        id: user.id || user.userId,
        email: user.email,
        username: user.name || user.username,
        // Add any other user properties you want to track
      });
    } else {
      Sentry.setUser(null);
    }
  },

  // Set user location context
  setLocation: (location) => {
    if (location) {
      Sentry.setContext('location', {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: location.timestamp,
      });
    }
  },

  // Add breadcrumb for user actions
  addUserAction: (action, data = {}) => {
    Sentry.addBreadcrumb({
      category: 'user',
      message: action,
      data: data,
      level: 'info',
    });
  },

  // Add breadcrumb for navigation
  addNavigation: (from, to, data = {}) => {
    Sentry.addBreadcrumb({
      category: 'navigation',
      message: `${from} → ${to}`,
      data: data,
      level: 'info',
    });
  },

  // Add breadcrumb for API calls
  addApiCall: (method, url, statusCode, data = {}) => {
    Sentry.addBreadcrumb({
      category: 'api',
      message: `${method} ${url}`,
      data: {
        ...data,
        statusCode,
        url,
        method,
      },
      level: statusCode >= 400 ? 'error' : 'info',
    });
  },

  // Add breadcrumb for socket events
  addSocketEvent: (event, data = {}) => {
    Sentry.addBreadcrumb({
      category: 'socket',
      message: `Socket: ${event}`,
      data: data,
      level: 'info',
    });
  },

  // Capture error with context
  captureError: (error, context = {}, tags = {}) => {
    Sentry.captureException(error, {
      contexts: context,
      tags: {
        ...tags,
        environment: __DEV__ ? 'development' : 'production',
      },
    });
  },

  // Capture message with context
  captureMessage: (message, level = 'info', context = {}, tags = {}) => {
    Sentry.captureMessage(message, level, {
      contexts: context,
      data: context,
      tags: {
        ...tags,
        environment: __DEV__ ? 'development' : 'production',
      },
    });
  },

  // Set tag
  setTag: (key, value) => {
    Sentry.setTag(key, value);
  },

  // Set context
  setContext: (name, context) => {
    Sentry.setContext(name, context);
  },

  // Set extra data
  setExtra: (key, value) => {
    Sentry.setExtra(key, value);
  },
};

export default sentryService;