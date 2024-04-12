import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { scale } from "react-native-size-matters";
import { BlurView } from "expo-blur";

const PreCancelationModal = ({ visible, closeModal, onPressCancel }) => {
  const handleBackButtonPress = () => {
    closeModal();
  };

  return (
    <>
        <Modal
          visible={visible}
          onRequestClose={handleBackButtonPress}
          transparent={true}
          animationType="fade"
        >
                <BlurView  style={{flex: 1}}tint="dark" intensity={40} blurReductionFactor={2}>
          <View style={styles.box}>
            <View style={styles.content}>
              <Text style={styles.title}>CANCELAR VIAGEM</Text>
              <Text style={styles.description}>
                Seu motorista já viajou por vários minutos. {"\n"}Se você
                cancelar esta viagem para solicitar uma nova imediatamente,
                poderá ter que esperar mais.
              </Text>
              <View
                style={{
                  justifyContent: "space-between",
                }}
              >
                <TouchableOpacity
                  onPress={closeModal}
                  style={styles.buttonnocancel}
                >
                  <Text style={{ color: "#fff" }}>
                    Continuar com este motorista
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.buttoncancel}
                  onPress={onPressCancel}
                >
                  <Text style={{ color: "#0089FF" }}>
                    Confirmar cancelamento
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
      </BlurView>

        </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  box: {
    backgroundColor: "#fff",
    borderRadius: scale(10),
    alignSelf: "center",
    marginVertical: "50%",
  },
  content: {
    marginHorizontal: scale(10),
    paddingVertical: scale(10),
  },
  buttonnocancel: {
    borderRadius: scale(7),
    padding: scale(15),
    alignItems: "center",
    backgroundColor: "#0089FF",
    marginBottom: scale(10),
  },
  buttoncancel: {
    borderRadius: scale(7),
    padding: scale(15),
    alignItems: "center",
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
  title: {
    fontSize: scale(16),
    color: "#0089FF",
  },
  description: {
    fontSize: scale(13),
    paddingVertical: scale(20),
  },
});
export default PreCancelationModal;
