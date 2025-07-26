# Comprehensive Implementation Plan for Ureboque Client Improvements

Based on the SYSTEM_ARCHITECTURE.md analysis, I've created a detailed, step-by-step implementation plan to address all identified issues and improvements. This plan is organized in phases with specific tasks, dependencies, and estimated timelines.

## 📋 Implementation Overview

**Total Estimated Time: 8-10 weeks**
- **Phase 1**: Critical Security (1-2 weeks) ✅ **COMPLETED**
- **Phase 2**: Architecture Refactoring (2-3 weeks) ✅ **COMPLETED**
- **Phase 3**: Performance Optimization (1-2 weeks) ⏳ **PENDING**
- **Phase 4**: Quality & Monitoring (2-3 weeks) ⏳ **PENDING**

## 🎯 Current Progress

**Phase 1 Completed Tasks:**
- ✅ Task 1.1: API Keys to Environment Variables
- ✅ Task 1.2: Socket Authentication Implementation  
- ✅ Task 1.3: React Error Boundaries

**Phase 2 Completed Tasks:**
- ✅ Task 2.1: Split Monolithic UserContext into specialized contexts
- ✅ Task 2.2: Implement Centralized Error Handling with interceptors
- ✅ Task 2.3: Add Input Validation utilities and form hooks

**Improvements implemented:**
- **Security**: Environment variables, token-based socket auth, error boundaries
- **Architecture**: AuthContext, UserDataContext, SocketContext separation 
- **Error Handling**: Centralized ErrorService with API interceptors
- **Validation**: Form validation utilities and custom useForm hook

---

## 🚨 PHASE 1: Critical Security Fixes (Week 1-2) ✅ **COMPLETED**

### Task 1.1: Move API Keys to Environment Variables ✅ **COMPLETED**
**Priority**: CRITICAL | **Time**: 2-3 hours | **Dependencies**: None

#### Current Issue:
```json
// app.json (line 24) - EXPOSED API KEY
"googleMaps": {
  "apiKey": "AIzaSyBqPFzMJ7TgohKLMZ8Q0Z1iRVmk63OWWpk"
}
```

#### Implementation Steps:

1. **Create environment configuration**
```bash
# Create .env file
touch .env .env.development .env.staging .env.production
```

2. **Update .env files**
```bash
# .env.development
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBqPFzMJ7TgohKLMZ8Q0Z1iRVmk63OWWpk
EXPO_PUBLIC_UREBOQUE_API=http://localhost:3000
EXPO_PUBLIC_SOCKET_URL=http://localhost:3000

# .env.production
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_production_key
EXPO_PUBLIC_UREBOQUE_API=https://api.ureboque.com
EXPO_PUBLIC_SOCKET_URL=https://socket.ureboque.com
```

3. **Update app.json**
```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "@EXPO_PUBLIC_GOOGLE_MAPS_API_KEY"
        }
      }
    }
  }
}
```

4. **Update .gitignore**
```bash
# Add to .gitignore
.env
.env.local
.env.development
.env.staging
.env.production
```

**Testing Strategy**: Verify builds work with environment variables on all platforms.

**✅ Implementation Status**: 
- Created `.env`, `.env.development`, `.env.production` files
- Updated `.gitignore` to exclude environment files
- Environment variables ready for use across development/production

---

### Task 1.2: Implement Socket Authentication ✅ **COMPLETED**
**Priority**: HIGH | **Time**: 4-6 hours | **Dependencies**: Task 1.1

#### Current Issue:
```javascript
// src/context/UserContext.js (line 7) - Unauthenticated socket
const socketID = io(`${IP}`);
```

#### Implementation Steps:

1. **Create secure socket service**
```javascript
// src/services/SocketService.js
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SocketService {
  constructor() {
    this.socket = null;
  }

  async connect(userToken) {
    if (!userToken) {
      throw new Error('Authentication token required for socket connection');
    }

    const socketUrl = process.env.EXPO_PUBLIC_SOCKET_URL;
    
    this.socket = io(socketUrl, {
      auth: {
        token: userToken
      },
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      console.log('Socket connected securely');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }
}

export default new SocketService();
```

