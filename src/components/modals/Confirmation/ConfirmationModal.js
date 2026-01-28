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
import { colors, shadows, borderRadius, spacing, typography } from "../../../theme";

const imgDef =
  "https://w7.pngwing.com/pngs/178/595/png-transparent-user-profile-computer-icons-login-user-avatars-thumbnail.png";
  
const ConfirmationModal = ({
  visible,
  closeModal,
  payment_total,
  payment_type,
  service,
}) => {
  const { models, operations } = useConfirmationModal(service, closeModal);
  const handeBackButtonPress = () => {
    closeModal();
  };

  return (
    <Modal onRequestClose={closeModal} visible={visible} animationType="fade">
      <View style={styles.container}>

        <View style={styles.overlay}>
        <TouchableOpacity style={styles.goback} onPress={handeBackButtonPress}>
          <Icon name="close" size={scale(25)} color="#fff" />
        </TouchableOpacity>
          <View style={{ marginTop: scale(35), alignItems: "center" }}>
            <Text style={styles.billTitle}>
              SUA CONTA
            </Text>
            <Text style={styles.billAmount}>
              AOA {payment_total.toLocaleString()}
            </Text>
            <Text style={styles.billPaymentType}>
              A SER PAGO EM {payment_type}
            </Text>
          </View>
        </View>

        <View style={styles.profile}>
          <View style={{ alignItems: "center" }}>
            <View style={styles.driverPhotoContainer}>
              <Image
                source={{
                  uri: service.driver?.photo || imgDef,
                }}
                style={styles.driverPhoto}
              />
            </View>
            <Text style={styles.driverName}>
              {service.driver?.name}
            </Text>
          </View>

          <Text style={styles.ratingLabel}>
            Avalie o Motorista
          </Text>

          <StarRating rating={models.rating} onRate={operations.handleRate} />
        </View>
        <View style={styles.bottomContainer}>
          <TouchableOpacity style={styles.problemButton}>
            <Text style={styles.problemButtonText}>
              Algum problema?
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={operations.handleConfirmRate}
          >
            <Text style={styles.confirmButtonText}>
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
    backgroundColor: colors.background,
  },
  goback: {
    width: scale(50),
    height: scale(50),
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    left: scale(16),
    top: scale(40),
    borderRadius: scale(25),
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  profile: {
    width: scale(290),
    height: scale(290),
    position: "absolute",
    borderRadius: borderRadius.xxl,
    backgroundColor: colors.surface,
    alignSelf: "center",
    top: "32%",
    alignItems: "center",
    justifyContent: "center",
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  overlay: {
    width: "100%",
    height: "60%",
    borderBottomStartRadius: scale(200),
    borderBottomEndRadius: scale(200),
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  billTitle: {
    fontSize: scale(14),
    color: "rgba(255,255,255,0.9)",
    fontWeight: "700",
    padding: scale(30),
    letterSpacing: 1,
  },
  billAmount: {
    fontSize: scale(32),
    color: "#fff",
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  billPaymentType: {
    fontSize: scale(12),
    color: "rgba(255,255,255,0.8)",
    marginTop: scale(8),
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  driverPhotoContainer: {
    borderRadius: scale(60),
    borderWidth: 3,
    borderColor: colors.primary,
    ...shadows.primaryGlow,
  },
  driverPhoto: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(55),
  },
  driverName: {
    fontSize: scale(18),
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: scale(12),
  },
  ratingLabel: {
    marginTop: scale(12),
    fontSize: scale(14),
    color: colors.textSecondary,
    marginBottom: scale(12),
    fontWeight: "500",
  },
  bottomContainer: {
    alignItems: "center",
    marginTop: scale(150),
    paddingHorizontal: scale(24),
  },
  problemButton: {
    paddingVertical: scale(12),
  },
  problemButtonText: {
    color: colors.primary,
    fontSize: scale(15),
    fontWeight: "600",
  },
  confirmButton: {
    marginTop: scale(16),
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    width: scale(300),
    height: scale(52),
    alignItems: "center",
    justifyContent: "center",
    ...shadows.primaryGlow,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: scale(16),
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
export default ConfirmationModal;
