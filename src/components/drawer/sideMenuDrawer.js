import React, { useContext } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
} from "react-native";
import {
  DrawerContentScrollView,
  DrawerItem,
} from "@react-navigation/drawer";
import { useNavigation } from "@react-navigation/native";
import { scale } from "react-native-size-matters";
import { UserContext } from "../../context/UserContext";

// Import custom icons
import ProfileIcon from "../../../resources/icons/side_bar/profile.png";
import PromotionsIcon from "../../../resources/icons/side_bar/discount.png";
import InviteIcon from "../../../resources/icons/side_bar/add_friend.png";
import HelpIcon from "../../../resources/icons/side_bar/help.png";

const UserProfile = ({ user }) => (
  <View style={styles.userProfileContainer}>
    <View style={styles.userImageContainer}>
      <Image
        source={{ uri: user?.photo }}
        style={styles.userImage}
      />
    </View>
    <View style={styles.userNameContainer}>
      <Text style={styles.userName}>{user?.name}</Text>
    </View>
  </View>
);

const DrawerMenuItem = ({ label, iconSource, onPress }) => (
  <DrawerItem
    label={() => <Text style={styles.drawerItemLabel}>{label}</Text>}
    onPress={onPress}
    icon={({ color }) => (
      <Image
        source={iconSource}
        style={styles.drawerItemIcon}
        resizeMode="contain"
      />
    )}
  />
);

const SideMenuDrawer = (props) => {
  const navigation = useNavigation();
  const { user, logout } = useContext(UserContext);

  return (
    <View style={styles.container}>
      <DrawerContentScrollView contentContainerStyle={styles.drawerContent}>
        <UserProfile user={user} />
        <View style={styles.divider} />
        <View style={styles.drawerItemsContainer}>
          <DrawerMenuItem
            label="Perfil"
            iconSource={ProfileIcon}
            onPress={() => navigation.navigate("Perfil", 123)}
          />
          <DrawerMenuItem
            label="Promoções"
            iconSource={PromotionsIcon}
            onPress={() => navigation.navigate("Promocoes", 123)}
          />
          <DrawerMenuItem
            label="Convidar amigos"
            iconSource={InviteIcon}
            onPress={() => navigation.navigate("Convidar")}
          />
          <DrawerMenuItem
            label="Ajuda"
            iconSource={HelpIcon}
            onPress={logout}
          />
        </View>
      </DrawerContentScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0089FF",
    borderBottomRightRadius: scale(25),
    borderTopRightRadius: scale(25),
    elevation: 10,
    overflow: "hidden",
  },
  drawerContent: {
    backgroundColor: "#0089FF",
  },
  userProfileContainer: {
    flexDirection: "row",
    marginVertical: scale(15),
  },
  userImageContainer: {
    borderRadius: scale(45),
    borderColor: "#fff",
    borderWidth: scale(2),
    marginHorizontal: scale(15),
    height: scale(65),
    width: scale(65),
  },
  userImage: {
    height: "100%",
    width: "100%",
    borderRadius: scale(45),
  },
  userNameContainer: {
    justifyContent: "center",
  },
  userName: {
    color: "#fff",
    fontSize: scale(15),
  },
  divider: {
    flex: 1,
    borderWidth: scale(1.5),
    borderColor: "#fff",
    marginTop: scale(15),
    marginBottom: scale(50),
  },
  drawerItemsContainer: {
    flex: 1,
  },
  drawerItemLabel: {
    color: "#fff",
    fontSize: scale(15),
  },
  drawerItemIcon: {
    width: scale(23),
    height: scale(23),
    tintColor: "#fff",
  },
});

export default SideMenuDrawer;
