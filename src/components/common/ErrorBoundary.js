import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import * as Sentry from '@sentry/react-native';
import ErrorService from '../../services/ErrorService';
import Logger from '../../utils/Logger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
    
    Logger.info('ErrorBoundary', 'Error boundary initialized');
  }

  static getDerivedStateFromError(error) {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    Logger.critical('ErrorBoundary', 'Error caught by boundary', { 
      error: error.message,
      errorId,
      type: 'error_boundary_triggered'
    });
    
    return { hasError: true, errorId };
  }

  componentDidCatch(error, errorInfo) {
    const errorId = this.state.errorId || `error_${Date.now()}`;
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Enhanced error logging with context
    Logger.critical('ErrorBoundary', 'Component error details', {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount,
      props: this.props.children?.props ? Object.keys(this.props.children.props) : 'no-props',
      timestamp: new Date().toISOString(),
      type: 'component_crash'
    });

    // Send component crash to Sentry with full context
    try {
      Sentry.captureException(error, {
        contexts: {
          errorBoundary: {
            errorId,
            componentStack: errorInfo.componentStack,
            retryCount: this.state.retryCount,
            props: this.props.children?.props ? Object.keys(this.props.children.props) : 'no-props',
            timestamp: new Date().toISOString(),
          },
          react: {
            componentStack: errorInfo.componentStack,
          }
        },
        tags: {
          errorBoundary: true,
          errorId: errorId,
          retryCount: this.state.retryCount.toString(),
        },
        fingerprint: [error.message, errorInfo.componentStack],
      });

      // Add breadcrumb for error boundary activation
      Sentry.addBreadcrumb({
        category: 'error',
        message: 'ErrorBoundary caught component crash',
        data: {
          errorId,
          errorMessage: error.message,
          retryCount: this.state.retryCount,
        },
        level: 'error',
      });
    } catch (sentryError) {
      Logger.error('ErrorBoundary', 'Failed to send crash to Sentry', { error: sentryError.message });
    }

    // Log component hierarchy for debugging
    Logger.debug('ErrorBoundary', 'Component hierarchy at error', {
      errorId,
      componentStack: errorInfo.componentStack,
      type: 'component_hierarchy'
    });

    // Use centralized error handling for additional processing
    ErrorService.handleAPIError(error, false, 'ErrorBoundary');
    
    // Log error recovery attempt
    Logger.warn('ErrorBoundary', 'Error boundary activated - showing fallback UI', {
      errorId,
      retryCount: this.state.retryCount
    });
  }

  handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1;
    const errorId = this.state.errorId;
    
    Logger.info('ErrorBoundary', 'User initiated error recovery', {
      errorId,
      retryCount: newRetryCount,
      type: 'error_recovery_attempt'
    });
    
    // Track error recovery attempt in Sentry
    try {
      Sentry.addBreadcrumb({
        category: 'user',
        message: 'Error recovery retry attempted',
        data: {
          errorId,
          retryCount: newRetryCount,
        },
        level: 'info',
      });

      // Set tag to track recovery success/failure
      Sentry.setTag('error_recovery_attempt', newRetryCount.toString());
    } catch (sentryError) {
      Logger.error('ErrorBoundary', 'Failed to track recovery in Sentry', { error: sentryError.message });
    }
    
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: newRetryCount
    });
    
    Logger.logUserInteraction('ErrorBoundary', 'retry_button_pressed', {
      errorId,
      retryCount: newRetryCount
    });
  };

  render() {
    if (this.state.hasError) {
      const { error, errorId, retryCount } = this.state;
      
      Logger.debug('ErrorBoundary', 'Rendering error fallback UI', {
        errorId,
        retryCount,
        hasErrorDetails: !!error
      });
      
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Oops! Something went wrong</Text>
          <Text style={styles.message}>
            We encountered an unexpected error. Please try again.
          </Text>
          {__DEV__ && (
            <Text style={styles.errorId}>Error ID: {errorId}</Text>
          )}
          <Button title="Try Again" onPress={this.handleRetry} />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorId: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 15,
  },
});

export default ErrorBoundary;