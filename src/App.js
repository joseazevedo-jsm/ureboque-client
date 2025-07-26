import { UserContextProvider } from "./context/UserContext";
import { UserLocationStateContextProvider } from "./context/UserLocationStateContext";
import AppNav from "./navigation/AppNav";
import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <UserContextProvider>
        <UserLocationStateContextProvider>
          <AppNav />
        </UserLocationStateContextProvider>
      </UserContextProvider>
    </ErrorBoundary>
  );
}

export default App;
