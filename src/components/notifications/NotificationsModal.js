import React, { useEffect } from 'react';
import { Modal, View, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { AppText as Text } from '../common/AppText';
import { AppPressable as TouchableOpacity } from '../common/AppPressable';
import { AppHeader } from '../common/AppHeader';

import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { scale } from 'react-native-size-matters';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
const Icon = MaterialIcons;
import { useNotifications } from './hooks/useNotifications';
import { colors, shadows, spacing, borderRadius, typography, sizes } from '../../theme';

const TYPE_ICON = {
  promo: 'local-offer',
  system: 'settings',
  info: 'info',
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffH < 1) return 'Agora mesmo';
  if (diffH < 24) return `há ${diffH}h`;
  if (diffD === 1) return 'Ontem';
  return date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
};

const NotificationCard = ({ item, index, onMarkRead, onDelete }) => {
  const iconName = TYPE_ICON[item.type] || 'notifications';

  return (
    <Animated.View entering={FadeInRight.delay(60 + index * 40).springify()}>
      <TouchableOpacity
        style={[styles.card, !item.isRead && styles.cardUnread]}
        onPress={() => !item.isRead && onMarkRead(item._id)}
        activeOpacity={0.75}
      >
        <View style={[styles.cardIcon, !item.isRead && styles.cardIconUnread]}>
          <Icon name={iconName} size={sizes.icon} color={item.isRead ? colors.textMuted : colors.primary} />
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, !item.isRead && styles.cardTitleUnread]} numberOfLines={1}>
            {item.title}
          </Text>
          {item.message ? (
            <Text style={styles.cardMessage} numberOfLines={2}>{item.message}</Text>
          ) : null}
          <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(item._id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="delete-outline" size={sizes.icon} color={colors.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const NotificationsModal = ({ visible, onClose }) => {
  const { notifications, isLoading, refresh, handleMarkRead, handleDelete } = useNotifications();

  useEffect(() => {
    if (visible) refresh();
  }, [visible]);

  const renderItem = ({ item, index }) => (
    <NotificationCard
      item={item}
      index={index}
      onMarkRead={handleMarkRead}
      onDelete={handleDelete}
    />
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <AppHeader
          title="Notificações"
          subtitle="Promoções e atualizações."
          leftIcon="close"
          leftLabel="Fechar notificações"
          onLeftPress={onClose}
        />

        {isLoading && notifications.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderItem}
            keyExtractor={(item, index) => String(item?._id ?? `notification-${index}`)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.emptyState}>
                <Icon name="notifications-none" size={sizes.illustration} color={colors.textMuted} />
                <Text style={styles.emptyText}>Sem notificações</Text>
                <Text style={styles.emptySubtext}>As suas notificações aparecerão aqui.</Text>
              </Animated.View>
            }
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  cardUnread: { backgroundColor: colors.primaryLight },
  cardIcon: {
    width: sizes.control,
    height: sizes.control,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardIconUnread: { backgroundColor: colors.primaryTint12 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight, fontWeight: '600', color: colors.textSecondary },
  cardTitleUnread: { fontWeight: '700', color: colors.textPrimary },
  cardMessage: { fontSize: typography.caption.fontSize, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 20 },
  cardDate: { fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight, color: colors.textMuted, marginTop: spacing.xs },
  deleteButton: { paddingLeft: spacing.sm },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxxl },
  emptyText: { fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight, fontWeight: '600', color: colors.textSecondary, marginTop: spacing.md },
  emptySubtext: { fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },
});

export default NotificationsModal;
