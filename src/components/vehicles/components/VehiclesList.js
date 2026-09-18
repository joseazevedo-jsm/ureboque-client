import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { AppText as Text } from '../../common/AppText';
import { AppPressable as TouchableOpacity } from '../../common/AppPressable';
import { AppHeader } from '../../common/AppHeader';

import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { scale } from 'react-native-size-matters';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
const Icon = MaterialIcons;
import { ScalePressable } from '../../common/ScalePressable';
import { componentStyles, sizes, typography, colors, spacing, borderRadius } from "../../../theme";

const VehicleCard = ({ vehicle, isEditMode, onPress, onDelete, onSetDefault }) => (
  <ScalePressable onPress={onPress}>
    <View style={styles.card}>
      <View style={styles.cardIcon}>
        <Icon name="directions-car" size={sizes.iconLarge} color={colors.primary} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {vehicle.brand} {vehicle.model}
          {vehicle.color ? <Text style={styles.cardMeta}> · {vehicle.color}</Text> : null}
        </Text>
        <Text style={styles.cardSubtitle}>{vehicle.license}</Text>
      </View>
      {isEditMode ? (
        <TouchableOpacity style={styles.actionButton} accessibilityLabel="Apagar registo" onPress={() => onDelete(vehicle._id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="delete-outline" size={sizes.iconLarge} color={colors.error} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.actionButton} accessibilityLabel="Definir veículo padrão" onPress={() => onSetDefault(vehicle._id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon
            name={vehicle.isDefault ? 'star' : 'star-border'}
            size={sizes.iconLarge}
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
      <AppHeader title="Meus Veículos" subtitle="Guarde os seus dados para pedidos mais rápidos."
        leftIcon="close" leftLabel="Fechar veículos" onLeftPress={onClose}
        rightIcon={state.isEditMode ? 'check' : 'edit'} rightLabel={state.isEditMode ? 'Concluir edição' : 'Editar lista'}
        rightSelected={state.isEditMode} onRightPress={toggleEditMode} />

      <View style={styles.listContainer}>
        <FlatList
          data={vehicles}
          renderItem={renderItem}
          keyExtractor={(item, index) => String(item?._id ?? `vehicle-${index}`)}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.emptyState}>
              <Icon name="directions-car" size={sizes.illustration} color={colors.textMuted} />
              <Text style={styles.emptyText}>Nenhum veículo adicionado</Text>
              <Text style={styles.emptySubtext}>Adicione o seu veículo para acelerar os pedidos.</Text>
            </Animated.View>
          }
          ListFooterComponent={
            <Animated.View entering={FadeInDown.delay(300).springify()}>
              <ScalePressable onPress={startAdd}>
                <View style={styles.addButton}>
                  <Icon name="add-circle-outline" size={sizes.iconLarge} color={colors.primary} />
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
  listContainer: { flex: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  card: { ...componentStyles.card, flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  cardIcon: {
    width: sizes.control,
    height: sizes.control,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight, fontWeight: '700', color: colors.textPrimary },
  cardMeta: { fontWeight: '400', color: colors.textSecondary },
  cardSubtitle: { fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight, color: colors.textSecondary, marginTop: spacing.xs },
  actionButton: { width: sizes.control, minHeight: sizes.control, alignItems: 'center', justifyContent: 'center' },
  addButton: { ...componentStyles.buttonSecondary, flexDirection: 'row', marginTop: spacing.sm, gap: spacing.sm },
  addButtonText: { fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight, fontWeight: '700', color: colors.primary },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxxl },
  emptyText: { fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight, fontWeight: '600', color: colors.textSecondary, marginTop: spacing.md },
  emptySubtext: { fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: colors.overlayLoading, justifyContent: 'center', alignItems: 'center',
  },
  loadingText: { color: colors.surface, fontWeight: '600' },
});

export default VehiclesList;
