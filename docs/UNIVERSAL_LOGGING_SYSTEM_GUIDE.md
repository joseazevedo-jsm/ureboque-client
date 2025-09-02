# Universal Logging System for React Native/Expo Apps

This guide shows how to implement the comprehensive logging and Sentry system in any React Native or Expo project.

## 🎯 What You Get

- **Environment-aware logging** (console in dev, files + Sentry in production)
- **Structured logging** with namespaces and severity levels
- **File logging** with automatic rotation and cleanup
- **Sentry integration** with error reporting and performance monitoring
- **User privacy protection** with automatic PII filtering
- **Performance tracking** for APIs, user interactions, and workflows
- **Real-time monitoring** for critical business processes

## 📦 Installation

### 1. Install Dependencies

```bash
npm install react-native-logs expo-file-system @sentry/react-native
```

### 2. Project Structure

Create the following files in your project:

```
src/
├── services/
│   ├── LoggerService.js
│   └── SentryService.js
├── components/
│   └── ErrorBoundary.js (enhanced)
└── docs/
    └── LOGGING_GUIDE.md
```

## 🔧 Core Implementation

### Step 1: Copy Core Services

Copy these files from the reference implementation:
- `src/services/LoggerService.js`
- `src/services/SentryService.js`

### Step 2: Update Configuration Files

#### `app.json`
```json
{
  "expo": {
    "plugins": [
      "@sentry/react-native/expo",
      // ... other plugins
    ]
  }
}
```

#### `metro.config.js`
```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add Sentry Metro integration
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

module.exports = config;
```

#### `index.js` (App Entry Point)
```javascript
import { registerRootComponent } from 'expo';
import { initializeSentry } from './src/services/SentryService';

// Initialize Sentry before anything else
initializeSentry();

import App from './src/App';

registerRootComponent(App);
```

### Step 3: Environment Configuration

#### `.env.example`
```env
# API Configuration
EXPO_PUBLIC_API_URL=https://your-api-url.com

# Sentry Configuration
EXPO_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Optional: Logging Configuration
EXPO_PUBLIC_LOG_LEVEL=debug  # debug, info, warn, error, fatal
```

## 🎨 Customization for Different Apps

### Step 1: Customize Namespaces

Edit `LoggerService.js` to match your app's domains:

```javascript
// Pre-configured loggers for your app areas
export const loggers = {
  // Core app loggers
  app: createNamespaceLogger('APP'),
  auth: createNamespaceLogger('AUTH'),
  api: createNamespaceLogger('API'),
  
  // Customize these for your app:
  // E-commerce app
  products: createNamespaceLogger('PRODUCTS'),
  cart: createNamespaceLogger('CART'),
  orders: createNamespaceLogger('ORDERS'),
  payments: createNamespaceLogger('PAYMENTS'),
  
  // Social media app
  posts: createNamespaceLogger('POSTS'),
  messaging: createNamespaceLogger('MESSAGING'),
  profile: createNamespaceLogger('PROFILE'),
  
  // Health/Fitness app
  workouts: createNamespaceLogger('WORKOUTS'),
  nutrition: createNamespaceLogger('NUTRITION'),
  health: createNamespaceLogger('HEALTH'),
  
  // Education app
  courses: createNamespaceLogger('COURSES'),
  lessons: createNamespaceLogger('LESSONS'),
  progress: createNamespaceLogger('PROGRESS'),
  
  // Always keep these system ones
  performance: createNamespaceLogger('PERF'),
  security: createNamespaceLogger('SECURITY'),
  storage: createNamespaceLogger('STORAGE'),
};
```

### Step 2: Add Business-Specific Logging Methods

Add methods for your app's key workflows:

```javascript
export const LoggerService = {
  // ... existing methods ...

  // E-commerce specific
  productViewed: (productId, details = null) => {
    loggers.products.info(`Product viewed: ${productId}`, details);
    SentryService.addBreadcrumb('Product viewed', 'user_action', 'info', { productId });
  },

  orderPlaced: (orderId, orderDetails = null) => {
    loggers.orders.info(`Order placed: ${orderId}`, { sentryLevel: 'info', ...orderDetails });
    SentryService.trackBusinessEvent('order_placed', orderId, orderDetails);
  },

  paymentProcessed: (paymentId, amount, status) => {
    const level = status === 'success' ? 'info' : 'error';
    loggers.payments[level](`Payment ${status}: ${paymentId}`, { amount, status });
  },

  // Social media specific
  postCreated: (postId, type) => {
    loggers.posts.info(`Post created: ${postId}`, { type, sentryLevel: 'info' });
  },

  messagesSent: (recipientId, messageCount = 1) => {
    loggers.messaging.info(`Messages sent to ${recipientId}`, { messageCount });
  },

  // Health/Fitness specific
  workoutStarted: (workoutId, type) => {
    loggers.workouts.info(`Workout started: ${workoutId}`, { type, sentryLevel: 'info' });
  },

  workoutCompleted: (workoutId, duration, calories) => {
    loggers.workouts.info(`Workout completed: ${workoutId}`, { 
      duration, 
      calories,
      sentryLevel: 'info' 
    });
  },

  // Education specific
  lessonStarted: (lessonId, courseId) => {
    loggers.lessons.info(`Lesson started: ${lessonId}`, { courseId });
  },

  lessonCompleted: (lessonId, score = null) => {
    loggers.lessons.info(`Lesson completed: ${lessonId}`, { 
      score, 
      sentryLevel: 'info' 
    });
  },
};
```

