import React from "react";
import {
  View,
  Text,
  ImageBackground,
  Image,
  TouchableOpacity,
} from "react-native";
import {
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
} from "@react-navigation/drawer";
import { useNavigation } from "@react-navigation/native"; // Import the necessary hooks from React Navigation
import Icon from "react-native-vector-icons/MaterialIcons";

import Ionicons from "react-native-vector-icons/Ionicons";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import { scale } from "react-native-size-matters";
import { UserContext } from "../../context/UserContext";
import { useContext } from "react";

const SideMenuDrawer = (props) => {
  const navigation = useNavigation();
  const { user,logout } = useContext(UserContext);

  return (
    <View style={{ flex: 1, backgroundColor: "#0089FF" }}>
      <DrawerContentScrollView
        contentContainerStyle={{ backgroundColor: "#0089FF" }}
      >
        <View style={{ flexDirection: "row", marginVertical: scale(15) }}>
          <View
            style={{
              borderRadius: scale(45),
              borderColor: "#fff",
              borderWidth: scale(2),
              marginHorizontal: scale(15),
              height: scale(65),
              width: scale(65),
            }}
          >
            <Image
              source={{
                uri: user?.photo,
              }}
              style={{
                height: "100%",
                width: "100%",
                borderRadius: scale(45),
              }}
            />
          </View>
          <View style={{ justifyContent: "center" }}>
            <Text style={{ color: "#fff", fontSize: scale(15) }}>
              {user?.name}
            </Text>
          </View>
        </View>
        <View
          style={{
            flex: 1,
            borderWidth: scale(1.5),
            borderColor: "#fff",
            marginTop: scale(15),
            marginBottom: scale(50),
          }}
        />
        <View style={{ flex: 1 }}>
          <DrawerItem
            label={() => (
              <Text style={{ color: "#fff", fontSize: scale(15) }}>Perfil</Text>
            )}
            onPress={() => navigation.navigate("Perfil", 123)}
            icon={({ color }) => (
              <Icon name="person" size={scale(25)} color={"#fff"} />
            )}
          />
          {/* <DrawerItem
            label={() => (
              <Text style={{ color: "#fff", fontSize: scale(15) }}>
                Notificações
              </Text>
            )}
            onPress={() => navigation.navigate("OTP", 123)}
            icon={({ color }) => (
              <Icon name="notifications" size={scale(25)} color={"#fff"} />
            )}
          /> */}
          {/* <DrawerItem
            label={() => (
              <Text style={{ color: "#fff", fontSize: scale(15) }}>
                Historico
              </Text>
            )}
            onPress={() => navigation.navigate("OTP", 123)}
            icon={({ color }) => (
              <Icon name="history-edu" size={scale(25)} color={"#fff"} />
            )}
          /> */}
          <DrawerItem
            label={() => (
              <Text style={{ color: "#fff", fontSize: scale(15) }}>
                Promoções
              </Text>
            )}
            onPress={() => navigation.navigate("Promocoes", 123)}
            icon={({ color }) => (
              <Icon name="monetization-on" size={scale(25)} color={"#fff"} />
            )}
          />
          <DrawerItem
            label={() => (
              <Text style={{ color: "#fff", fontSize: scale(15) }}>
                Convidar amigos
              </Text>
            )}
            onPress={() => navigation.navigate("Convidar")}
            icon={({ color }) => (
              <Icon name="person-add" size={scale(25)} color={"#fff"} />
            )}
          />
          <DrawerItem
            label={() => (
              <Text style={{ color: "#fff", fontSize: scale(15) }}>Ajuda</Text>
            )}
            onPress={() => logout()}
            icon={({ color }) => (
              <Icon name="help" size={scale(25)} color={"#fff"} />
            )}
          />
        </View>
      </DrawerContentScrollView>
      {/* <View style={{padding: 20, borderTopWidth: 1, borderTopColor: '#ccc'}}> */}
      {/* <TouchableOpacity onPress={() => {}} style={{paddingVertical: 15}}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Ionicons label={()=><Text style={{ color:"#fff", fontSize: scale(15) }}>share-social-outline" size={22} />
            <Text
              style={{
                fontSize: 15,
                fontFamily: 'Roboto-Medium',
                marginLeft: 5,
              }}>
              Tell a Friend
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {}} style={{paddingVertical: 15}}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Ionicons label={()=><Text style={{ color:"#fff", fontSize: scale(15) }}>exit-outline" size={22} />
            <Text
              style={{
                fontSize: 15,
                fontFamily: 'Roboto-Medium',
                marginLeft: 5,
              }}>
              Sign Out
            </Text>
          </View>
        </TouchableOpacity> */}
      {/* </View> */}
    </View>
  );
};

export default SideMenuDrawer;
