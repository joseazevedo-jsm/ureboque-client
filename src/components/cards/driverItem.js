import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppPressable as TouchableOpacity } from '../common/AppPressable';
import { AppText as Text } from '../common/AppText';
import { colors, shadows, spacing, borderRadius, borderWidths, typography, sizes, fonts } from '../../theme';
import { TRIP_STATUS } from '../../constants/tripStatus';

const Icon = MaterialIcons;
const defaultPhoto = 'https://w7.pngwing.com/pngs/178/595/png-transparent-user-profile-computer-icons-login-user-avatars-thumbnail.png';

const DriverItem = ({ driver, tripDuration, onCallDriver, onMessageDriver, status, unreadMessageCount = 0 }) => {
  const car = driver?.car || driver?.details?.car || driver?.vehicle || {};
  const carName = car.name || [car.brand, car.model, car.color].filter(Boolean).join(' ');
  const licensePlate = car.licensePlate || car.license || car.plate || driver?.licensePlate;
  const duration = Number.isFinite(Number(tripDuration)) ? Math.max(0, Math.floor(Number(tripDuration))) : null;
  const statusText = status === TRIP_STATUS.DRIVER_EN_ROUTE
    ? duration != null ? `Chegando em ~${duration} minutos` : 'Reboque a caminho'
    : status === TRIP_STATUS.DRIVER_ARRIVED
      ? 'Reboque esperando por você'
      : duration != null ? `A ~${duration} minutos do destino` : 'Viagem em andamento';

  return (
    <View style={styles.container}>
      <Text style={styles.mainText}>{statusText}</Text>
      <View style={styles.carInfoRow}>
        {carName ? <Text style={styles.carName} numberOfLines={1}>{carName}</Text> : null}
        {licensePlate ? <View style={styles.plateBadge}><Text style={styles.plateText}>{licensePlate}</Text></View> : null}
      </View>
      <View style={styles.actionsRow}>
        <TouchableOpacity accessibilityLabel="Ligar ao motorista" onPress={onCallDriver} style={styles.circle}>
          <Icon name="call" size={sizes.icon} color={colors.surface} />
        </TouchableOpacity>
        <View style={styles.driverAvatarContainer}>
          <Image source={{ uri: driver?.photo || defaultPhoto }} style={styles.driverPhoto} />
          <Text style={styles.driverName} numberOfLines={1}>{driver?.name || 'Motorista'}</Text>
        </View>
        <TouchableOpacity accessibilityLabel="Enviar mensagem ao motorista" onPress={onMessageDriver} style={styles.circle}>
          <Icon name="near-me" size={sizes.icon} color={colors.surface} />
          {unreadMessageCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unreadMessageCount > 9 ? '9+' : unreadMessageCount}</Text></View>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  mainText: { ...typography.h3, fontFamily: fonts.semiBold, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.md },
  carInfoRow: { minHeight: sizes.iconLarge, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  carName: { ...typography.bodySmall, fontFamily: fonts.semiBold, color: colors.textPrimary },
  plateBadge: { backgroundColor: colors.disabledSurface, borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  plateText: { ...typography.caption, fontFamily: fonts.bold, color: colors.textPrimary },
  actionsRow: { minHeight: sizes.avatar + spacing.xxl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingTop: spacing.md },
  driverAvatarContainer: { width: 136, alignItems: 'center' },
  driverPhoto: { width: sizes.avatar, height: sizes.avatar, borderRadius: borderRadius.full, borderWidth: borderWidths.focus, borderColor: colors.border },
  driverName: { ...typography.bodySmall, fontFamily: fonts.medium, color: colors.textSecondary, marginTop: spacing.xs },
  circle: { width: sizes.control, height: sizes.control, borderRadius: borderRadius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadows.sm },
  badge: { position: 'absolute', top: -spacing.xs, right: -spacing.xs, minWidth: sizes.icon, height: sizes.icon, borderRadius: borderRadius.full, backgroundColor: colors.error, borderWidth: borderWidths.focus, borderColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  badgeText: { ...typography.caption, fontFamily: fonts.bold, color: colors.surface, textAlign: 'center' },
});

export default DriverItem;