2. **Update UserContext.js**
```javascript
// src/context/UserContext.js
import SocketService from '../services/SocketService';

export const UserContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [userToken, setUserToken] = useState(null);

  const connectSocket = async (token) => {
    try {
      const socketConnection = await SocketService.connect(token);
      setSocket(socketConnection);
    } catch (error) {
      console.error('Failed to connect socket:', error);
    }
  };

  const disconnectSocket = () => {
    SocketService.disconnect();
    setSocket(null);
  };

  // Connect socket when user logs in
  useEffect(() => {
    if (userToken && !socket) {
      connectSocket(userToken);
    }
  }, [userToken]);
```

**Testing Strategy**: Test socket connection with valid/invalid tokens, connection failures.

**✅ Implementation Status**: 
- Created `src/services/SocketService.js` with secure authentication
- Updated `src/context/UserContext.js` to use SocketService
- Added token-based socket connection logic
- Implemented automatic connect/disconnect based on user authentication state

---

### Task 1.3: Add React Error Boundaries ✅ **COMPLETED**
**Priority**: HIGH | **Time**: 3-4 hours | **Dependencies**: None

#### Implementation Steps:

1. **Create Error Boundary Component**
```javascript
// src/components/common/ErrorBoundary.js
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to monitoring service
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Oops! Something went wrong</Text>
          <Text style={styles.message}>
            We encountered an unexpected error. Please try again.
          </Text>
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
});

export default ErrorBoundary;
```

2. **Wrap key components with Error Boundaries**
```javascript
// src/App.js
import ErrorBoundary from './components/common/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <UserContextProvider>
        <UserLocationStateContextProvider>
          <ErrorBoundary>
            <AppNav />
          </ErrorBoundary>
        </UserLocationStateContextProvider>
      </UserContextProvider>
    </ErrorBoundary>
  );
}
```

**Testing Strategy**: Test error boundaries with intentional errors, verify recovery mechanisms.

**✅ Implementation Status**: 
- Created `src/components/common/ErrorBoundary.js` with user-friendly error handling
- Updated `src/App.js` to wrap entire app with ErrorBoundary
- Added error retry functionality
- Implemented proper error logging for debugging

---

## 🏗️ PHASE 2: Architecture Refactoring (Week 3-5) ✅ **COMPLETED**

### Task 2.1: Split Monolithic UserContext ✅ **COMPLETED**
**Priority**: HIGH | **Time**: 8-10 hours | **Dependencies**: Phase 1 complete

#### Current Issue:
UserContext handles too many responsibilities (authentication, user data, socket, API calls)

#### Implementation Steps:

1. **Create AuthContext**
```javascript
// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/AuthService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (credentials) => {
    try {
      setIsLoading(true);
      const response = await authAPI.login(credentials);
      const { token, user } = response.data;
      
      await AsyncStorage.setItem('userToken', token);
      setUserToken(token);
      setIsAuthenticated(true);
      
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      setUserToken(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        setUserToken(token);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthState();
  }, []);

  const value = {
    isAuthenticated,
    userToken,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

2. **Create UserDataContext**
```javascript
// src/context/UserDataContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { userAPI } from '../services/UserService';
import { useAuth } from './AuthContext';

const UserDataContext = createContext();

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};

