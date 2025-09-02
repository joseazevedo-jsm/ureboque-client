# Ureboque Codebase Standards Template

This document captures the specific patterns and standards from the Ureboque project for replication in new projects.

## CLAUDE.md Template

```markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
[Replace with your project description]

## Development Commands
- `npm start` - [Your development server command]
- `npm run android` - [Android build command]
- `npm run ios` - [iOS build command] 
- `npm run web` - [Web build command if applicable]

## Architecture Overview

### Core Structure
- **Entry Point**: `index.js` → `src/App.js`
- **Navigation**: [Your navigation pattern]
- **State Management**: React Context for [list your contexts]
- **Backend Communication**: Axios for HTTP requests and Socket.io for real-time communication

### Key Context Providers
1. **UserContext** (`src/context/UserContext.js`): [Description of user state management]
2. **[Other]Context** (`src/context/[Other]Context.js`): [Description]

### Navigation Flow
- **Unauthenticated**: Shows `LoginScreen`
- **Authenticated**: Shows `[MainScreen]` ([navigation type])

### Screen Structure
- `LoginScreen`: [Description]
- `[Other]Screen`: [Description]

### Component Architecture
Components are organized by feature:
- **cards/**: Reusable card components
- **modals/**: Modal dialogs for various features  
- **views/**: Complex view components
- **[domain]/**: Domain-specific components

### Key Features
[List your main features]

### Environment Configuration
- Uses `react-native-dotenv` for environment variables
- Backend API URL configured via `[YOUR_API_ENV_VAR]`
- [Other API keys and config]

### Build Configuration
- **Development**: [Your dev build process]
- **[Build Service]**: [Your build service configuration]
- **Bundle ID**: `[your.bundle.id]`

### Key Dependencies
- **[Category]**: `dependency1`, `dependency2`
- **Navigation**: `@react-navigation/native`, `@react-navigation/stack`, `@react-navigation/drawer`
- **UI**: `@gorhom/bottom-sheet`, `react-native-elements`
- **Communication**: `socket.io-client`, `axios`
- **Permissions**: `expo-location`, `expo-image-picker`

### File Structure Notes
- `/resources/icons/`: Contains app icons and UI assets
- `/[platform]/`: Native platform configuration
- Static assets in `/assets/`
- All source code in `/src/` with clear feature-based organization

### ATTENTION
- When commiting don't insert AI commentary

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
```

## File Structure Pattern

```
src/
├── components/
│   ├── cards/              # Reusable card components
│   ├── modals/             # Modal dialogs
│   │   └── [ModalName]/
│   │       ├── [ModalName]Modal.js
│   │       └── components/
│   │           └── use[ModalName]Modal.js
│   ├── views/              # Complex view components
│   ├── [domain]/           # Domain-specific components
│   ├── common/             # Shared components
│   └── login/              # Authentication components
├── screens/                # Main application screens
├── context/                # React Context providers
├── services/               # API and external services
├── navigation/             # Navigation configuration
├── utils/                  # Utility functions
├── hooks/                  # Custom React hooks
├── models/                 # Data models and API hooks
└── styles.js               # Global styles
```

## Naming Conventions

### Files
- **Screens**: `[Name]Screen.js`
- **Modals**: `[Name]Modal.js` with `use[Name]Modal.js` hook
- **Context**: `[Feature]Context.js`
- **Services**: `[Name]Service.js` 
- **Components**: `[name].js` (camelCase) or `[Name].js` (PascalCase)
- **Hooks**: `use[Name].js`

### Component Organization Pattern
```javascript
// Modal Structure Example
src/components/modals/Register/
├── RegisterInfoModal.js          # Main modal component
├── RegisterPassModal.js          # Secondary modal
└── components/
    └── useRegisterModal.js       # Hook for modal logic
```

## Context Pattern

### Context Structure
```javascript
// UserContext.js pattern
export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // API methods
  const methodName = async () => {
    // Implementation
  };
  
  const value = {
    // State
    user,
    loading,
    // Methods
    methodName,
  };
  
  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
```

## Service Pattern

### API Service Structure
```javascript
// APIService.js pattern
import axios from 'axios';
import { API_BASE_URL } from '@env';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const APIService = {
  // Authentication
  login: (data) => apiClient.post('/auth/login', data),
  
  // User operations
  getProfile: () => apiClient.get('/user/profile'),
  updateProfile: (data) => apiClient.put('/user/profile', data),
};
```

## Hook Pattern

### Custom Hook Structure
```javascript
// use[Name].js pattern
import { useState, useEffect, useContext } from 'react';

export const useFeatureName = () => {
  const [state, setState] = useState(initialState);
  const context = useContext(SomeContext);
  
  const method = () => {
    // Implementation
  };
  
  useEffect(() => {
    // Side effects
  }, []);
  
  return {
    state,
    method,
    // Other exports
  };
};
```

## Environment Configuration Pattern

### Package.json Scripts
```json
{
  "scripts": {
    "start": "expo start --dev-client",
    "android": "expo run:android", 
    "ios": "expo run:ios",
    "web": "expo start --web"
  }
}
```

### Environment Variables Pattern
```javascript
// Using react-native-dotenv
import { API_BASE_URL, GOOGLE_MAPS_API_KEY } from '@env';
```

## Key Dependencies by Category

### Core Framework
- `expo`: Latest stable version
- `react-native`: Latest stable version

### Navigation  
- `@react-navigation/native`
- `@react-navigation/stack` 
- `@react-navigation/drawer`

### UI Components
- `@gorhom/bottom-sheet`
- `react-native-elements`
- `react-native-size-matters`

### State Management
- React Context (built-in)
- `@react-native-async-storage/async-storage`

### Communication
- `axios`
- `socket.io-client`

### Environment & Config
- `react-native-dotenv`
- `expo-constants`

## Git Standards

### Commit Message Pattern
- No AI commentary in commits
- Present tense: "Add feature" not "Added feature"
- Descriptive but concise

### Branch Naming
- `feature/feature-name`
- `bugfix/issue-description`
- `hotfix/critical-fix`

## Development Workflow

1. **Setup**: Clone → `npm install` → Configure environment variables
2. **Development**: Use `npm start` with dev client
3. **Testing**: Test on physical devices/emulators
4. **Build**: Use appropriate build service (EAS, etc.)
5. **Deploy**: Follow deployment pipeline

This template captures the specific patterns from Ureboque that make the codebase maintainable and scalable.