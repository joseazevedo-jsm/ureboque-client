# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native mobile application built with Expo for a ride-hailing/towing service called "Ureboque". The app is a client-side application that connects users with towing service providers.

## Development Commands

- `npm start` - Start Expo development server with dev client
- `npm run android` - Run on Android device/emulator  
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run web version

The project uses Expo SDK 51 and requires the Expo development client for testing.

## Architecture Overview

### Core Structure
- **Entry Point**: `index.js` → `src/App.js`
- **Navigation**: Stack-based navigation with conditional rendering based on authentication state
- **State Management**: React Context for user state and location state
- **Backend Communication**: Axios for HTTP requests and Socket.io for real-time communication

### Key Context Providers
1. **UserContext** (`src/context/UserContext.js`): Manages user authentication, profile data, API calls, and socket connections
2. **UserLocationStateContext** (`src/context/UserLocationStateContext.js`): Handles user location state

### Navigation Flow
- **Unauthenticated**: Shows `LoginScreen`
- **Authenticated**: Shows `HomeMenu` (drawer navigation with main screens)

### Screen Structure
- `LoginScreen`: User authentication with phone number and OTP
- `MapScreen`: Main map interface with location services and ride booking
- `ProfileScreen`: User profile management
- `PromotionScreen`: Discount codes and promotions
- `InviteScreen`: Referral system

### Component Architecture
Components are organized by feature:
- **cards/**: Reusable card components (car types, places, routes, etc.)
- **modals/**: Modal dialogs for various features (destination, confirmation, chat, etc.)
- **views/**: Complex view components (driver search, status, etc.)
- **map/**: Map-related components (markers, styling, payment options)

### Key Features
- Real-time location tracking and mapping (Google Maps)
- Driver-rider matching system
- In-app chat functionality
- Payment processing
- Saved places management
- Promotional codes system
- Trip history and reviews

### Environment Configuration
- Uses `react-native-dotenv` for environment variables
- Backend API URL configured via `EXPO_PUBLIC_UREBOQUE_API`
- Google Maps API key configured in `app.json`

### Build Configuration
- **Development**: APK builds for Android, Debug builds for iOS
- **EAS Build**: Configured for internal distribution during development
- **Bundle ID**: `com.ureboque.client`

### Key Dependencies
- **Maps**: `react-native-maps`, `react-native-maps-directions`, `react-native-geocoding`
- **Navigation**: `@react-navigation/native`, `@react-navigation/stack`, `@react-navigation/drawer`
- **UI**: `@gorhom/bottom-sheet`, `react-native-elements`
- **Communication**: `socket.io-client`, `axios`
- **Permissions**: `expo-location`, `expo-image-picker`

### File Structure Notes
- `/resources/icons/`: Contains app icons and UI assets
- `/android/`: Native Android configuration
- Static assets in `/assets/` for Expo
- All source code in `/src/` with clear feature-based organization