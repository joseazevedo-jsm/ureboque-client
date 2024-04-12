import React, { useRef } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { scale } from "react-native-size-matters";
import { Modal } from "react-native";
import { useRegisterModal } from "./components/useRegisterModal";

const OTPModal = ({
  visible,
  OTPChange,
  modalRegVisible,
  onChangeLoginState,
  number,
}) => {
  const {models, operations} = useRegisterModal(OTPChange)

  return (
    <>
      <Modal visible={visible} animationType="slide">
        <View style={styles.main}>
          <View style={styles.container}>
            <View
              style={{ paddingTop: scale(150), marginHorizontal: scale(10) }}
            >
              <Text style={styles.text}>
                Introduza o código na SMS enviada para
              </Text>
              <Text style={styles.text}>{number}</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Home")}>
                <Text
                  style={{
                    alignSelf: "flex-end",
                    fontSize: 12,
                    fontWeight: "bold",
                    color: "#0089ff",
                    bottom: 20,
                  }}
                >
                  (editar número)
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.otpContainer}>
              <View style={styles.otpBox}>
                <TextInput
                  ref={models.inputRef1}
                  style={styles.otpText}
                  keyboardType="numeric"
                  maxLength={1}
                  onChangeText={(text) => operations.handleOTPInputChange(text, 1)}
                />
              </View>
              <View style={styles.otpBox}>
                <TextInput
                  ref={models.inputRef2}
                  style={styles.otpText}
                  keyboardType="numeric"
                  maxLength={1}
                  onChangeText={(text) => operations.handleOTPInputChange(text, 2)}
                />
              </View>
              <View style={styles.otpBox}>
                <TextInput
                  ref={models.inputRef3}
                  style={styles.otpText}
                  keyboardType="numeric"
                  maxLength={1}
                  onChangeText={(text) => operations.handleOTPInputChange(text, 3)}
                />
              </View>
              <View style={styles.otpBox}>
                <TextInput
                  ref={models.inputRef4}
                  style={styles.otpText}
                  keyboardType="numeric"
                  maxLength={1}
                  onChangeText={(text) => operations.handleOTPInputChange(text, 4)}
                />
              </View>
            </View>
            <Text
              style={{
                alignSelf: "center",
                fontSize: 15,
                color: "#0089ff",
                paddingVertical: scale(20),
              }}
            >
              Reenviar código em 54 segundos
            </Text>
            <View style={styles.logo}>
              <Image
                source={require("../../../../resources/icons/UREB_LOGO.png")}
                resizeMode="cover"
                style={{ tintColor: "#C6E4FF" }}
              />
              <Image
                source={require("../../../../resources/icons/UREB_TEXT.png")}
                resizeMode="cover"
                style={{ tintColor: "#C6E4FF" }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  main: {
    backgroundColor: "#FFF",
    flex: 1,
    justifyContent: "space-around",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    marginHorizontal: scale(20),
  },
  logo: {
    alignItems: "center",
    paddingVertical: scale(100),
  },
  otpContainer: {
    marginHorizontal: scale(10),
    justifyContent: "space-evenly",
    flexDirection: "row",
    paddingTop: scale(20),
  },
  otpBox: {
    borderColor: "#0089ff",
    borderWidth: scale(3),
    borderRadius: scale(20),
    marginHorizontal: scale(10),
    alignSelf: "center",
  },
  otpText: {
    fontSize: 30,
    color: "#8D8D8D",
    textAlign: "center",
    paddingVertical: scale(20),
    paddingHorizontal: scale(20),
  },
  text: {
    fontSize: 17.5,
    color: "#000",
  },
});

export default OTPModal;
