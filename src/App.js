import { Provider } from 'react-redux';
import { store } from './store';
import AppNav from "./navigation/AppNav";
import ErrorBoundary from './utils/ErrorBoundary';
import { useEffect } from 'react';
import * as Updates from 'expo-updates';

function App() {
  useEffect(() => { 
    async function checkForUpdates() {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          // Only reload the app if we're not in development
          if (!__DEV__) {
            await Updates.reloadAsync();
          }
        }
      } catch (error) {
        console.log('Error checking for updates:', error);
      }
    }

    checkForUpdates();
  }, []);

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <AppNav />
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