### Step 3: Customize Sentry Events

Add business-specific tracking to `SentryService.js`:

```javascript
// Business workflow tracking
export const trackBusinessFlow = (stage, entityId, data = {}) => {
  const stages = {
    // E-commerce stages
    PRODUCT_VIEWED: 'Product viewed',
    CART_UPDATED: 'Cart updated',
    CHECKOUT_STARTED: 'Checkout started',
    ORDER_PLACED: 'Order placed',
    PAYMENT_PROCESSED: 'Payment processed',
    
    // Social media stages
    POST_CREATED: 'Post created',
    POST_SHARED: 'Post shared',
    MESSAGE_SENT: 'Message sent',
    PROFILE_UPDATED: 'Profile updated',
    
    // Health/Fitness stages
    WORKOUT_STARTED: 'Workout started',
    WORKOUT_COMPLETED: 'Workout completed',
    GOAL_SET: 'Goal set',
    ACHIEVEMENT_UNLOCKED: 'Achievement unlocked',
    
    // Education stages
    COURSE_ENROLLED: 'Course enrolled',
    LESSON_COMPLETED: 'Lesson completed',
    QUIZ_TAKEN: 'Quiz taken',
    CERTIFICATE_EARNED: 'Certificate earned',
  };

  Sentry.addBreadcrumb({
    message: stages[stage] || `Business Event: ${stage}`,
    category: 'business_flow',
    level: 'info',
    data: {
      stage,
      entityId,
      ...data,
      timestamp: new Date().toISOString(),
    },
  });
};
```

## 🔌 Integration Patterns

### API Client Integration

```javascript
import { LoggerService } from './LoggerService';
import SentryService from './SentryService';

// In your API client (axios example)
api.interceptors.request.use((config) => {
  LoggerService.apiRequest(config.method?.toUpperCase(), config.url, config.data);
  config.metadata = { startTime: Date.now() };
  return config;
});

api.interceptors.response.use(
  (response) => {
    const duration = response.config.metadata 
      ? Date.now() - response.config.metadata.startTime 
      : null;
    
    LoggerService.apiResponse(
      response.config.method?.toUpperCase(),
      response.config.url,
      response.status,
      duration
    );
    
    SentryService.trackNetworkRequest(
      response.config.method?.toUpperCase(),
      response.config.url,
      response.status,
      duration
    );
    
    return response;
  },
  (error) => {
    LoggerService.apiError(
      error.config?.method?.toUpperCase(),
      error.config?.url,
      error
    );
    
    SentryService.captureError(error, { 
      context: 'api_request',
      url: error.config?.url 
    });
    
    return Promise.reject(error);
  }
);
```

### Context/Store Integration

```javascript
import { LoggerService } from '../services/LoggerService';
import SentryService from '../services/SentryService';

// In your context providers or Redux actions
export const YourContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = async (credentials) => {
    try {
      const result = await authService.login(credentials);
      setUser(result.user);
      
      LoggerService.info('auth', 'User login successful', { userId: result.user.id });
      SentryService.setUserContext(result.user);
      
      return result;
    } catch (error) {
      LoggerService.error('auth', 'Login failed', error);
      SentryService.captureError(error, { context: 'user_login' });
      throw error;
    }
  };

  // ... rest of your context
};
```

### Component Integration

```javascript
import { LoggerService } from '../services/LoggerService';
import SentryService from '../services/SentryService';

export const YourComponent = () => {
  const handleCriticalAction = async () => {
    try {
      LoggerService.userAction('critical_button_clicked', { component: 'YourComponent' });
      
      const result = await performCriticalOperation();
      
      LoggerService.info('app', 'Critical operation completed successfully');
      SentryService.trackBusinessFlow('CRITICAL_ACTION_COMPLETED', result.id);
      
    } catch (error) {
      LoggerService.error('app', 'Critical operation failed', error);
      SentryService.captureCriticalError(error, { 
        context: 'critical_action',
        component: 'YourComponent' 
      });
    }
  };

  return (
    <Button onPress={handleCriticalAction}>
      Perform Critical Action
    </Button>
  );
};
```

## 📱 App-Specific Examples

### E-commerce App

```javascript
// In your product service
export const ProductService = {
  async viewProduct(productId) {
    LoggerService.productViewed(productId);
    // ... fetch product
  },

  async addToCart(productId, quantity) {
    try {
      const result = await api.post('/cart/add', { productId, quantity });
      LoggerService.info('cart', 'Item added to cart', { productId, quantity });
      return result;
    } catch (error) {
      LoggerService.error('cart', 'Failed to add item to cart', error);
      throw error;
    }
  }
};
```

### Social Media App

