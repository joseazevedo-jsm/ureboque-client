import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import SideMenuDrawer from "../components/drawer/sideMenuDrawer";
import { scale } from "react-native-size-matters";
import MapScreen from "../screens/MapScreen";
import ProfileScreen from "../screens/ProfileScreen";
import PromotionScreen from "../screens/PromotionScreen";
import InviteScreen from "../screens/InviteScreen";

const Drawer = createDrawerNavigator();

const HomeMenu = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <SideMenuDrawer {...props} />}
      screenOptions={drawerScreenOptions}
    >
      <Drawer.Screen name="Map" component={MapScreen} />
      <Drawer.Screen name="Promocoes" component={PromotionScreen} />
      <Drawer.Screen name="Convidar" component={InviteScreen} />
      <Drawer.Screen name="Perfil" component={ProfileScreen} />
    </Drawer.Navigator>
  );
};

const drawerScreenOptions = {
  headerShown: false,
  drawerActiveBackgroundColor: "#fff",
  drawerActiveTintColor: "black",
  drawerInactiveTintColor: "#333",
  drawerLabelStyle: {
    marginLeft: -25,
    fontSize: 15,
  },
  drawerStyle: {
    width: scale(280),
    backgroundColor: "transparent",
  },
};

export default HomeMenu;
