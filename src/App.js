import { UserContextProvider } from "./context/UserContext";
import { UserLocationStateContextProvider } from "./context/UserLocationStateContext";
import AppNav from "./navigation/AppNav";

function App() {
  return (
    <UserContextProvider>
        <UserLocationStateContextProvider>
          <AppNav />
        </UserLocationStateContextProvider>
    </UserContextProvider>
  );
}

export default App;