```javascript
// In your posts context
export const PostsProvider = ({ children }) => {
  const createPost = async (postData) => {
    try {
      const post = await api.post('/posts', postData);
      LoggerService.postCreated(post.id, postData.type);
      SentryService.trackBusinessFlow('POST_CREATED', post.id, { type: postData.type });
      return post;
    } catch (error) {
      LoggerService.error('posts', 'Failed to create post', error);
      SentryService.captureError(error, { context: 'post_creation' });
      throw error;
    }
  };
};
```

### Health/Fitness App

```javascript
// In your workout tracker
export const WorkoutTracker = {
  startWorkout(workoutType) {
    const workoutId = generateId();
    LoggerService.workoutStarted(workoutId, workoutType);
    SentryService.trackBusinessFlow('WORKOUT_STARTED', workoutId, { type: workoutType });
    return workoutId;
  },

  completeWorkout(workoutId, stats) {
    LoggerService.workoutCompleted(workoutId, stats.duration, stats.calories);
    SentryService.trackBusinessFlow('WORKOUT_COMPLETED', workoutId, stats);
  }
};
```

## 🚀 Deployment Checklist

### Production Setup

1. **Sentry Project Setup**
   ```bash
   # Create Sentry project at sentry.io
   # Get your DSN and auth token
   ```

2. **Environment Variables**
   ```bash
   # Add to your .env file
   EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn
   
   # For EAS builds, add as secrets:
   eas secret:create --name SENTRY_AUTH_TOKEN --value your-auth-token
   ```

3. **Build Configuration**
   ```json
   // eas.json
   {
     "build": {
       "production": {
         "env": {
           "EXPO_PUBLIC_LOG_LEVEL": "error"
         }
       }
     }
   }
   ```

### Testing

1. **Test Error Reporting**
   ```javascript
   // Add a test button in development
   const testError = () => {
     LoggerService.error('test', 'Test error for Sentry', new Error('Test error'));
     SentryService.captureError(new Error('Test error'), { context: 'testing' });
   };
   ```

2. **Test File Logging**
   ```javascript
   // Check logs are being written
   const logs = await LoggerService.getLogFiles();
   console.log('Log files:', logs);
   ```

## 📊 Monitoring and Alerts

### Sentry Dashboard Setup

1. **Create Alerts** for critical errors
2. **Set up Release Health** tracking
3. **Configure Performance** monitoring thresholds
4. **Create Custom Metrics** for business KPIs

### Key Metrics to Monitor

- **Error Rate**: Keep below 1%
- **Performance**: API response times, screen load times
- **Business Metrics**: Conversion rates, user engagement
- **Technical Metrics**: Crash rate, memory usage

## 🔒 Security and Privacy

### Automatic PII Filtering

The system automatically filters:
- Email addresses (masked)
- Authentication tokens
- Sensitive API responses
- Personal user data

### Custom Filtering

```javascript
// In SentryService.js beforeSend hook
beforeSend: (event) => {
  // Add your custom filtering
  if (event.extra?.sensitiveField) {
    delete event.extra.sensitiveField;
  }
  return event;
}
```

## 📈 Advanced Features

### Performance Monitoring

```javascript
// Measure critical user flows
const transaction = SentryService.startTransaction('user_signup', 'user_flow');
// ... perform signup steps
transaction.setTag('signup_method', 'email');
transaction.finish();
```

### Custom Metrics

```javascript
// Track business metrics
SentryService.addBreadcrumb('revenue_generated', 'business', 'info', {
  amount: 99.99,
  currency: 'USD',
  source: 'in_app_purchase'
});
```

## 🆘 Troubleshooting

### Common Issues

1. **Sentry not receiving events**
   - Check DSN configuration
   - Verify network connectivity
   - Check beforeSend filters

2. **File logging not working**
   - Verify file system permissions
   - Check device storage space
   - Ensure production environment

3. **High log volume**
   - Adjust log levels in production
   - Review and optimize logging frequency
   - Implement sampling for high-frequency events

### Debug Mode

```javascript
// Enable debug logging in development
if (__DEV__) {
  LoggerService.enableDebugMode();
  SentryService.enableDebugMode();
}
```

## 🎯 Best Practices

1. **Log Levels**: Use appropriate levels (debug, info, warn, error, fatal)
2. **Structured Data**: Always provide context objects with relevant data
3. **Performance**: Avoid logging in tight loops or high-frequency operations
4. **Privacy**: Never log sensitive user data
5. **Business Value**: Focus on logging events that provide business insights

## 📚 Resources

- [Sentry React Native Documentation](https://docs.sentry.io/platforms/react-native/)
- [react-native-logs Documentation](https://www.npmjs.com/package/react-native-logs)
- [Expo File System Documentation](https://docs.expo.dev/versions/latest/sdk/filesystem/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)

## 🤝 Contributing

This logging system is designed to be:
- **Modular**: Easy to adapt for different app types
- **Scalable**: Handles high-volume applications
- **Maintainable**: Clear separation of concerns
- **Production-ready**: Optimized for performance and reliability

Feel free to customize and extend based on your specific app requirements!