import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import React from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { scale } from "react-native-size-matters";

const UserCarInfo = ({
  handleBrandInputValueChange,
  handleModelInputValueChange,
  handleLicenseInputValueChange,
  handleColorInputValueChange,
  handleConfirmButtonPress,
}) => {
  return (
    <View style={styles.container}>
      <Text
        style={{
          fontSize: scale(18),
          alignSelf: "center",
          color: "#0089FF",
          fontWeight: "900",
          paddingVertical: scale(10),
        }}
      >
        QUAL CARRO VAI REBOCAR?
      </Text>

      <View style={styles.containerInputs}>
        <View style={styles.row}>
          <BottomSheetTextInput
            onChangeText={handleBrandInputValueChange}
            style={styles.input}
            placeholder="Marca"
            placeholderTextColor={"#000"}
          />
          <BottomSheetTextInput
            onChangeText={handleModelInputValueChange}
            style={styles.input}
            placeholder="Modelo"
            placeholderTextColor={"#000"}
          />
        </View>
        <View style={styles.row}>
          <BottomSheetTextInput
            onChangeText={handleLicenseInputValueChange}
            style={styles.input}
            placeholder="Matricula"
            placeholderTextColor={"#000"}
          />
          <BottomSheetTextInput
            onChangeText={handleColorInputValueChange}
            style={styles.input}
            placeholder="Cor"
            placeholderTextColor={"#000"}
          />
        </View>
      </View>
      <View>
        <TouchableOpacity
          style={styles.button}
          onPress={handleConfirmButtonPress}
        >
          <Text style={{ color: "#fff", fontSize: scale(18) }}>Confirmar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: scale(20),
  },
  button: {
    borderRadius: scale(7),
    backgroundColor: "#0089ff",
    alignItems: "center",
    marginHorizontal: scale(10),
    paddingVertical: scale(10),
  },
  input: {
    flex: 1,
    width: scale(318),
    height: scale(50),
    borderRadius: scale(7),
    borderWidth: scale(4),
    borderColor: "#0089ff",
    overflow: "hidden",
    marginHorizontal: scale(10),
    paddingHorizontal: scale(10),
  },
  row: {
    flexDirection: "row",
    marginBottom: scale(20),
  },
  containerInputs: {
    // marginTop: scale(10),
  },
});

export default UserCarInfo;
