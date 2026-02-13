import React, { useContext, useCallback } from "react";
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
import Icon from "react-native-vector-icons/MaterialIcons";
import { UserContext } from "../../context/UserContext";
import { useTripState } from "../../context/TripStateContext";
import { useAlert } from "../../context/AlertContext";

// Import custom icons
import ProfileIcon from "../../../resources/icons/side_bar/profile.png";
import PromotionsIcon from "../../../resources/icons/side_bar/discount.png";
import InviteIcon from "../../../resources/icons/side_bar/add_friend.png";
import HistoryIcon from "../../../resources/icons/side_bar/history.png";
import HelpIcon from "../../../resources/icons/side_bar/help.png";

const UserProfile = ({ user }) => (
  <View style={styles.userProfileContainer}>
    <View style={styles.userImageContainer}>
      <Image
        source={user?.photo ? { uri: user.photo } : require('../../../resources/icons/side_bar/profile.png')}
        style={styles.userImage}
      />
    </View>
    <View style={styles.userNameContainer}>
      <Text style={styles.userName}>{user?.name}</Text>
    </View>
  </View>
);

const DrawerMenuItem = ({ label, iconSource, iconName, onPress }) => (
  <DrawerItem
    label={() => <Text style={styles.drawerItemLabel}>{label}</Text>}
    onPress={onPress}
    icon={() =>
      iconName ? (
        <Icon name={iconName} size={scale(22)} color="#fff" style={{ opacity: 0.9 }} />
      ) : (
        <Image
          source={iconSource}
          style={styles.drawerItemIcon}
          resizeMode="contain"
        />
      )
    }
  />
);

const SideMenuDrawer = (props) => {
  const navigation = useNavigation();
  const { user, logout } = useContext(UserContext);
  const { isTripActive } = useTripState();
  const { showAlert } = useAlert();

  const navigateWithGuard = useCallback((screenName, params) => {
    if (isTripActive) {
      showAlert({
        type: 'confirmation',
        title: 'Viagem em andamento',
        message: 'Tem uma viagem ativa. Deseja sair desta tela?',
        buttons: [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Continuar',
            onPress: () => navigation.navigate(screenName, params),
          },
        ],
      });
    } else {
      navigation.navigate(screenName, params);
    }
  }, [isTripActive, showAlert, navigation]);

  const handleLogout = useCallback(() => {
    showAlert({
      type: 'confirmation',
      title: 'Terminar Sessão',
      message: 'Tem certeza que deseja sair da sua conta?',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () => logout(),
        },
      ],
    });
  }, [showAlert, logout]);

  return (
    <View style={styles.container}>
      <DrawerContentScrollView contentContainerStyle={styles.drawerContent}>
        <UserProfile user={user} />
        <View style={styles.divider} />
        <View style={styles.drawerItemsContainer}>
          <DrawerMenuItem
            label="Início"
            iconName="home"
            onPress={() => navigateWithGuard("Map")}
          />
          <DrawerMenuItem
            label="Perfil"
            iconSource={ProfileIcon}
            onPress={() => navigateWithGuard("Perfil", 123)}
          />
          <DrawerMenuItem
            label="Histórico"
            iconSource={HistoryIcon}
            onPress={() => navigateWithGuard("Historico")}
          />
          <DrawerMenuItem
            label="Promoções"
            iconSource={PromotionsIcon}
            onPress={() => navigateWithGuard("Promocoes", 123)}
          />
          <DrawerMenuItem
            label="Convidar amigos"
            iconSource={InviteIcon}
            onPress={() => navigateWithGuard("Convidar")}
          />
          <DrawerMenuItem
            label="Sair"
            iconSource={HelpIcon}
            onPress={handleLogout}
          />
        </View>
      </DrawerContentScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    borderTopRightRadius: scale(30),
    borderBottomRightRadius: scale(30),
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  drawerContent: {
    paddingTop: scale(20),
    paddingHorizontal: scale(10),
    backgroundColor: '#0089FF',
    flex: 1,
  },
  userProfileContainer: {
    flexDirection: "row",
    alignItems: 'center',
    paddingVertical: scale(24),
    paddingHorizontal: scale(10),
    marginBottom: scale(10),
  },
  userImageContainer: {
    borderRadius: scale(40),
    borderColor: "rgba(255,255,255,0.3)",
    borderWidth: 2,
    padding: 3,
    marginRight: scale(16),
  },
  userImage: {
    height: scale(60),
    width: scale(60),
    borderRadius: scale(30),
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  userNameContainer: {
    justifyContent: "center",
    flex: 1,
  },
  userName: {
    color: "#fff",
    fontSize: scale(18),
    fontWeight: "700",
    marginBottom: scale(4),
    letterSpacing: 0.3,
  },
  userRole: { // Added role text if needed
    color: "rgba(255,255,255,0.7)",
    fontSize: scale(12),
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginHorizontal: scale(10),
    marginBottom: scale(20),
  },
  drawerItemsContainer: {
    flex: 1,
  },
  drawerItemLabel: {
    color: "#fff",
    fontSize: scale(15),
    fontWeight: "600",
    marginLeft: scale(-10), // Adjust alignment with icon
  },
  drawerItem: {
    borderRadius: scale(12),
    marginVertical: scale(4),
    paddingVertical: scale(4),
  },
  drawerItemIcon: {
    width: scale(22),
    height: scale(22),
    tintColor: "#fff",
    opacity: 0.9,
  },
});

export default SideMenuDrawer;
