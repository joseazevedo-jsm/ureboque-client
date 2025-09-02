class ErrorService {
  static handleAPIError(error, showToUser = true) {
    const errorMessage = this.getErrorMessage(error);
    
    // Log error for debugging
    console.error('API Error:', {
      message: errorMessage,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
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

  static showUserError(message) {
    // Import Alert from react-native at the top of file for this to work
    const { Alert } = require('react-native');
    
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
    
    // Also log for debugging
    console.warn('User Error:', message);
  }
}

export default ErrorService;