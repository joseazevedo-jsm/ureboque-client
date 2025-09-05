import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Sentry from '@sentry/react-native';
import sentryService from '../../services/SentryService';
import Logger from '../../utils/Logger';

const SentryTestComponent = () => {
  const testBasicError = () => {
    try {
      throw new Error('Test error from SentryTestComponent');
    } catch (error) {
      sentryService.captureError(error, {
        context: { component: 'SentryTestComponent', test: 'basic_error' }
      });
      Alert.alert('Success', 'Basic error sent to Sentry. Check your dashboard.');
      Logger.info('SentryTestComponent', 'Basic error test triggered', { test: 'basic_error' });
    }
  };

  const testCustomMessage = () => {
    sentryService.captureMessage(
      'Test message from Ureboque app',
      'info',
      { context: { component: 'SentryTestComponent', test: 'custom_message' } }
    );
    Alert.alert('Success', 'Custom message sent to Sentry. Check your dashboard.');
    Logger.info('SentryTestComponent', 'Custom message test triggered', { test: 'custom_message' });
  };

  const testBreadcrumbsAndContext = () => {
    // Test user action breadcrumb
    sentryService.addUserAction('test_breadcrumb_action', {
      component: 'SentryTestComponent',
      timestamp: new Date().toISOString()
    });

    // Test API call breadcrumb
    sentryService.addApiCall('GET', '/test-endpoint', 200, {
      testData: 'breadcrumb_test',
      duration: 150
    });

    // Test navigation breadcrumb
    sentryService.addNavigation('SentryTestComponent', 'TestScreen', {
      testMode: true
    });

    // Test context setting
    sentryService.setContext('test_context', {
      feature: 'sentry_testing',
      timestamp: new Date().toISOString(),
      testData: { a: 1, b: 2 }
    });

    Alert.alert('Success', 'Breadcrumbs and context added. Check Sentry dashboard.');
    Logger.info('SentryTestComponent', 'Breadcrumbs and context test triggered');
  };

  const testUserContext = () => {
    // Test setting user context
    sentryService.setUser({
      id: 'test-user-123',
      email: 'test@ureboque.com',
      username: 'Test User'
    });

    sentryService.addUserAction('user_context_test', {
      userId: 'test-user-123',
      action: 'context_set'
    });

    Alert.alert('Success', 'User context set. Check Sentry dashboard for user info.');
    Logger.info('SentryTestComponent', 'User context test triggered', { userId: 'test-user-123' });
  };

  const testLocationContext = () => {
    // Test location context
    const mockLocation = {
      latitude: -23.5505,
      longitude: -46.6333,
      accuracy: 10,
      timestamp: Date.now()
    };

    sentryService.setLocation(mockLocation);
    sentryService.addUserAction('location_context_test', {
      location: mockLocation
    });

    Alert.alert('Success', 'Location context set. Check Sentry dashboard.');
    Logger.info('SentryTestComponent', 'Location context test triggered', { location: mockLocation });
  };

  const testComponentCrash = () => {
    Alert.alert(
      'Component Crash Test',
      'This will crash the component to test ErrorBoundary + Sentry integration. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Crash', 
          style: 'destructive',
          onPress: () => {
            // This will cause a component crash that ErrorBoundary will catch
            throw new Error('Intentional component crash for testing ErrorBoundary + Sentry');
          }
        }
      ]
    );
  };

  const testPerformanceMonitoring = () => {
    const startTime = Date.now();
    
    // Simulate some work
    setTimeout(() => {
      const duration = Date.now() - startTime;
      
      Logger.logPerformance('SentryTestComponent', 'simulated_operation', startTime, Date.now(), {
        operation: 'test_performance',
        result: 'success'
      });

      sentryService.addUserAction('performance_test', {
        duration,
        operation: 'simulated_work'
      });

      Alert.alert('Success', `Performance test completed in ${duration}ms. Check Sentry.`);
    }, 100);
  };

  if (!__DEV__) {
    // Don't show test component in production
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sentry Integration Test</Text>
      <Text style={styles.subtitle}>Development Mode Only</Text>
      
      <TouchableOpacity style={[styles.button, styles.errorButton]} onPress={testBasicError}>
        <Text style={styles.buttonText}>Test Basic Error</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.messageButton]} onPress={testCustomMessage}>
        <Text style={styles.buttonText}>Test Custom Message</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.breadcrumbButton]} onPress={testBreadcrumbsAndContext}>
        <Text style={styles.buttonText}>Test Breadcrumbs & Context</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.userButton]} onPress={testUserContext}>
        <Text style={styles.buttonText}>Test User Context</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.locationButton]} onPress={testLocationContext}>
        <Text style={styles.buttonText}>Test Location Context</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.performanceButton]} onPress={testPerformanceMonitoring}>
        <Text style={styles.buttonText}>Test Performance</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.crashButton]} onPress={testComponentCrash}>
        <Text style={styles.buttonText}>⚠️ Test Component Crash</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 5,
    minWidth: 250,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorButton: {
    backgroundColor: '#DC3545',
  },
  messageButton: {
    backgroundColor: '#007AFF',
  },
  breadcrumbButton: {
    backgroundColor: '#28A745',
  },
  userButton: {
    backgroundColor: '#FD7E14',
  },
  locationButton: {
    backgroundColor: '#6F42C1',
  },
  performanceButton: {
    backgroundColor: '#20C997',
  },
  crashButton: {
    backgroundColor: '#6C757D',
    marginTop: 10,
  },
});

export default SentryTestComponent;