import * as Sentry from '@sentry/react-native';

const REDACTED = '[REDACTED]';
const SENSITIVE_KEY_PATTERN = /(password|pass|token|authorization|jwt|secret|otp|code|phone|email|mail|latitude|longitude|location|coordinates|address|card|payment|message|chat|name|surname|photo|image|document|license)/i;
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const BEARER_PATTERN = /Bearer\s+[A-Za-z0-9._~+/=-]+/gi;
const LONG_TOKEN_PATTERN = /\b[A-Za-z0-9_-]{24,}\b/g;
const PHONE_PATTERN = /(\+?\d[\d\s().-]{7,}\d)/g;

const redactString = (value) => (
  value
    .slice(0, 500)
    .replace(EMAIL_PATTERN, REDACTED)
    .replace(BEARER_PATTERN, REDACTED)
    .replace(PHONE_PATTERN, REDACTED)
    .replace(LONG_TOKEN_PATTERN, REDACTED)
);

const sanitize = (value, depth = 0) => {
  if (value === null || value === undefined) return value;
  if (depth > 4) return '[MAX_DEPTH]';
  if (typeof value === 'string') return redactString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => sanitize(item, depth + 1));
  if (typeof value === 'object') {
    return Object.entries(value).slice(0, 30).reduce((acc, [key, childValue]) => {
      acc[key] = SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : sanitize(childValue, depth + 1);
      return acc;
    }, {});
  }
  return String(value);
};

export const sentryService = {
  setUser: (user) => {
    if (user) {
      Sentry.setUser({ id: user.id || user.userId });
    } else {
      Sentry.setUser(null);
    }
  },

  setLocation: (location) => {
    if (location) {
      Sentry.setContext('location', {
        available: true,
        hasAccuracy: !!location.accuracy,
        timestamp: location.timestamp,
      });
    }
  },

  addUserAction: (action, data = {}) => {
    Sentry.addBreadcrumb({
      category: 'user',
      message: sanitize(action),
      data: sanitize(data),
      level: 'info',
    });
  },

  addNavigation: (from, to, data = {}) => {
    Sentry.addBreadcrumb({
      category: 'navigation',
      message: `${sanitize(from)} -> ${sanitize(to)}`,
      data: sanitize(data),
      level: 'info',
    });
  },

  addApiCall: (method, url, statusCode, data = {}) => {
    Sentry.addBreadcrumb({
      category: 'api',
      message: `${method} ${sanitize(url)}`,
      data: {
        ...sanitize(data),
        statusCode,
        url: sanitize(url),
        method,
      },
      level: statusCode >= 400 ? 'error' : 'info',
    });
  },

  addSocketEvent: (event, data = {}) => {
    Sentry.addBreadcrumb({
      category: 'socket',
      message: `Socket: ${sanitize(event)}`,
      data: sanitize(data),
      level: 'info',
    });
  },

  captureError: (error, context = {}, tags = {}) => {
    Sentry.captureException(error, {
      contexts: sanitize(context),
      tags: {
        ...tags,
        environment: __DEV__ ? 'development' : 'production',
      },
    });
  },

  captureMessage: (message, level = 'info', context = {}, tags = {}) => {
    Sentry.captureMessage(sanitize(message), level, {
      contexts: sanitize(context),
      data: sanitize(context),
      tags: {
        ...tags,
        environment: __DEV__ ? 'development' : 'production',
      },
    });
  },

  setTag: (key, value) => {
    Sentry.setTag(key, sanitize(value));
  },

  setContext: (name, context) => {
    Sentry.setContext(name, sanitize(context));
  },

  setExtra: (key, value) => {
    Sentry.setExtra(key, sanitize(value));
  },
};

export default sentryService;