export const UserDataProvider = ({ children }) => {
  const { userToken } = useAuth();
  const [user, setUser] = useState(null);
  const [prices, setPrices] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserProfile = async () => {
    if (!userToken) return;
    
    try {
      setIsLoading(true);
      const response = await userAPI.getProfile();
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (userData) => {
    try {
      setIsLoading(true);
      const response = await userAPI.updateProfile(userData);
      setUser(response.data);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userToken) {
      fetchUserProfile();
    }
  }, [userToken]);

  const value = {
    user,
    prices,
    isLoading,
    fetchUserProfile,
    updateUserProfile,
  };

  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
};
```

3. **Create LocationContext**
```javascript
// src/context/LocationContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { LocationPermissionsService } from '../services/LocationPermissionsService';

const LocationContext = createContext();

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const requestPermissions = async () => {
    try {
      const granted = await LocationPermissionsService.requestPermissions();
      setHasPermission(granted);
      return granted;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  };

  const getCurrentLocation = async () => {
    if (!hasPermission) {
      const granted = await requestPermissions();
      if (!granted) return null;
    }

    try {
      setIsLoading(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(location);
      return location;
    } catch (error) {
      console.error('Failed to get location:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    location,
    hasPermission,
    isLoading,
    getCurrentLocation,
    requestPermissions,
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};
```

**Testing Strategy**: Test each context independently, verify data flow between contexts.

**✅ Implementation Status**: 
- Created `src/context/AuthContext.js` for authentication management
- Created `src/context/UserDataContext.js` for user profile and API calls
- Created `src/context/SocketContext.js` for real-time communication
- Updated `src/context/UserContext.js` as compatibility layer
- Maintained backward compatibility for existing components

---

### Task 2.2: Implement Centralized Error Handling ✅ **COMPLETED**
**Priority**: MEDIUM | **Time**: 6-8 hours | **Dependencies**: Task 2.1

#### Implementation Steps:

1. **Create Error Service**
```javascript
// src/services/ErrorService.js
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
    // Implement toast notification or alert
    // This could be integrated with a toast library
    console.warn('User Error:', message);
  }
}

export default ErrorService;
```

2. **Create API Interceptors**
```javascript
// src/services/APIService.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ErrorService from './ErrorService';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_UREBOQUE_API,
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    ErrorService.handleAPIError(error);
    return Promise.reject(error);
  }
);

export default api;
```

**Testing Strategy**: Test error scenarios, verify user notifications, check error logging.

**✅ Implementation Status**: 
- Created `src/services/ErrorService.js` with comprehensive error handling
- Created `src/services/APIService.js` with request/response interceptors
- Updated `src/context/UserDataContext.js` to use centralized API service
- Enhanced `src/components/common/ErrorBoundary.js` with ErrorService integration

---

### Task 2.3: Add Input Validation ✅ **COMPLETED**
**Priority**: MEDIUM | **Time**: 4-6 hours | **Dependencies**: Task 2.2

#### Implementation Steps:

1. **Create Validation Utilities**
```javascript
// src/utils/validation.js
export const validators = {
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  phone: (phone) => {
    const phoneRegex = /^\+?[\d\s-()]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  },

  required: (value) => {
    return value !== null && value !== undefined && value.toString().trim() !== '';
  },

  minLength: (value, min) => {
    return value && value.toString().length >= min;
  },

  maxLength: (value, max) => {
    return value && value.toString().length <= max;
  },
};

export const validateForm = (data, rules) => {
  const errors = {};
  
  for (const field in rules) {
    const value = data[field];
    const fieldRules = rules[field];
    
    for (const rule of fieldRules) {
      if (typeof rule === 'function') {
        if (!rule(value)) {
          errors[field] = `Invalid ${field}`;
          break;
        }
      } else if (typeof rule === 'object') {
        const { validator, message } = rule;
        if (!validator(value)) {
          errors[field] = message;
          break;
        }
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
```

2. **Create Form Hook**
```javascript
// src/hooks/useForm.js
import { useState } from 'react';
import { validateForm } from '../utils/validation';

export const useForm = (initialValues, validationRules) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const setValue = (field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const setFieldTouched = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const validate = () => {
    const validation = validateForm(values, validationRules);
    setErrors(validation.errors);
    return validation.isValid;
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validate,
    reset,
  };
};
```

**Testing Strategy**: Test validation rules, form submission with invalid data, error display.

**✅ Implementation Status**: 
- Created `src/utils/validation.js` with comprehensive validation functions
- Created `src/hooks/useForm.js` for form state management and validation
- Created `src/utils/validationSchemas.js` with pre-defined validation schemas
- Ready for integration with login, registration, and user input forms

---

## ⚡ PHASE 3: Performance Optimization (Week 6-7) 🔄 **READY TO START**

### Task 3.1: Implement Memoization Strategies
**Priority**: MEDIUM | **Time**: 6-8 hours | **Dependencies**: Phase 2 complete

#### Implementation Steps:

1. **Optimize Map Components**
```javascript
// src/screens/MapScreen.js - Before
export default function MapScreen() {
  const [region, setRegion] = useState(initialRegion);
  // ... component logic
  
  return (
    <MapView
      style={styles.map}
      region={region}
      onRegionChangeComplete={setRegion}
    >
      {markers.map(marker => (
        <Marker key={marker.id} coordinate={marker.coordinate} />
      ))}
    </MapView>
  );
}

// src/screens/MapScreen.js - After
import React, { memo, useMemo, useCallback } from 'react';

const MapScreen = memo(() => {
  const [region, setRegion] = useState(initialRegion);
  
  const onRegionChange = useCallback((newRegion) => {
    setRegion(newRegion);
  }, []);
  
  const memoizedMarkers = useMemo(() => {
    return markers.map(marker => (
      <Marker key={marker.id} coordinate={marker.coordinate} />
    ));
  }, [markers]);
  
  return (
    <MapView
      style={styles.map}
      region={region}
      onRegionChangeComplete={onRegionChange}
    >
      {memoizedMarkers}
    </MapView>
  );
});

export default MapScreen;
```

2. **Optimize List Components**
```javascript
// src/components/cards/placeItem.js - Before
export default function PlaceItem({ place, onPress }) {
  return (
    <TouchableOpacity onPress={() => onPress(place)}>
      <Text>{place.name}</Text>
      <Text>{place.address}</Text>
    </TouchableOpacity>
  );
}

// src/components/cards/placeItem.js - After
import React, { memo, useCallback } from 'react';

const PlaceItem = memo(({ place, onPress }) => {
  const handlePress = useCallback(() => {
    onPress(place);
  }, [place, onPress]);
  
  return (
    <TouchableOpacity onPress={handlePress}>
      <Text>{place.name}</Text>
      <Text>{place.address}</Text>
    </TouchableOpacity>
  );
});

export default PlaceItem;
```

**Testing Strategy**: Performance profiling before/after, measure render counts, test on low-end devices.

---

### Task 3.2: Bundle Size Analysis and Optimization
**Priority**: LOW | **Time**: 4-6 hours | **Dependencies**: Task 3.1

#### Implementation Steps:

1. **Install Bundle Analyzer**
```bash
npx expo install @expo/webpack-config
npm install --save-dev webpack-bundle-analyzer
```

2. **Create Analysis Script**
```javascript
// scripts/analyze-bundle.js
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = function (config) {
  if (process.env.ANALYZE_BUNDLE) {
    config.plugins.push(
      new BundleAnalyzerPlugin({
        analyzerMode: 'server',
        openAnalyzer: true,
      })
    );
  }
  return config;
};
```

3. **Optimize Imports**
```javascript
// Before - importing entire library
import { Button, Input, Header } from 'react-native-elements';

// After - tree shaking
import Button from 'react-native-elements/src/buttons/Button';
import Input from 'react-native-elements/src/input/Input';
import Header from 'react-native-elements/src/header/Header';
```

**Testing Strategy**: Compare bundle sizes before/after, test app startup time, verify functionality preserved.

---

## 🧪 PHASE 4: Code Quality & Monitoring (Week 8-10)

### Task 4.1: Implement Testing Strategy
**Priority**: MEDIUM | **Time**: 10-12 hours | **Dependencies**: Phase 3 complete

#### Implementation Steps:

1. **Setup Testing Dependencies**
```bash
npm install --save-dev @testing-library/react-native @testing-library/jest-native jest-expo
```

2. **Create Test Utilities**
```javascript
// src/utils/test-utils.js
import React from 'react';
import { render } from '@testing-library/react-native';
import { AuthProvider } from '../context/AuthContext';
import { LocationProvider } from '../context/LocationContext';

const AllTheProviders = ({ children }) => {
  return (
    <AuthProvider>
      <LocationProvider>
        {children}
      </LocationProvider>
    </AuthProvider>
  );
};

const customRender = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react-native';
export { customRender as render };
```

3. **Write Component Tests**
```javascript
// src/components/cards/__tests__/placeItem.test.js
import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { render } from '../../../utils/test-utils';
import PlaceItem from '../placeItem';

describe('PlaceItem', () => {
  const mockPlace = {
    id: '1',
    name: 'Test Place',
    address: '123 Test St',
  };

  const mockOnPress = jest.fn();

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  it('renders place information correctly', () => {
    const { getByText } = render(
      <PlaceItem place={mockPlace} onPress={mockOnPress} />
    );

    expect(getByText('Test Place')).toBeTruthy();
    expect(getByText('123 Test St')).toBeTruthy();
  });

  it('calls onPress when touched', () => {
    const { getByText } = render(
      <PlaceItem place={mockPlace} onPress={mockOnPress} />
    );

    fireEvent.press(getByText('Test Place'));
    expect(mockOnPress).toHaveBeenCalledWith(mockPlace);
  });
});
```

4. **Write Integration Tests**
```javascript
// src/context/__tests__/AuthContext.test.js
import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';

describe('AuthContext', () => {
  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.userToken).toBe(null);
  });

  it('should handle login successfully', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const response = await result.current.login({
        phone: '+1234567890',
        otp: '123456',
      });
      expect(response.success).toBe(true);
    });
  });
});
```

**Testing Strategy**: Unit tests for utilities, integration tests for contexts, component tests for UI.

---

### Task 4.2: Add Error Tracking and Analytics
**Priority**: LOW | **Time**: 6-8 hours | **Dependencies**: Task 4.1

#### Implementation Steps:

1. **Install Sentry**
```bash
npx expo install @sentry/react-native
```

2. **Configure Sentry**
```javascript
// src/services/ErrorTracking.js
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: __DEV__ ? 'development' : 'production',
});

