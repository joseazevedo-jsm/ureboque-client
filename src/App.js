import { UserContextProvider } from "./context/UserContext";
import { UserLocationStateContextProvider } from "./context/UserLocationStateContext";
import { AuthProvider } from "./context/AuthContext";
import { UserDataProvider } from "./context/UserDataContext";
import { SocketProvider } from "./context/SocketContext";
import AppNav from "./navigation/AppNav";
import ErrorBoundary from './components/common/ErrorBoundary';
import Logger from './utils/Logger';
import React, { useEffect } from 'react';

function App() {
  useEffect(() => {
    Logger.info('App', 'Application started', {
      environment: __DEV__ ? 'development' : 'production',
      timestamp: new Date().toISOString(),
      sessionId: Logger.getSessionId()
    });
    
    // Log app lifecycle events
    const handleAppStateChange = (nextAppState) => {
      Logger.info('App', `App state changed to: ${nextAppState}`);
    };
    
    return () => {
      Logger.info('App', 'Application cleanup initiated');
    };
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <UserDataProvider>
          <SocketProvider>
            <UserContextProvider>
              <UserLocationStateContextProvider>
                <AppNav />
              </UserLocationStateContextProvider>
            </UserContextProvider>
          </SocketProvider>
        </UserDataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
