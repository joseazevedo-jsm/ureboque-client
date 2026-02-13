import React, { memo } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { scale } from "react-native-size-matters";
import RouteItem from "../cards/routeItem";
import StarRating from "../cards/starRating";

const { height: screenHeight } = Dimensions.get("window");

const ServiceDetailModal = memo(({ visible, service, onClose }) => {
  if (!service) return null;

  // Handle nested service structure: { car: {...}, service: {...} }
  const serviceData = service.service || service;
  const carData = service.car;

  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return {
          text: 'Concluído',
          color: '#4CAF50',
          bgColor: '#E8F5E8',
          icon: 'check-circle'
        };
      case 'cancelled':
        return {
          text: 'Cancelado',
          color: '#F44336',
          bgColor: '#FFEBEE',
          icon: 'cancel'
        };
      case 'requested':
        return {
          text: 'Solicitado',
          color: '#FF9800',
          bgColor: '#FFF3E0',
          icon: 'schedule'
        };
      default:
        return {
          text: status,
          color: '#666',
          bgColor: '#f0f0f0',
          icon: 'help'
        };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isSameDate = (d1, d2) =>
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();

    if (isSameDate(date, today)) {
      return `Hoje às ${date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })}`;
    } else if (isSameDate(date, yesterday)) {
      return `Ontem às ${date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })}`;
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }) + ' às ' + date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getOriginDestination = (locations) => {
    console.log('🗺️ Modal locations data:', locations);

    // Handle case where locations is [Array] placeholder or not an array
    if (!locations || !Array.isArray(locations) || locations.length === 0) {
      return { origin: "Localização não definida", destination: "Destino não definido" };
    }

    if (locations.length === 1) {
      return {
        origin: locations[0]?.address || locations[0]?.name || "Localização não definida",
        destination: "Destino não definido"
      };
    }

    return {
      origin: locations[0]?.address || locations[0]?.name || "Origem não definida",
      destination: locations[locations.length - 1]?.address || locations[locations.length - 1]?.name || "Destino não definido"
    };
  };

  const formatPrice = (payment) => {
    if (!payment || (!payment.amount && !payment.value)) {
      return "Valor não definido";
    }
    const amount = payment.amount || payment.value;
    return amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'AOA'
    });
  };

  const formatCarDetails = (carData) => {
    if (!carData) {
      return 'Veículo não especificado';
    }

    const { brand, model, color, licensePlate } = carData;
    const parts = [];

    if (brand) parts.push(brand);
    if (model) parts.push(model);
    if (color) parts.push(color);
    if (licensePlate) parts.push(licensePlate);

    return parts.length > 0 ? parts.join(' ') : 'Veículo não especificado';
  };

  const statusInfo = getStatusInfo(serviceData.status);
  const { origin, destination } = getOriginDestination(serviceData.locations);
  const price = formatPrice(serviceData.payment);
  const driverImg = "https://w7.pngwing.com/pngs/178/595/png-transparent-user-profile-computer-icons-login-user-avatars-thumbnail.png";

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
              <Icon name="close" size={scale(24)} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Status and Date */}
            <View style={styles.section}>
              <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
                  <Icon
                    name={statusInfo.icon}
                    size={scale(16)}
                    color={statusInfo.color}
                  />
                  <Text style={[styles.statusText, { color: statusInfo.color }]}>
                    {statusInfo.text}
                  </Text>
                </View>
                <Text style={styles.dateText}>{formatDate(serviceData.createdAt)}</Text>
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
                <Icon name="directions-car" size={scale(20)} color="#0089FF" />
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
                    source={{ uri: serviceData.driver.user_photo_url || driverImg }}
                    style={styles.driverImage}
                  />
                  <View style={styles.driverInfo}>
                    <Text style={styles.driverName}>{serviceData.driver.details.name}</Text>
                    {serviceData.driver.phone && (
                      <Text style={styles.driverPhone}>{serviceData.driver.phone}</Text>
                    )}
                    {serviceData.driver.details.car && serviceData.driver.details.car.licensePlate && (
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
                <Icon name="payments" size={scale(20)} color="#0089FF" />
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
                      <StarRating
                        rating={serviceData.review.rating}
                        size={scale(20)}
                        readonly={true}
                      />
                      <Text style={styles.ratingText}>
                        {serviceData.review.rating}/5
                      </Text>
                    </View>
                  )}
                  {serviceData.review.comment && (
                    <Text style={styles.reviewComment}>
                      "{serviceData.review.comment}"
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Complaints */}
            {serviceData.complaints && Object.keys(serviceData.complaints).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Reclamações</Text>
                <View style={styles.complaintsContainer}>
                  <Icon name="warning" size={scale(20)} color="#FF9800" />
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
                <Icon name="tag" size={scale(20)} color="#666" />
                <Text style={styles.serviceId}>ID: {serviceData._id}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {serviceData.status === 'completed' && !serviceData.review?.rating && (
              <TouchableOpacity style={styles.actionButton}>
                <Icon name="star" size={scale(20)} color="#fff" />
                <Text style={styles.actionButtonText}>Avaliar Serviço</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.actionButton, styles.supportButton]}>
              <Icon name="support-agent" size={scale(20)} color="#0089FF" />
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
    backgroundColor: "#fff",
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    minHeight: "70%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(20),
    paddingVertical: scale(15),
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: scale(18),
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: scale(5),
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(20),
  },
  section: {
    marginVertical: scale(15),
  },
  sectionTitle: {
    fontSize: scale(16),
    fontWeight: "bold",
    color: "#333",
    marginBottom: scale(10),
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    borderRadius: scale(15),
  },
  statusText: {
    fontSize: scale(14),
    fontWeight: "600",
    marginLeft: scale(6),
  },
  dateText: {
    fontSize: scale(14),
    color: "#666",
  },
  routeContainer: {
    backgroundColor: "#f9f9f9",
    padding: scale(15),
    borderRadius: scale(10),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoContent: {
    marginLeft: scale(12),
    flex: 1,
  },
  infoText: {
    fontSize: scale(14),
    color: "#333",
    fontWeight: "500",
  },
  infoSubText: {
    fontSize: scale(12),
    color: "#666",
    marginTop: scale(2),
  },
  driverContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: scale(15),
    borderRadius: scale(10),
  },
  driverImage: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    marginRight: scale(12),
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: scale(16),
    fontWeight: "bold",
    color: "#333",
  },
  driverPhone: {
    fontSize: scale(14),
    color: "#666",
    marginTop: scale(2),
  },
  licensePlateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: scale(5),
  },
  licensePlateLabel: {
    fontSize: scale(12),
    color: "#666",
    marginRight: scale(8),
  },
  licensePlate: {
    backgroundColor: "#e0e0e0",
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(6),
  },
  licensePlateText: {
    fontSize: scale(12),
    fontWeight: "bold",
    color: "#333",
  },
  priceText: {
    fontSize: scale(18),
    fontWeight: "bold",
    color: "#0089FF",
  },
  reviewContainer: {
    backgroundColor: "#f9f9f9",
    padding: scale(15),
    borderRadius: scale(10),
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(10),
  },
  ratingText: {
    marginLeft: scale(10),
    fontSize: scale(16),
    fontWeight: "bold",
    color: "#333",
  },
  reviewComment: {
    fontSize: scale(14),
    color: "#666",
    fontStyle: "italic",
  },
  complaintsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    padding: scale(12),
    borderRadius: scale(8),
  },
  complaintsText: {
    marginLeft: scale(10),
    fontSize: scale(14),
    color: "#F57C00",
  },
  serviceId: {
    fontSize: scale(12),
    color: "#666",
    marginLeft: scale(12),
    fontFamily: "monospace",
  },
  actions: {
    padding: scale(20),
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0089FF",
    paddingVertical: scale(12),
    borderRadius: scale(8),
    marginBottom: scale(10),
  },
  actionButtonText: {
    color: "#fff",
    fontSize: scale(16),
    fontWeight: "600",
    marginLeft: scale(8),
  },
  supportButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#0089FF",
  },
  supportButtonText: {
    color: "#0089FF",
  },
});

export default ServiceDetailModal;