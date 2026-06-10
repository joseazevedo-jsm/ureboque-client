import React, { memo } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { scale } from "react-native-size-matters";
import RouteItem from "../cards/routeItem";
import StarRating from "../cards/starRating";
import { colors, spacing, borderRadius, shadows } from "../../theme";
import {
  getStatusInfo,
  formatServiceDate,
  formatPrice,
  formatCarDetails,
  getOriginDestination,
} from "../../utils/serviceFormatters";

const driverImgDef = "https://w7.pngwing.com/pngs/178/595/png-transparent-user-profile-computer-icons-login-user-avatars-thumbnail.png";

const ServiceDetailModal = memo(({ visible, service, onClose }) => {
  if (!service) return null;

  const serviceData = service.service || service;
  const carData = service.car;

  const statusInfo = getStatusInfo(serviceData.status);
  const { origin, destination } = getOriginDestination(serviceData.locations);
  const price = formatPrice(serviceData.payment, 'Valor não definido');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Detalhes do Serviço</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={scale(24)} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Status and Date */}
            <View style={styles.section}>
              <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
                  <Icon name={statusInfo.icon} size={scale(16)} color={statusInfo.color} />
                  <Text style={[styles.statusText, { color: statusInfo.color }]}>
                    {statusInfo.text}
                  </Text>
                </View>
                <Text style={styles.dateText}>{formatServiceDate(serviceData.createdAt)}</Text>
              </View>
            </View>

            {/* Route Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trajeto</Text>
              <View style={styles.routeContainer}>
                <RouteItem origin={origin} destination={destination} />
              </View>
            </View>

            {/* Vehicle Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Veículo</Text>
              <View style={styles.infoRow}>
                <Icon name="directions-car" size={scale(20)} color={colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoText}>{formatCarDetails(carData)}</Text>
                  {serviceData.type_car && (
                    <Text style={styles.infoSubText}>Tipo: {serviceData.type_car}</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Driver Information */}
            {serviceData.driver && serviceData.driver.details?.name && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Motorista</Text>
                <View style={styles.driverContainer}>
                  <Image
                    source={{ uri: serviceData.driver.user_photo_url || driverImgDef }}
                    style={styles.driverImage}
                  />
                  <View style={styles.driverInfo}>
                    <Text style={styles.driverName}>{serviceData.driver.details.name}</Text>
                    {serviceData.driver.phone && (
                      <Text style={styles.driverPhone}>{serviceData.driver.phone}</Text>
                    )}
                    {serviceData.driver.details.car?.licensePlate && (
                      <View style={styles.licensePlateContainer}>
                        <Text style={styles.licensePlateLabel}>Placa:</Text>
                        <View style={styles.licensePlate}>
                          <Text style={styles.licensePlateText}>
                            {serviceData.driver.details.car.licensePlate}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Payment Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pagamento</Text>
              <View style={styles.infoRow}>
                <Icon name="payments" size={scale(20)} color={colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.priceText}>{price}</Text>
                  {serviceData.payment?.method && (
                    <Text style={styles.infoSubText}>
                      Método: {serviceData.payment.method}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Review Information */}
            {serviceData.review && serviceData.status === 'completed' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Avaliação</Text>
                <View style={styles.reviewContainer}>
                  {serviceData.review.rating && (
                    <View style={styles.ratingContainer}>
                      <StarRating rating={serviceData.review.rating} size={scale(20)} readonly={true} />
                      <Text style={styles.ratingText}>{serviceData.review.rating}/5</Text>
                    </View>
                  )}
                  {serviceData.review.comment && (
                    <Text style={styles.reviewComment}>"{serviceData.review.comment}"</Text>
                  )}
                </View>
              </View>
            )}

            {/* Complaints */}
            {serviceData.complaints && Object.keys(serviceData.complaints).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Reclamações</Text>
                <View style={styles.complaintsContainer}>
                  <Icon name="warning" size={scale(20)} color={colors.warning} />
                  <Text style={styles.complaintsText}>
                    Este serviço possui reclamações registradas
                  </Text>
                </View>
              </View>
            )}

            {/* Service ID */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Identificação</Text>
              <View style={styles.infoRow}>
                <Icon name="tag" size={scale(20)} color={colors.textSecondary} />
                <Text style={styles.serviceId}>ID: {serviceData._id}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {serviceData.status === 'completed' && !serviceData.review?.rating && (
              <TouchableOpacity style={styles.actionButton}>
                <Icon name="star" size={scale(20)} color={colors.surface} />
                <Text style={styles.actionButtonText}>Avaliar Serviço</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.actionButton, styles.supportButton]}>
              <Icon name="support-agent" size={scale(20)} color={colors.primary} />
              <Text style={[styles.actionButtonText, styles.supportButtonText]}>
                Contatar Suporte
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    minHeight: "70%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: scale(18),
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  section: {
    marginVertical: spacing.lg,
  },
  sectionTitle: {
    fontSize: scale(16),
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
  },
  statusText: {
    fontSize: scale(14),
    fontWeight: "600",
    marginLeft: spacing.xs,
  },
  dateText: {
    fontSize: scale(14),
    color: colors.textSecondary,
  },
  routeContainer: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoContent: {
    marginLeft: spacing.md,
    flex: 1,
  },
  infoText: {
    fontSize: scale(14),
    color: colors.textPrimary,
    fontWeight: "500",
  },
  infoSubText: {
    fontSize: scale(12),
    color: colors.textSecondary,
    marginTop: scale(2),
  },
  driverContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
  },
  driverImage: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    marginRight: spacing.md,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: scale(16),
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  driverPhone: {
    fontSize: scale(14),
    color: colors.textSecondary,
    marginTop: scale(2),
  },
  licensePlateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  licensePlateLabel: {
    fontSize: scale(12),
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  licensePlate: {
    backgroundColor: colors.borderLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: scale(4),
    borderRadius: borderRadius.sm,
  },
  licensePlateText: {
    fontSize: scale(12),
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  priceText: {
    fontSize: scale(18),
    fontWeight: "bold",
    color: colors.primary,
  },
  reviewContainer: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  ratingText: {
    marginLeft: spacing.sm,
    fontSize: scale(16),
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  reviewComment: {
    fontSize: scale(14),
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  complaintsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.warningLight,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
  },
  complaintsText: {
    marginLeft: spacing.sm,
    fontSize: scale(14),
    color: colors.warning,
  },
  serviceId: {
    fontSize: scale(12),
    color: colors.textSecondary,
    marginLeft: spacing.md,
    fontFamily: "monospace",
  },
  actions: {
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
    ...shadows.primaryGlow,
  },
  actionButtonText: {
    color: colors.surface,
    fontSize: scale(16),
    fontWeight: "600",
    marginLeft: spacing.sm,
  },
  supportButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.primary,
    shadowOpacity: 0,
    elevation: 0,
  },
  supportButtonText: {
    color: colors.primary,
  },
});

export default ServiceDetailModal;