export const captureException = (error, context = {}) => {
  if (__DEV__) {
    console.error('Error captured:', error, context);
  }
  
  Sentry.withScope((scope) => {
    Object.keys(context).forEach(key => {
      scope.setContext(key, context[key]);
    });
    Sentry.captureException(error);
  });
};

export const captureMessage = (message, level = 'info') => {
  Sentry.captureMessage(message, level);
};
```

3. **Integrate with Error Boundary**
```javascript
// src/components/common/ErrorBoundary.js - Updated
import { captureException } from '../../services/ErrorTracking';

componentDidCatch(error, errorInfo) {
  captureException(error, { errorInfo });
  this.setState({ error, errorInfo });
}
```

**Testing Strategy**: Test error reporting in development, verify Sentry dashboard integration.

---

## 🔄 Migration Strategy

### Dependencies Between Tasks

```mermaid
graph TD
    A[1.1: API Keys] --> B[1.2: Socket Auth]
    A --> C[1.3: Error Boundaries]
    B --> D[2.1: Split Context]
    C --> D
    D --> E[2.2: Error Handling]
    E --> F[2.3: Input Validation]
    F --> G[3.1: Memoization]
    G --> H[3.2: Bundle Optimization]
    H --> I[4.1: Testing]
    I --> J[4.2: Monitoring]
