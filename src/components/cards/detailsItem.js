import React, { memo, useMemo } from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { scale } from "react-native-size-matters";

const DetailsItem = memo(({ destination, driver, clientCar, paymentMethod, onBackPress }) => {
  const towCarInfo = useMemo(() => {
    return `${driver?.car?.name} | ${driver?.car?.licensePlate}`;
  }, [driver?.car?.name, driver?.car?.licensePlate]);

  return (
    <View style={styles.containerStyle}>
  
      {/* Header with back button and title */}
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={onBackPress}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={scale(22)} color="#0089FF" />
        </TouchableOpacity>
        <Text style={styles.titleStyle}>DETALHES DA VIAGEM</Text>
      </View>
      
      {/* Content in compact format */}
      <View style={styles.contentContainer}>
        <View style={styles.detailRow}>
          <Icon name="location-on" size={scale(18)} color="#0089FF" style={styles.rowIcon} />
          <View style={styles.rowContent}>
            <Text style={styles.labelText}>Indo para</Text>
            <Text style={styles.valueText}>{destination}</Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <Icon name="person" size={scale(18)} color="#0089FF" style={styles.rowIcon} />
          <View style={styles.rowContent}>
            <Text style={styles.labelText}>Motorista</Text>
            <Text style={styles.valueText}>{driver?.name}</Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <Icon name="directions-car" size={scale(18)} color="#0089FF" style={styles.rowIcon} />
          <View style={styles.rowContent}>
            <Text style={styles.labelText}>Seu carro</Text>
            <Text style={styles.valueText}>{clientCar}</Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <Icon name="local-shipping" size={scale(18)} color="#0089FF" style={styles.rowIcon} />
          <View style={styles.rowContent}>
            <Text style={styles.labelText}>Reboque</Text>
            <Text style={styles.valueText}>{towCarInfo}</Text>
          </View>
        </View>
        
        <View style={[styles.detailRow, styles.lastRow]}>
          <Icon name="payment" size={scale(18)} color="#0089FF" style={styles.rowIcon} />
          <View style={styles.rowContent}>
            <Text style={styles.labelText}>Pagamento</Text>
            <Text style={styles.valueText}>{paymentMethod}</Text>
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  containerStyle: {
    backgroundColor: '#ffffff',
    paddingBottom: scale(20),
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: scale(8),
  },
  handle: {
    width: scale(40),
    height: scale(4),
    backgroundColor: '#d1d5db',
    borderRadius: scale(2),
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: scale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    padding: scale(6),
    marginRight: scale(12),
  },
  titleStyle: {
    fontSize: scale(16),
    color: "#0089FF",
    fontWeight: "700",
  },
  contentContainer: {
    paddingHorizontal: scale(20),
    paddingTop: scale(16),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  rowIcon: {
    width: scale(24),
    marginRight: scale(12),
  },
  rowContent: {
    flex: 1,
  },
  labelText: {
    fontSize: scale(11),
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: scale(2),
    textTransform: 'uppercase',
  },
  valueText: {
    fontSize: scale(14),
    color: '#1f2937',
    fontWeight: '600',
  },
});

export default DetailsItem;
