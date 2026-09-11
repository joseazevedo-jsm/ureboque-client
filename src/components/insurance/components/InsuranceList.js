import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { scale } from 'react-native-size-matters';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
const Icon = MaterialIcons;
import { ScalePressable } from '../../common/ScalePressable';
import { colors, shadows, spacing, borderRadius } from '../../../theme';

const InsuranceCard = ({ insurance, isEditMode, onPress, onDelete }) => (
  <ScalePressable onPress={onPress}>
    <View style={styles.card}>
      <View style={styles.cardIcon}>
        <Icon name="verified-user" size={scale(22)} color={colors.success} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{insurance.company}</Text>
        <Text style={styles.cardSubtitle}>Apólice: {insurance.policyNumber}</Text>
        <Text style={styles.cardSubtitle}>Matrícula: {insurance.vehicleLicense}</Text>
      </View>
      {isEditMode && (
        <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(insurance._id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="delete-outline" size={scale(22)} color={colors.error} />
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
      <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.header}>
        <TouchableOpacity style={styles.circleButton} onPress={onClose} activeOpacity={0.75}>
          <Icon name="close" size={scale(20)} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Seguros</Text>
          <Text style={styles.subtitle}>Os seus seguros e apólices.</Text>
        </View>
        <TouchableOpacity style={styles.circleButton} onPress={toggleEditMode} activeOpacity={0.75}>
          <Icon name={state.isEditMode ? 'check' : 'edit'} size={scale(20)} color={colors.primary} />
        </TouchableOpacity>
      </Animated.View>

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
                  <Icon name="add-circle-outline" size={scale(22)} color={colors.primary} />
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
    backgroundColor: colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: scale(15), fontWeight: '700', color: colors.textPrimary },
  cardSubtitle: { fontSize: scale(12), color: colors.textSecondary, marginTop: scale(2) },
  deleteButton: { padding: spacing.xs },
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
  addButtonText: { fontSize: scale(14), fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxxl },
  emptyText: { fontSize: scale(15), fontWeight: '600', color: colors.textSecondary, marginTop: spacing.md },
  emptySubtext: { fontSize: scale(13), color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },
});

export default InsuranceList;