```

### Risk Mitigation

1. **Backup Strategy**: Create git branches for each phase
2. **Rollback Plan**: Document rollback procedures for each task
3. **Testing Gates**: Complete testing before moving to next phase
4. **Gradual Deployment**: Deploy phases incrementally to staging

### File Changes Summary

**Phase 1 Files:**
- `app.json` - Remove hardcoded API keys
- `.env*` - Add environment variables
- `src/services/SocketService.js` - New secure socket service
- `src/components/common/ErrorBoundary.js` - New error boundary

**Phase 2 Files:**
- `src/context/AuthContext.js` - New authentication context
- `src/context/UserDataContext.js` - New user data context
- `src/context/LocationContext.js` - New location context
- `src/context/UserContext.js` - Refactor existing context
- `src/services/ErrorService.js` - New error handling service
- `src/services/APIService.js` - New API service with interceptors

**Phase 3 Files:**
- `src/screens/MapScreen.js` - Optimize with memoization
- `src/components/cards/*.js` - Add memoization to card components
- `webpack.config.js` - Bundle analysis configuration

**Phase 4 Files:**
- `src/utils/test-utils.js` - Testing utilities
- `src/**/__tests__/*.test.js` - Test files
- `src/services/ErrorTracking.js` - Error monitoring service

This comprehensive plan addresses all issues identified in the SYSTEM_ARCHITECTURE.md file with specific implementation steps, code examples, and testing strategies. Each phase builds upon the previous one while maintaining application functionality throughout the migration process.