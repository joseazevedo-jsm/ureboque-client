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
import { useNavigation } from "@react-navigation/native"; // Import the necessary hooks from React Navigation
import Icon from "react-native-vector-icons/MaterialIcons";
import useProfileScreen from "../components/profile/useProfileScreen";

const ProfileScreen = () => {
  const { models, operations } = useProfileScreen();
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View>
        <View style={{ height: "20%", flexDirection: "row" }}>
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
              marginLeft: scale(100),
              textAlign: "center",
              color: "#0089FF",
            }}
          >
            PERFIL
          </Text>
        </View>

        <View style={styles.profileImageContainer}>
          <TouchableOpacity onPress={operations.handleOpenImagePicker}>
          <Image
             source={{
              uri:models?.image ? models?.image : models?.user?.photo,
            }}
            style={styles.profileImage}
          />
          </TouchableOpacity> 
        </View>
        <View>
          <TextInput
            style={{
              color: "black",
              fontSize: scale(14),
              borderBottomWidth: scale(0.5),
              padding: scale(5),
              marginBottom: scale(15),
            }}
            placeholder={models?.user?.name.split(" ", 2)[0]}
            placeholderTextColor={"#000"}
            onChangeText={operations.handleNameChange}
          />
          <TextInput
            style={{
              color: "black",
              fontSize: scale(14),
              borderBottomWidth: scale(0.5),
              padding: scale(5),
              marginBottom: scale(15),
            }}
            placeholder={models?.user?.name.split(" ", 2)[1]}
            placeholderTextColor={"#000"}
            onChangeText={operations.handleSurnameChange}
          />
          <View style={{ flexDirection: "row" }}>
            <TextInput
              style={{
                color: "black",
                fontSize: scale(14),
                borderBottomWidth: scale(0.5),
                padding: scale(5),
                marginBottom: scale(15),
                marginRight: scale(15),
                width: scale(75),
              }}
              placeholder="+244"
              placeholderTextColor={"#000"}
            />
            <TextInput
              style={{
                color: "black",
                fontSize: scale(14),
                borderBottomWidth: scale(0.5),
                padding: scale(5),
                marginBottom: scale(15),
                width: "71%",
              }}
              placeholder={models?.user?.phone}
              placeholderTextColor={"#000"}
              onChangeText={operations.handlePhoneNumberChange}
            />
          </View>
          <TextInput
            style={{
              color: "black",
              fontSize: scale(14),
              borderBottomWidth: scale(0.5),
              padding: scale(5),
              marginBottom: scale(15),
            }}
            placeholder={models?.user?.email}
            placeholderTextColor={"#000"}
            onChangeText={operations.handleEmailChange}
          />
        </View>

        <TouchableOpacity
          style={{
            width: scale(310),
            height: scale(55),
            borderRadius: scale(7),
            backgroundColor: "#0089ff",
            marginHorizontal: scale(20),
            justifyContent: "center",
            alignItems: "center",
            alignSelf: "center",
            marginTop: scale(20),
            marginBottom: scale(35),
          }}
          onPress={operations.handleSaveChanges}
        >
          <Text style={{ color: "#fff", fontSize: scale(18) }}>
            Salvar alterações
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={{}}>
          <View style={{ flexDirection: "row" ,}}>
            <Icon name="construction" size={scale(25)} color="#000" />
            <Text style={{ fontSize: scale(18) ,marginLeft: scale(20), marginRight: scale(150)}}>Definições</Text>
            <Icon
              name="arrow-forward-ios"
              size={scale(25)}
              color="#000"
            />
          </View>
        </TouchableOpacity>
      </View>
      <TouchableOpacity>
        <View style={{flexDirection: "row", justifyContent: "center", marginTop: scale(50)}}>
          <Icon name="logout" size={scale(25)} color="#0089FF" />
          <Text style={{ fontSize: scale(18), color: "#0089FF", marginLeft: scale(10)}} >Sair</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginLeft: scale(20),
    marginRight: scale(20),
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
    borderRadius: scale(75),
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

export default ProfileScreen;
