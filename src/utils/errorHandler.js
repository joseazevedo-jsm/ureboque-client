import { Alert } from 'react-native';

/**
 * Standard error handler for the application
 * Provides centralized error handling with user-friendly messages
 */

export const ErrorTypes = {
  NETWORK: 'NETWORK',
  VALIDATION: 'VALIDATION',
  AUTH: 'AUTH',
  SERVER: 'SERVER',
  UNKNOWN: 'UNKNOWN'
};

/**
 * Determines error type based on error object
 */
export const getErrorType = (error) => {
  if (!error.response && error.request) {
    return ErrorTypes.NETWORK;
  }
  
  if (error.response) {
    const { status } = error.response;
    if (status === 401 || status === 403) {
      return ErrorTypes.AUTH;
    }
    if (status >= 400 && status < 500) {
      return ErrorTypes.VALIDATION;
    }
    if (status >= 500) {
      return ErrorTypes.SERVER;
    }
  }
  
  return ErrorTypes.UNKNOWN;
};

/**
 * Gets user-friendly error message
 */
export const getErrorMessage = (error, context = '') => {
  const errorType = getErrorType(error);
  
  const messages = {
    [ErrorTypes.NETWORK]: 'Verifique sua conexão com a internet e tente novamente.',
    [ErrorTypes.VALIDATION]: error.response?.data?.message || 'Dados inválidos. Verifique as informações e tente novamente.',
    [ErrorTypes.AUTH]: 'Sessão expirada. Faça login novamente.',
    [ErrorTypes.SERVER]: 'Erro interno do servidor. Tente novamente em alguns minutos.',
    [ErrorTypes.UNKNOWN]: 'Algo deu errado. Tente novamente.'
  };
  
  return messages[errorType];
};

/**
 * Handles errors with appropriate user feedback
 * @param {Error} error - The error object
 * @param {string} context - Context where error occurred (optional)
 * @param {boolean} showAlert - Whether to show alert to user (default: true)
 * @param {Function} onError - Custom error handler callback (optional)
 */
export const handleError = (error, context = '', showAlert = true, onError = null) => {
  const errorType = getErrorType(error);
  const message = getErrorMessage(error, context);
  
  // Log error for debugging
  console.error(`[${context}] Error (${errorType}):`, {
    message: error.message,
    status: error.response?.status,
    data: error.response?.data
  });
  
  // Call custom error handler if provided
  if (onError) {
    onError(error, errorType, message);
  }
  
  // Show user-friendly alert
  if (showAlert) {
    const title = getErrorTitle(errorType);
    Alert.alert(title, message, [{ text: 'OK' }]);
  }
  
  return {
    type: errorType,
    message,
    originalError: error
  };
};

/**
 * Gets appropriate error title for alerts
 */
const getErrorTitle = (errorType) => {
  const titles = {
    [ErrorTypes.NETWORK]: 'Problema de Conexão',
    [ErrorTypes.VALIDATION]: 'Dados Inválidos',
    [ErrorTypes.AUTH]: 'Acesso Negado',
    [ErrorTypes.SERVER]: 'Erro do Servidor',
    [ErrorTypes.UNKNOWN]: 'Erro'
  };
  
  return titles[errorType];
};

/**
 * Async wrapper that handles errors automatically
 * @param {Function} asyncFn - Async function to wrap
 * @param {string} context - Context for error logging
 * @param {boolean} showAlert - Whether to show alert on error
 */
export const withErrorHandling = (asyncFn, context = '', showAlert = true) => {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      handleError(error, context, showAlert);
      throw error; // Re-throw so calling code can handle if needed
    }
  };
};

/**
 * Creates a standardized error object
 */
export const createError = (message, type = ErrorTypes.UNKNOWN, originalError = null) => {
  const error = new Error(message);
  error.type = type;
  error.originalError = originalError;
  return error;
};

export default {
  handleError,
  withErrorHandling,
  getErrorType,
  getErrorMessage,
  createError,
  ErrorTypes
};