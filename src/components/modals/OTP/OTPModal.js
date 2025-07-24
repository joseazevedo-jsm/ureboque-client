import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { scale } from "react-native-size-matters";
import OTPInputComponent from "./OTPInputComponent";
import Icon from "react-native-vector-icons/MaterialIcons";

const OTPModal = ({
  visible,
  OTPChange,
  number,
  onClose,
  isEmail = false,
}) => {
  return (
    <Modal 
      visible={visible} 
      animationType="fade" 
      transparent
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={24} color="#707070" />
          </TouchableOpacity>

          <Text style={styles.title}>VERIFICAÇÃO</Text>
          
          <View style={styles.content}>
            <Text style={styles.subtitle}>
              Digite o código enviado para {isEmail ? 'o email:' : 'o número:'}
            </Text>
            <Text style={styles.contactInfo}>{number}</Text>
            
            <View style={styles.otpContainer}>
              <OTPInputComponent onOTPFilled={OTPChange} />
            </View>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={() => {
                // Add resend functionality here
              }}
            >
              <Text style={styles.resendText}>Reenviar código</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    width: '85%',
    borderRadius: scale(15),
    paddingVertical: scale(20),
    paddingHorizontal: scale(15),
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    right: scale(15),
    top: scale(15),
    zIndex: 1,
  },
  title: {
    fontSize: scale(28),
    fontWeight: "bold",
    color: "#0089FF",
    textAlign: "center",
    marginTop: scale(10),
    marginBottom: scale(20),
  },
  content: {
    alignItems: 'center',
  },
  subtitle: {
    fontSize: scale(16),
    color: "#707070",
    textAlign: "center",
    marginBottom: scale(10),
  },
  contactInfo: {
    fontSize: scale(18),
    fontWeight: "bold",
    color: "#0089FF",
    textAlign: "center",
    marginBottom: scale(30),
  },
  otpContainer: {
    marginVertical: scale(20),
  },
  resendButton: {
    alignItems: "center",
    marginTop: scale(20),
  },
  resendText: {
    color: "#0089FF",
    fontSize: scale(16),
    textDecorationLine: "underline",
  },
});

export default OTPModal;
