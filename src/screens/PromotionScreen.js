import React from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
} from "react-native";
import { scale } from "react-native-size-matters";
import { UserContext } from "../context/UserContext";
import { useContext } from "react";
import { useNavigation } from "@react-navigation/native"; // Import the necessary hooks from React Navigation
import Icon from "react-native-vector-icons/MaterialIcons";
import { usePromotionScreen } from "../components/promotion/usePromotionScreen";
import DiscountItem from "../components/cards/discountItem";
import { KeyboardAvoidingView } from "react-native";
import { Platform } from "react-native";

const PromotionScreen = () => {
  const { models, operations } = usePromotionScreen();

  const navigation = useNavigation();

  const isPromoActive = models.user?.discount && models.user?.discount.active

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboard}
    >
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
              PROMOÇÕES
            </Text>
            <View />
          </View>
          <View
            style={{
              paddingVertical: scale(10),
            }}
          >
            {isPromoActive && (
              <DiscountItem
                code={models.user.discount.promotion.code}
                description={models.user.discount.promotion.description}
              />
            )}
          </View>
          <View style={styles.bottom}>
            <TextInput
              style={{
                color: "black",
                fontSize: scale(14),
                borderBottomWidth: scale(0.5),
                borderColor: "#6B6969",
                padding: scale(5),
                marginBottom: scale(15),
              }}
              placeholder={"Inserir código promocional"}
              placeholderTextColor={"#6B6969"}
              onChangeText={operations.onCodeTextChange}
              // editable={!models.user.discount}
            />
            <TouchableOpacity
              style={
                isPromoActive
                  ? [styles.button, { backgroundColor: "#6B6969" }]
                  : [styles.button, { backgroundColor: "#0089FF" }]
              }
              onPress={operations.handleActivateCode}
              disabled={isPromoActive}
            >
              <Text style={{ color: "#fff", fontSize: scale(18) }}>
                Adicionar
              </Text>
            </TouchableOpacity>
            {isPromoActive && (
              <Text style={{ color: "red", fontSize: scale(10) }}>
                Codigo promo já se encontra activo !!
              </Text>
            )}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
    justifyContent: "flex-end", // Pushes content above the keyboard
  },
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
  bottom: {paddingVertical:scale(15)},
  button: {
    width: scale(310),
    height: scale(55),
    borderRadius: scale(7),
    marginHorizontal: scale(20),
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginVertical: scale(7),
  },
  content: {
    justifyContent: "space-between",
    flex: 1,
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

export default PromotionScreen;
