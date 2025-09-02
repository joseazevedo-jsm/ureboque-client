# Logging and Sentry Integration Guide

This document explains how to use the logging and Sentry system in the Ureboque Driver app.

## Overview

The app uses a centralized logging system with multiple transports:
- **Console logging** (development)
- **File logging** (production)
- **Sentry reporting** (production errors and monitoring)

## Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Required
EXPO_PUBLIC_UREBOQUE_API=https://your-api-url.com
EXPO_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Optional
EXPO_PUBLIC_LOG_LEVEL=debug  # debug, info, warn, error, fatal
```

### EAS Build Configuration

For production builds, set the Sentry auth token as a secret:

```bash
# Using EAS CLI
eas secret:create --name SENTRY_AUTH_TOKEN --value your-auth-token

# Or via Expo Dashboard
# Go to your project settings and add SENTRY_AUTH_TOKEN as a secret
```

## Usage

### Basic Logging

```javascript
import { LoggerService } from '../services/LoggerService';

// Basic logging by namespace
LoggerService.debug('map', 'User location updated', { lat: 123, lng: 456 });
LoggerService.info('services', 'Service request received', serviceData);
LoggerService.warn('auth', 'Token expires soon');
LoggerService.error('api', 'Failed to fetch data', error);
LoggerService.fatal('app', 'Critical system failure', error);
```

### Specialized Logging Methods

```javascript
// API requests (automatically logged via interceptors)
LoggerService.apiRequest('POST', '/api/services', requestData);
LoggerService.apiResponse('POST', '/api/services', 200, responseData);
LoggerService.apiError('POST', '/api/services', error);

// Socket events
LoggerService.socketEvent('service_request', eventData);
LoggerService.socketError('connection_failed', error);

// Location tracking
LoggerService.locationUpdate(locationData);
LoggerService.locationError(error);

// Navigation
LoggerService.navigationAction('navigate', { screen: 'MapScreen' });

// Performance metrics
LoggerService.performanceMetric('api_response_time', 250, 'ms');

// Security events
LoggerService.securityEvent('unauthorized_access', { userId, endpoint });

// User interactions
LoggerService.userAction('button_click', { button: 'accept_service' });

// Critical driver workflow events
LoggerService.serviceRequest('service123', serviceDetails);
LoggerService.serviceAccepted('service123');
LoggerService.serviceCompleted('service123', 1800); // 30 minutes
```

### Using Namespaced Loggers

```javascript
import { loggers } from '../services/LoggerService';

// Use specific loggers for different app areas
loggers.auth.info('User logged in successfully');
loggers.map.debug('Map center changed', { lat, lng });
loggers.socket.error('Connection failed', error);
loggers.performance.warn('Slow API response', { duration: 5000 });
```

### Sentry Integration

The system automatically reports to Sentry:

```javascript
import SentryService from '../services/SentryService';

// Set user context (automatically done on login)
SentryService.setUserContext(user);

// Track driver-specific events
SentryService.trackDriverEvent('service_accepted', { serviceId });
SentryService.trackServiceFlow('REQUEST_RECEIVED', serviceId, data);
SentryService.trackLocationEvent('PERMISSION_GRANTED', data);

// Manual error reporting
SentryService.captureError(error, { context: 'additional_data' });
SentryService.captureCriticalError(error, { workflowStep: 'payment' });

// Performance monitoring
const transaction = SentryService.startTransaction('service_workflow', 'business_process');
// ... perform operations
transaction.finish();
```

## Available Namespaces

### Core App Namespaces
- `app` - General application events
- `auth` - Authentication and authorization
- `api` - API requests and responses
- `socket` - Socket.io events
- `location` - GPS and location services
- `navigation` - Screen navigation

### Feature-Specific Namespaces
- `map` - Map interactions and directions
- `services` - Service requests and management
- `notifications` - Push notifications
- `wallet` - Payment and earnings
- `profile` - User profile management

### System Namespaces
- `performance` - Performance metrics
- `security` - Security-related events
- `storage` - Local storage operations

## Production Features

### File Logging

In production, logs are saved to device storage:
- Location: `{DocumentDirectory}/logs/`
- Format: `ureboque-driver-YYYY-MM-DD.log`
- Rotation: 7 days (automatically cleaned)
- Size limit: 5MB per file

### Log Management

```javascript
// Clear old log files (automatically done on app start)
await LoggerService.clearOldLogs();

// Get available log files
const logFiles = await LoggerService.getLogFiles();

// Enable/disable debug mode
LoggerService.enableDebugMode();
LoggerService.disableDebugMode();
```

## Development Tools

### Debug Mode

```javascript
// In development, enable additional logging
if (__DEV__) {
  LoggerService.enableDebugMode();
  SentryService.enableDebugMode();
}
```

### Error Boundary Integration

The enhanced ErrorBoundary automatically:
- Logs errors with structured format
- Reports to Sentry with component stack
- Shows user-friendly error messages
- Preserves error context for debugging

## Best Practices

### When to Use Each Log Level

- **debug**: Detailed information for debugging (development only)
- **info**: General information about app flow
- **warn**: Something unexpected but not breaking
- **error**: Errors that affect functionality
- **fatal**: Critical errors that may crash the app

### Performance Considerations

- File logging only in production
- Console logging available in all environments
- Sentry reporting optimized for production
- Automatic log rotation prevents storage bloat

### Security

- Personal data is automatically filtered from Sentry
- Email addresses are masked in logs
- Authentication tokens are never logged
- Sensitive API responses are sanitized

### Driver Workflow Monitoring

The system automatically tracks key driver workflow events:
- Service request received/accepted/completed
- Location permission changes
- Payment processing
- Critical error conditions
- Performance bottlenecks

This provides comprehensive insight into driver app usage and helps identify issues quickly.

## Troubleshooting

### Common Issues

1. **Sentry not working**: Check DSN configuration and auth token
2. **File logs not created**: Verify file system permissions
3. **High log volume**: Adjust log levels in production
4. **Missing context**: Ensure user context is set after login

### Log Analysis

- Development: Check console output with color coding
- Production: Review Sentry dashboard for issues and performance
- File logs: Access via device file system for offline debugging

For more information, see the source code in `src/services/LoggerService.js` and `src/services/SentryService.js`.