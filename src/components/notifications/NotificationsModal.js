import React, { useEffect } from 'react';
import {
  Modal, View, Text, FlatList, StyleSheet,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { scale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNotifications } from './hooks/useNotifications';
import { colors, shadows, spacing, borderRadius } from '../../theme';

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
          <Icon name={iconName} size={scale(20)} color={item.isRead ? colors.textMuted : colors.primary} />
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
          <Icon name="delete-outline" size={scale(20)} color={colors.textMuted} />
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
        <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.header}>
          <TouchableOpacity style={styles.circleButton} onPress={onClose} activeOpacity={0.75}>
            <Icon name="close" size={scale(20)} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>Notificações</Text>
            <Text style={styles.subtitle}>Promoções e atualizações.</Text>
          </View>
          <View style={styles.circleButton} />
        </Animated.View>

        {isLoading && notifications.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.emptyState}>
                <Icon name="notifications-none" size={scale(52)} color={colors.textMuted} />
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
    width: scale(38),
    height: scale(38),
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardIconUnread: { backgroundColor: 'rgba(0,137,255,0.12)' },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: scale(14), fontWeight: '600', color: colors.textSecondary },
  cardTitleUnread: { fontWeight: '700', color: colors.textPrimary },
  cardMessage: { fontSize: scale(13), color: colors.textSecondary, marginTop: scale(2), lineHeight: scale(18) },
  cardDate: { fontSize: scale(11), color: colors.textMuted, marginTop: scale(4) },
  deleteButton: { paddingLeft: spacing.sm },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxxl },
  emptyText: { fontSize: scale(15), fontWeight: '600', color: colors.textSecondary, marginTop: spacing.md },
  emptySubtext: { fontSize: scale(13), color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },
});

export default NotificationsModal;
