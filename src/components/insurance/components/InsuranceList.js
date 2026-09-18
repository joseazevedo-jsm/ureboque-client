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

const InsuranceCard = ({ insurance, isEditMode, onPress, onDelete }) => (
  <ScalePressable onPress={onPress}>
    <View style={styles.card}>
      <View style={styles.cardIcon}>
        <Icon name="verified-user" size={sizes.iconLarge} color={colors.success} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{insurance.company}</Text>
        <Text style={styles.cardSubtitle}>Apólice: {insurance.policyNumber}</Text>
        <Text style={styles.cardSubtitle}>Matrícula: {insurance.vehicleLicense}</Text>
      </View>
      {isEditMode && (
        <TouchableOpacity style={styles.deleteButton} accessibilityLabel="Apagar registo" onPress={() => onDelete(insurance._id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="delete-outline" size={sizes.iconLarge} color={colors.error} />
        </TouchableOpacity>
      )}
    </View>
  </ScalePressable>
);

const InsuranceList = ({ insurances, startAdd, startEdit, deleteInsuranceRecord, state, toggleEditMode, onClose }) => {
  const renderItem = ({ item, index }) => (
    <Animated.View entering={FadeInRight.delay(100 + index * 40).springify()}>
      <InsuranceCard
        insurance={item}
        isEditMode={state.isEditMode}
        onPress={() => startEdit(item)}
        onDelete={deleteInsuranceRecord}
      />
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <AppHeader title="Seguros" subtitle="Os seus seguros e apólices."
        leftIcon="close" leftLabel="Fechar seguros" onLeftPress={onClose}
        rightIcon={state.isEditMode ? 'check' : 'edit'} rightLabel={state.isEditMode ? 'Concluir edição' : 'Editar lista'}
        rightSelected={state.isEditMode} onRightPress={toggleEditMode} />

      <View style={styles.listContainer}>
        <FlatList
          data={insurances}
          renderItem={renderItem}
          keyExtractor={(item, index) => String(item?._id ?? `insurance-${index}`)}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.emptyState}>
              <Icon name="verified-user" size={scale(48)} color={colors.textMuted} />
              <Text style={styles.emptyText}>Nenhum seguro adicionado</Text>
              <Text style={styles.emptySubtext}>Adicione os seus seguros para facilitar o acesso.</Text>
            </Animated.View>
          }
          ListFooterComponent={
            <Animated.View entering={FadeInDown.delay(300).springify()}>
              <ScalePressable onPress={startAdd}>
                <View style={styles.addButton}>
                  <Icon name="add-circle-outline" size={sizes.iconLarge} color={colors.primary} />
                  <Text style={[styles.addButtonText, { color: colors.primary }]}>Adicionar Seguro</Text>
                </View>
              </ScalePressable>
            </Animated.View>
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContainer: { flex: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  card: { ...componentStyles.card, flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  cardIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: borderRadius.md,
    backgroundColor: colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight, fontWeight: '700', color: colors.textPrimary },
  cardSubtitle: { fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight, color: colors.textSecondary, marginTop: spacing.xs },
  deleteButton: { width: sizes.control, minHeight: sizes.control, alignItems: 'center', justifyContent: 'center' },
  addButton: { ...componentStyles.buttonSecondary, flexDirection: 'row', marginTop: spacing.sm, gap: spacing.sm },
  addButtonText: { fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxxl },
  emptyText: { fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight, fontWeight: '600', color: colors.textSecondary, marginTop: spacing.md },
  emptySubtext: { fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },
});

export default InsuranceList;
