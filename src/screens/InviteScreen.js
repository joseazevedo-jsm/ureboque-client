import React from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { scale } from "react-native-size-matters";
import { UserContext } from "../context/UserContext";
import { useContext } from "react";
import { useNavigation } from "@react-navigation/native"; // Import the necessary hooks from React Navigation
import Icon from "react-native-vector-icons/MaterialIcons";
import { useInviteScreen } from "../components/invite/useInviteScreen";

const InviteScreen = () => {
  const { models, operations } = useInviteScreen();

  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            style={{ marginTop: scale(50) }}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={scale(25)} color="#0089FF" />
          </TouchableOpacity>
          <Text
            style={{
              fontWeight: "bold",
              fontSize: scale(18),
              marginTop: scale(50),
              textAlign: "center",
              color: "#0089FF",
            }}
          >
            CONVIDAR AMIGOS
          </Text>
          <View />
        </View>
        <View
          style={{
            paddingRight: scale(10),
          }}
        >
          <Image
            source={require("../../resources/icons/SMS_ICON.png")}
            resizeMode="cover"
          />
          <Text style={styles.title}>ENVIE E GANHE 50% DE DESCONTO</Text>
          <View style={styles.info}>
            <View style={styles.circle}>
              <Text style={styles.circleInfo}>1</Text>
            </View>

            <Text>
              Compartilhe com um amigo {"\n"}Seu amigo receberá um desconto de
              30% na sua primeira viagem
            </Text>
          </View>
          <View style={styles.info}>
            <View style={styles.circle}>
              <Text style={styles.circleInfo}>2</Text>
            </View>
            <Text>
              Ganhe 50% de desconto {"\n"}Quando o seu amigo completar a
              primeira viagem, você receberá um desconto de 50% na próxima
              viagem
            </Text>
          </View>
        </View>
        <View style={styles.bottom}>
          <Text>Seu código de desconto é: </Text>
          <View style={{ flexDirection: "row", marginTop: scale(10)}}> 
            <Image
              source={require("../../resources/icons/COPY_ICON.png")}
              resizeMode="cover"
              style={{
                width: scale(20),
                height: scale(20),
                marginRight: scale(5),
              }}
            />
            <Text> {models.inviteCode}</Text>
          </View>

          <TouchableOpacity style={styles.button}>
            <Text style={{ color: "#fff", fontSize: scale(18)}}>
              COMPARTILHAR
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginLeft: scale(20),
    marginRight: scale(20),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: scale(30),
  },

  bottom: { marginTop: scale(50) },

  button: {
    width: scale(280),
    height: scale(55),
    borderRadius: scale(7),
    backgroundColor: "#0089ff",
    marginHorizontal: scale(30),
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginVertical: scale(70),
  },

  title: {
    fontSize: scale(29),
    fontWeight: "bold",
    color: "#0089FF",
    paddingVertical: scale(15),
  },
  info: {
    flexDirection: "row",
    paddingVertical: scale(15),
  },
  circle: {
    width: scale(18),
    height: scale(18),
    borderRadius: scale(45),
    backgroundColor: "#000",
    marginRight: scale(10),
  },
  circleInfo: {
    color: "#fff",
    alignSelf: "center",
  },

  content: {
    justifyContent: "space-between",
  },

  profileImageContainer: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(75),
    borderColor: "#0089FF",
    borderWidth: scale(2),
    padding: scale(3),
    alignSelf: "center",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  detailsContainer: {
    marginTop: scale(100),
    marginLeft: scale(15),
  },
  name: {
    fontSize: scale(18),
    fontWeight: "bold",
    marginBottom: scale(10),
  },
  bio: {
    fontSize: scale(15),
    color: "gray",
  },
});

export default InviteScreen;
