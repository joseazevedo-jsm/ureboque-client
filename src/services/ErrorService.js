import Logger from '../utils/Logger';

class ErrorService {
  static handleAPIError(error, showToUser = true, component = 'Unknown') {
    const errorMessage = this.getErrorMessage(error);
    
    // Enhanced logging with structured data
    Logger.logApiResponse(
      component,
      error.config?.method?.toUpperCase() || 'UNKNOWN',
      error.config?.url || 'unknown-url',
      error.response?.status || 0,
      {
        message: errorMessage,
        errorType: this.getErrorType(error),
        requestData: error.config?.data ? '[REQUEST_DATA]' : null,
        responseData: error.response?.data ? '[RESPONSE_DATA]' : null
      },
      null // duration not available here
    );

    // Additional error context logging
    Logger.error('ErrorService', 'API Error Details', {
      message: errorMessage,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      component,
      stack: error.stack,
      type: 'api_error'
    });

    // Show user-friendly message
    if (showToUser) {
      this.showUserError(errorMessage);
    }

    return errorMessage;
  }

  static getErrorMessage(error) {
    if (error.response) {
      // Server responded with error status
      switch (error.response.status) {
        case 401:
          return 'Session expired. Please log in again.';
        case 403:
          return 'You do not have permission to perform this action.';
        case 404:
          return 'The requested resource was not found.';
        case 500:
          return 'Server error. Please try again later.';
        default:
          return error.response.data?.message || 'An unexpected error occurred.';
      }
    } else if (error.request) {
      // Network error
      return 'Network error. Please check your connection.';
    } else {
      // Other error
      return error.message || 'An unexpected error occurred.';
    }
  }

  static getErrorType(error) {
    if (error.response) {
      return 'server_error';
    } else if (error.request) {
      return 'network_error';
    } else {
      return 'client_error';
    }
  }

  static showUserError(message) {
    // Import Alert from react-native at the top of file for this to work
    const { Alert } = require('react-native');
    
    Logger.warn('ErrorService', 'Showing user error dialog', { message });
    
    // Show user-visible error alert
    Alert.alert(
      'Erro',
      message,
      [
        {
          text: 'OK',
          style: 'default'
        }
      ],
      { cancelable: true }
    );
    
    Logger.logUserInteraction('ErrorService', 'error_dialog_shown', { message });
  }

  static logGeneralError(component, error, context = {}) {
    Logger.error(component, `General Error: ${error.message || error}`, {
      error: error.message || error,
      stack: error.stack,
      context,
      type: 'general_error'
    });
  }
}

export default ErrorService;