import React, { memo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Modal, View, StyleSheet, ScrollView, Image } from 'react-native';
import { AppText as Text } from '../common/AppText';
import { AppPressable as TouchableOpacity } from '../common/AppPressable';
import { AppHeader } from '../common/AppHeader';

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
const Icon = MaterialIcons;
import RouteItem from "../cards/routeItem";
import StarRating from "../cards/starRating";
import { colors, spacing, borderRadius, shadows, typography, sizes, layout } from "../../theme";
import {
  getStatusInfo,
  formatServiceDate,
  formatPrice,
  formatCarDetails,
  getOriginDestination,
} from "../../utils/serviceFormatters";

const driverImgDef = "https://w7.pngwing.com/pngs/178/595/png-transparent-user-profile-computer-icons-login-user-avatars-thumbnail.png";

const ServiceDetailModal = memo(({ visible, service, onClose }) => {
  const insets = useSafeAreaInsets();
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
        <View style={[styles.modalContainer, { paddingBottom: insets.bottom }]}>
          <AppHeader title="Detalhes do Serviço" leftIcon="close" leftLabel="Fechar detalhes do serviço"
            onLeftPress={onClose} safeArea={false} />

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Status and Date */}
            <View style={styles.section}>
              <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
                  <Icon name={statusInfo.icon} size={sizes.icon} color={statusInfo.color} />
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
                <Icon name="directions-car" size={sizes.icon} color={colors.primary} />
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
                <Icon name="payments" size={sizes.icon} color={colors.primary} />
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
                      <StarRating rating={serviceData.review.rating} size={sizes.icon} readonly={true} />
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
                  <Icon name="warning" size={sizes.icon} color={colors.warning} />
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
                <Icon name="tag" size={sizes.icon} color={colors.textSecondary} />
                <Text style={styles.serviceId}>ID: {serviceData._id}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {serviceData.status === 'completed' && !serviceData.review?.rating && (
              <TouchableOpacity style={styles.actionButton}>
                <Icon name="star" size={sizes.icon} color={colors.surface} />
                <Text style={styles.actionButtonText}>Avaliar Serviço</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.actionButton, styles.supportButton]}>
              <Icon name="support-agent" size={sizes.icon} color={colors.primary} />
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
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    height: "85%",
    width: "100%",
    maxWidth: layout.sheetMaxWidth,
    alignSelf: "center",
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
    flex: 1,
    ...typography.h3,
    color: colors.textPrimary,
  },
  closeButton: {
    width: sizes.control,
    height: sizes.control,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  section: {
    marginVertical: spacing.lg,
  },
  sectionTitle: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  statusContainer: {
    flexWrap: "wrap",
    gap: spacing.sm,
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
    ...typography.bodySmall,
    marginLeft: spacing.xs,
  },
  dateText: {
    ...typography.bodySmall,
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
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  infoSubText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  driverContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
  },
  driverImage: {
    width: sizes.illustration,
    height: sizes.illustration,
    borderRadius: borderRadius.full,
    marginRight: spacing.md,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    ...typography.body,
    color: colors.textPrimary,
  },
  driverPhone: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  licensePlateContainer: {
    flexWrap: "wrap",
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  licensePlateLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  licensePlate: {
    backgroundColor: colors.borderLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  licensePlateText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  priceText: {
    ...typography.h3,
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
    ...typography.body,
    color: colors.textPrimary,
  },
  reviewComment: {
    ...typography.bodySmall,
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
    flex: 1,
    marginLeft: spacing.sm,
    ...typography.bodySmall,
    color: colors.warning,
  },
  serviceId: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.md,
    flexShrink: 1,
  },
  actions: {
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  actionButton: {
    minHeight: sizes.control,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  actionButtonText: {
    color: colors.surface,
    ...typography.body,
    marginLeft: spacing.sm,
  },
  supportButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.primary,
    shadowOpacity: 0,
    elevation: 0,
  },
  supportButtonText: {
    color: colors.primary,
  },
});

export default ServiceDetailModal;
