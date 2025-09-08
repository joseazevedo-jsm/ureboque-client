import React, { memo } from "react";
import { View, TouchableOpacity, StyleSheet, Text, Image } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { scale } from "react-native-size-matters";
import RouteItem from "./routeItem";

const ServiceHistoryItem = memo(({ service, onPress }) => {
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
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getOriginDestination = (locations) => {
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

  const formatPrice = (payment) => {
    // Handle case where payment is [Object] placeholder or doesn't have valid amount
    if (!payment || typeof payment !== 'object' || (!payment.amount && !payment.value)) {
      return null;
    }
    
    const amount = payment.amount || payment.value;
    if (!amount || typeof amount !== 'number') {
      return null;
    }
    
    return `${amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'AOA'
    })}`;
  };

  const statusInfo = getStatusInfo(serviceData.status);
  const { origin, destination } = getOriginDestination(serviceData.locations);
  const price = formatPrice(serviceData.payment);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <Text style={styles.dateText}>{formatDate(serviceData.createdAt)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
            <Icon 
              name={statusInfo.icon} 
              size={scale(12)} 
              color={statusInfo.color} 
              style={styles.statusIcon} 
            />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>
        </View>
        <View style={styles.rightSection}>
          {price && (
            <Text style={styles.priceText}>{price}</Text>
          )}
          <Icon name="chevron-right" size={scale(20)} color="#ccc" />
        </View>
      </View>

      <View style={styles.routeContainer}>
        <RouteItem 
          origin={origin}
          destination={destination}
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.carInfo}>
          <Icon name="directions-car" size={scale(16)} color="#666" />
          <Text style={styles.carText}>{formatCarDetails(carData)}</Text>
        </View>
        
        {serviceData.type_car && (
          <View style={styles.typeInfo}>
            <Text style={styles.typeText}>{serviceData.type_car}</Text>
          </View>
        )}
      </View>

      {serviceData.driver && typeof serviceData.driver === 'object' && serviceData.driver.details?.name && (
        <View style={styles.driverInfo}>
          <Icon name="person" size={scale(16)} color="#666" />
          <Text style={styles.driverText}>Motorista: {serviceData.driver.details.name}</Text>
          {serviceData.driver.details.car && serviceData.driver.details.car.licensePlate && (
            <View style={styles.licensePlate}>
              <Text style={styles.licensePlateText}>{serviceData.driver.details.car.licensePlate}</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: scale(12),
    padding: scale(16),
    marginBottom: scale(12),
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: scale(12),
  },
  leftSection: {
    flex: 1,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: scale(14),
    color: "#333",
    fontWeight: "500",
    marginBottom: scale(6),
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(12),
    alignSelf: "flex-start",
  },
  statusIcon: {
    marginRight: scale(4),
  },
  statusText: {
    fontSize: scale(12),
    fontWeight: "600",
  },
  priceText: {
    fontSize: scale(16),
    fontWeight: "bold",
    color: "#0089FF",
    marginRight: scale(8),
  },
  routeContainer: {
    marginBottom: scale(12),
    paddingLeft: scale(4),
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(8),
  },
  carInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  carText: {
    fontSize: scale(12),
    color: "#666",
    marginLeft: scale(6),
    flex: 1,
  },
  typeInfo: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(8),
  },
  typeText: {
    fontSize: scale(10),
    color: "#666",
    fontWeight: "600",
  },
  driverInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: scale(8),
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  driverText: {
    fontSize: scale(12),
    color: "#666",
    marginLeft: scale(6),
    flex: 1,
  },
  licensePlate: {
    backgroundColor: "#e0e0e0",
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    borderRadius: scale(4),
  },
  licensePlateText: {
    fontSize: scale(10),
    color: "#333",
    fontWeight: "bold",
  },
});

export default ServiceHistoryItem;