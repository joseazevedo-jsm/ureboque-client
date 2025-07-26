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
    // For now, just log to console
    // In a real app, this could show a toast notification or alert
    console.warn('User Error:', message);
    
    // TODO: Implement toast notification or alert system
    // Example: Toast.show({ type: 'error', text1: 'Error', text2: message });
  }
}

export default ErrorService;