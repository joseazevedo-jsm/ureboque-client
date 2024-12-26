import React from "react";
import {
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { scale } from "react-native-size-matters";
import Icon from "react-native-vector-icons/MaterialIcons";

import { useConfirmationModal } from "./components/useConfirmationModal";
import StarRating from "../../cards/starRating";
const ConfirmationModal = ({
  visible,
  closeModal,
  driver,
  payment_total,
  payment_type,
  service,
}) => {
  const { models, operations } = useConfirmationModal(service?._id, closeModal);
  const handeBackButtonPress = () => {
    closeModal();
  };

  return (
    <Modal onRequestClose={closeModal} visible={visible} animationType="slide">
      <View style={styles.container}>
      
        <View style={styles.overlay}>
        <TouchableOpacity style={styles.goback} onPress={handeBackButtonPress}>
          <Icon name="close" size={scale(25)} color="#fff" />
        </TouchableOpacity>
          <View style={{ marginTop: scale(35), alignItems: "center" }}>
            <Text
              style={{
                fontSize: scale(16),
                color: "#fff",
                fontWeight: "bold",
                padding: scale(30),
              }}
            >
              SUA CONTA
            </Text>
            <Text
              style={{ fontSize: scale(25), color: "#fff", fontWeight: "bold" }}
            >
              AOA {payment_total.toLocaleString()}
            </Text>
            <Text style={{ fontSize: scale(10), color: "#fff" }}>
              A SER PAGO EM {payment_type}
            </Text>
          </View>
        </View>

        <View style={styles.profile}>
          <View style={{ alignItems: "center" }}>
            <Image
              source={{
                uri: driver?.photo || null,
              }}
              style={{
                width: scale(110),
                height: scale(110),
                borderRadius: scale(60),
              }}
            />
            <Text
              style={{
                fontSize: scale(18),
                marginTop: scale(15),
              }}
            >
              {driver.name}
            </Text>
          </View>

          <Text
            style={{
                marginTop: scale(15),
              fontSize: scale(14),
              color: "#ccc",
              marginBottom: scale(15),
            }}
          >
            Avalie o Motorista
          </Text>

          <StarRating rating={models.rating} onRate={operations.handleRate} />
        </View>
        <View style={{ alignItems: "center", marginTop: scale(150) }}>
          <TouchableOpacity style={{}}>
            <Text style={{ color: "#0089ff", fontSize: scale(15), fontWeight: "bold" }}>
              Algum problema?
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              marginTop: scale(20),
              backgroundColor: "#0089ff",
              borderRadius: scale(7),
              width: scale(300),
              height: scale(40),
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={operations.handleConfirmRate}
          >
            <Text style={{ color: "#fff", fontSize: scale(15) }}>
              Confirmar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  goback: {
    width: scale(50),
    height: scale(50),
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    left: scale(10),
    top: scale(20),
  },
  profile: {
    width: scale(275),
    height: scale(275),
    position: "absolute",
    borderRadius: scale(45 / 2),
    backgroundColor: "#fff",
    alignSelf: "center",
    top: "35%",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: scale(2), height: scale(2) },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 8,
  },
  overlay: {
    width: "100%",
    height: "62%",
    borderBottomStartRadius: scale(250),
    borderBottomEndRadius: scale(250),
    backgroundColor: "#0089ff",
    alignItems: "center",
  },
});
export default ConfirmationModal;
