import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import LoginScreen from "../screens/LoginScreen";
import { ActivityIndicator, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { isLoggedIn } from "../store/slices/userSlice";
import HomeMenu from "./HomeMenu";

const Stack = createStackNavigator();

const AppNav = () => {
  const dispatch = useDispatch();
  const { isLoading, userToken } = useSelector((state) => state.user);

  useEffect(() => {
    if (!userToken) {
      dispatch(isLoggedIn());
    }
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {userToken === null ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <Stack.Screen
            name="HomeMenu"
            component={HomeMenu}
            options={{ headerShown: false }}
          />
        )}
        {/*            
        <Stack.Screen
          name="Map"
          component={MapScreen}
          options={{ headerShown: false }}
        /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNav;
