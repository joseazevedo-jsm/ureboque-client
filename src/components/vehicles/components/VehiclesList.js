import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { scale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ScalePressable } from '../../common/ScalePressable';
import { colors, shadows, spacing, borderRadius } from '../../../theme';

const VehicleCard = ({ vehicle, isEditMode, onPress, onDelete, onSetDefault }) => (
  <ScalePressable onPress={onPress}>
    <View style={styles.card}>
      <View style={styles.cardIcon}>
        <Icon name="directions-car" size={scale(22)} color={colors.primary} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {vehicle.brand} {vehicle.model}
          {vehicle.color ? <Text style={styles.cardMeta}> · {vehicle.color}</Text> : null}
        </Text>
        <Text style={styles.cardSubtitle}>{vehicle.license}</Text>
      </View>
      {isEditMode ? (
        <TouchableOpacity style={styles.actionButton} onPress={() => onDelete(vehicle._id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="delete-outline" size={scale(22)} color={colors.error} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.actionButton} onPress={() => onSetDefault(vehicle._id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon
            name={vehicle.isDefault ? 'star' : 'star-border'}
            size={scale(22)}
            color={vehicle.isDefault ? colors.warning : colors.textMuted}
          />
        </TouchableOpacity>
      )}
    </View>
  </ScalePressable>
);

const VehiclesList = ({ vehicles, startAdd, startEdit, deleteVehicle, setDefaultVehicle, state, toggleEditMode, onClose }) => {
  const renderItem = ({ item, index }) => (
    <Animated.View entering={FadeInRight.delay(100 + index * 40).springify()}>
      <VehicleCard
        vehicle={item}
        isEditMode={state.isEditMode}
        onPress={() => startEdit(item)}
        onDelete={deleteVehicle}
        onSetDefault={setDefaultVehicle}
      />
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.header}>
        <TouchableOpacity style={styles.circleButton} onPress={onClose} activeOpacity={0.75}>
          <Icon name="close" size={scale(20)} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Meus Veículos</Text>
          <Text style={styles.subtitle}>Guarde os seus dados para pedidos mais rápidos.</Text>
        </View>
        <TouchableOpacity style={styles.circleButton} onPress={toggleEditMode} activeOpacity={0.75}>
          <Icon name={state.isEditMode ? 'check' : 'edit'} size={scale(20)} color={colors.primary} />
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.listContainer}>
        <FlatList
          data={vehicles}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.emptyState}>
              <Icon name="directions-car" size={scale(48)} color={colors.textMuted} />
              <Text style={styles.emptyText}>Nenhum veículo adicionado</Text>
              <Text style={styles.emptySubtext}>Adicione o seu veículo para acelerar os pedidos.</Text>
            </Animated.View>
          }
          ListFooterComponent={
            <Animated.View entering={FadeInDown.delay(300).springify()}>
              <ScalePressable onPress={startAdd}>
                <View style={styles.addButton}>
                  <Icon name="add-circle-outline" size={scale(22)} color={colors.primary} />
                  <Text style={styles.addButtonText}>Adicionar Veículo</Text>
                </View>
              </ScalePressable>
            </Animated.View>
          }
        />
      </View>

      {state.isLoading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>A carregar...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.modalSafeTop,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  circleButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.sm },
  title: { fontSize: scale(18), fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: scale(13), color: colors.textSecondary, marginTop: scale(2), textAlign: 'center' },
  listContainer: { flex: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  cardIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: scale(15), fontWeight: '700', color: colors.textPrimary },
  cardMeta: { fontWeight: '400', color: colors.textSecondary },
  cardSubtitle: { fontSize: scale(13), color: colors.textSecondary, marginTop: scale(2) },
  actionButton: { padding: spacing.xs },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  addButtonText: { fontSize: scale(14), fontWeight: '700', color: colors.primary },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxxl },
  emptyText: { fontSize: scale(15), fontWeight: '600', color: colors.textSecondary, marginTop: spacing.md },
  emptySubtext: { fontSize: scale(13), color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center',
  },
  loadingText: { color: colors.surface, fontWeight: '600' },
});

export default VehiclesList;
