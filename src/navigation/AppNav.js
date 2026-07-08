import { createStackNavigator, CardStyleInterpolators, TransitionSpecs } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import LoginScreen from "../screens/LoginScreen";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { UserContext } from "../context/UserContext";
import { useContext, useRef } from "react";
import HomeMenu from "./HomeMenu";
import Logger from '../utils/Logger';
import sentryService from '../services/SentryService';
import { navigationRef } from '../services/NavigationService';
import { animations, colors } from '../theme';

// Registration screens
import RegistrationWelcomeScreen from "../screens/RegistrationWelcomeScreen";
import PasswordCreationScreen from "../screens/PasswordCreationScreen";
import PersonalInfoScreen from "../screens/PersonalInfoScreen";
import RegistrationSuccessScreen from "../screens/RegistrationSuccessScreen";

const Stack = createStackNavigator();

const springTransition = {
  animation: 'spring',
  config: { ...animations.spring.release, mass: 0.8, overshootClamping: false },
};

const horizontalSpring = {
  gestureEnabled: true,
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  transitionSpec: { open: springTransition, close: springTransition },
};

const verticalSpring = {
  gestureEnabled: true,
  cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
  transitionSpec: { open: springTransition, close: springTransition },
};

const fadeTransition = {
  gestureEnabled: false,
  cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
  transitionSpec: {
    open: { animation: 'timing', config: { duration: animations.duration.slow } },
    close: { animation: 'timing', config: { duration: animations.duration.normal } },
  },
};

const AppNav = () => {
  const { isLoading, userToken } = useContext(UserContext);
  const routeNameRef = useRef();

  // Navigation state change handler
  const onNavigationStateChange = (state) => {
    try {
      if (state) {
        const previousRouteName = routeNameRef.current;
        const currentRouteName = getCurrentRouteName(state);

        if (previousRouteName !== currentRouteName) {
          // Log navigation event
          Logger.logNavigation(
            previousRouteName || 'Initial',
            currentRouteName,
            { 
              stateIndex: state.index,
              stateRoutesCount: state.routes?.length 
            }
          );

          // Add Sentry breadcrumb for navigation
          sentryService.addNavigation(
            previousRouteName || 'Initial',
            currentRouteName,
            {
              stateIndex: state.index,
              stateRoutesCount: state.routes?.length,
              timestamp: Date.now()
            }
          );

          // Set current route name in Sentry context
          sentryService.setContext('navigation', {
            currentScreen: currentRouteName,
            previousScreen: previousRouteName,
            timestamp: new Date().toISOString()
          });
        }

        routeNameRef.current = currentRouteName;
      }
    } catch (error) {
      Logger.error('AppNav', 'Navigation state change error', { 
        error: error.message,
        stack: error.stack 
      });
    }
  };

  // Function to get current route name from navigation state
  const getCurrentRouteName = (state) => {
    if (!state || !state.routes || state.routes.length === 0) {
      return 'Unknown';
    }

    const route = state.routes[state.index];
    
    if (route.state) {
      // Nested navigator
      return getCurrentRouteName(route.state);
    }

    return route.name;
  };

  // Show a neutral loading screen while the auth token is being read from storage.
  // AppLoadingContext handles the splash, but this prevents a brief flash of the
  // wrong screen if the token is still undefined.
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer 
      ref={navigationRef}
      onStateChange={onNavigationStateChange}
      onReady={() => {
        // Set initial route name
        const initialRouteName = getCurrentRouteName(navigationRef.current?.getRootState());
        routeNameRef.current = initialRouteName;
        
        // Log initial navigation state
        Logger.info('AppNav', 'Navigation ready', { 
          initialRoute: initialRouteName,
          isAuthenticated: !!userToken 
        });

        // Set initial Sentry navigation context
        sentryService.setContext('navigation', {
          currentScreen: initialRouteName,
          initialLoad: true,
          timestamp: new Date().toISOString()
        });

        sentryService.addUserAction('app_navigation_ready', {
          initialScreen: initialRouteName,
          isAuthenticated: !!userToken
        });
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false, ...horizontalSpring }}>
        {userToken === null ? (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
            />
            <Stack.Screen
              name="RegistrationWelcome"
              component={RegistrationWelcomeScreen}
              options={verticalSpring}
            />
            <Stack.Screen
              name="PasswordCreation"
              component={PasswordCreationScreen}
              options={verticalSpring}
            />
            <Stack.Screen
              name="PersonalInfo"
              component={PersonalInfoScreen}
              options={verticalSpring}
            />
            <Stack.Screen
              name="RegistrationSuccess"
              component={RegistrationSuccessScreen}
              options={verticalSpring}
            />
          </>
        ) : (
          <Stack.Screen
            name="HomeMenu"
            component={HomeMenu}
            options={fadeTransition}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});

export default AppNav;
