# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a React Native ride-hailing mobile application built with Expo. The app uses Redux Toolkit for state management and includes real-time features via Socket.IO.

## Development Commands
- `npm start` - Start Expo development server with dev client
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator  
- `npm run web` - Start web development server

## Build Commands
- `eas build --platform android --profile development` - Build Android APK for development
- `eas build --platform android --profile preview` - Build Android APK for preview
- `eas build --platform android --profile production` - Build production Android app
- `eas build --platform ios --profile development` - Build iOS app for development

## Architecture

### State Management
- **Redux Toolkit** with two main slices:
  - `userSlice` - Authentication, user data, and socket state
  - `locationSlice` - Location data and map-related state
- **Socket Middleware** (`src/middleware/socketMiddleware.js`) - Custom middleware for real-time WebSocket communication
- **Redux Persist** - State persistence for user authentication

### Navigation Structure
- **Stack Navigation** with conditional rendering based on authentication state
- `AppNav.js` - Root navigator that shows LoginScreen or HomeMenu based on userToken
- `HomeMenu.js` - Main navigation container for authenticated users

### Key Architectural Patterns

#### Bottom Sheet Management
- Centralized bottom sheet management via `useBottomSheetManager` hook
- Manages multiple sheets: main, carTypeSelection, userCarInfo, paymentOptions, rideSearch, tripStarted, driverArriving, tripEnding, details, dragMarker
- Provides smooth transitions between sheets and state tracking

#### Component Organization
- **Screens** (`src/screens/`) - Main screen components
- **Components** organized by feature:
  - `modals/` - Modal components with their own hook logic
  - `cards/` - Reusable card components
  - `map/` - Map-related components and utilities
- **Hooks** (`src/hooks/`) - Custom hooks for business logic
- **Services** (`src/services/`) - External service integrations

#### Modal Pattern
Each modal follows a consistent pattern:
- Modal component in `modals/[ModalName]/`
- Custom hook in `components/use[ModalName].js` for business logic
- Separation of UI and business logic

### Key Dependencies
- **Expo SDK 51** - Main framework
- **React Native Maps** - Map functionality with Google Maps
- **@gorhom/bottom-sheet** - Bottom sheet components
- **Socket.IO Client** - Real-time communication
- **Redux Toolkit + React Redux** - State management
- **React Navigation** - Navigation
- **Expo Location** - Location services
- **ImageKit** - Image management

### Environment Configuration
- Uses `react-native-dotenv` for environment variables
- Google Maps API key configured in `app.json`
- EAS configuration for builds in `eas.json`

### Real-time Features
- Socket.IO integration for real-time ride tracking
- Custom socket middleware handles WebSocket lifecycle
- Socket state managed in Redux store

## Development Notes
- Uses Expo Dev Client for development builds
- OTA updates configured via Expo Updates
- Location permissions required for core functionality
- Maps require Google Maps API key