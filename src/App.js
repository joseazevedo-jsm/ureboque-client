import { UserContextProvider } from "./context/UserContext";
import { UserLocationStateContextProvider } from "./context/UserLocationStateContext";
import { AuthProvider } from "./context/AuthContext";
import { UserDataProvider } from "./context/UserDataContext";
import { SocketProvider } from "./context/SocketContext";
import AppNav from "./navigation/AppNav";
import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
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
