import Logger from '../utils/Logger';
import sentryService from './SentryService';

class ErrorService {
  static _showAlert = null;

  static setAlertHandler(handler) {
    ErrorService._showAlert = handler;
  }

  static handleAPIError(error, showToUser = true, component = 'Unknown') {
    const errorMessage = this.getErrorMessage(error);
    const errorType = this.getErrorType(error);
    
    // Enhanced logging with structured data
    Logger.logApiResponse(
      component,
      error.config?.method?.toUpperCase() || 'UNKNOWN',
      error.config?.url || 'unknown-url',
      error.response?.status || 0,
      {
        message: errorMessage,
        errorType: errorType,
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

    // Send comprehensive error data to Sentry
    try {
      sentryService.captureError(error, {
        api: {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          errorType: errorType,
          component: component,
          userMessage: errorMessage
        },
        request: {
          hasData: !!error.config?.data,
          headers: error.config?.headers ? Object.keys(error.config.headers) : [],
        },
        response: {
          hasData: !!error.response?.data,
          statusText: error.response?.statusText
        }
      }, {
        error_service: true,
        api_error: true,
        error_type: errorType,
        status_code: error.response?.status?.toString(),
        component: component
      });

      // Add API error breadcrumb
      sentryService.addApiCall(
        error.config?.method?.toUpperCase() || 'UNKNOWN',
        error.config?.url || 'unknown-url',
        error.response?.status || 0,
        {
          errorMessage,
          errorType,
          component,
          showToUser
        }
      );
    } catch (sentryError) {
      Logger.warn('ErrorService', 'Failed to send API error to Sentry', { 
        sentryError: sentryError.message 
      });
    }

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
          return 'A sua sessão expirou. Inicie sessão novamente.';
        case 403:
          return 'Não tem permissão para realizar esta ação.';
        case 404:
          return 'O recurso solicitado não foi encontrado.';
        case 500:
          return 'Erro no servidor. Tente novamente mais tarde.';
        default:
          return error.response.data?.message || 'Ocorreu um erro inesperado.';
      }
    } else if (error.request) {
      // Network error
      return 'Erro de ligação. Verifique a sua internet.';
    } else {
      // Other error
      return error.message || 'Ocorreu um erro inesperado.';
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
    Logger.warn('ErrorService', 'Showing user error dialog', { message });

    if (ErrorService._showAlert) {
      ErrorService._showAlert({
        type: 'error',
        title: 'Erro',
        message,
        buttons: [{ text: 'OK' }],
      });
    } else {
      const { Alert } = require('react-native');
      Alert.alert('Erro', message, [{ text: 'OK', style: 'default' }], { cancelable: true });
    }

    Logger.logUserInteraction('ErrorService', 'error_dialog_shown', { message });
  }

  static logGeneralError(component, error, context = {}) {
    Logger.error(component, `General Error: ${error.message || error}`, {
      error: error.message || error,
      stack: error.stack,
      context,
      type: 'general_error'
    });

    // Send general errors to Sentry with context
    try {
      sentryService.captureError(error, {
        general: {
          component,
          context,
          errorMessage: error.message || error.toString()
        }
      }, {
        error_service: true,
        general_error: true,
        component
      });
    } catch (sentryError) {
      Logger.warn('ErrorService', 'Failed to send general error to Sentry', { 
        sentryError: sentryError.message 
      });
    }
  }
}

export default ErrorService;