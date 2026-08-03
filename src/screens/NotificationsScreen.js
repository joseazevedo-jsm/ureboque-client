import React, { useEffect, useCallback, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { scale } from "react-native-size-matters";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useUserData } from "../context/UserDataContext";
import { useAlert } from "../context/AlertContext";
import { useLogger } from "../hooks/useLogger";
import { animations, colors, spacing, borderRadius, shadows } from "../theme";

const TYPE_CONFIG = {
  SUCCESS: { icon: "check-circle", color: colors.success, bg: colors.successLight },
  ERROR: { icon: "error", color: colors.error, bg: colors.errorLight },
  SYSTEM: { icon: "info", color: colors.primary, bg: colors.primaryLight },
  PROMOTION: { icon: "local-offer", color: colors.warning, bg: colors.warningLight },
};

const formatDate = (iso) => {
  const date = new Date(iso);
  return date.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const NotificationItem = ({
  item,
  index,
  isExpanded,
  isSelected,
  selectionMode,
  onPress,
  onLongPress,
  onDelete,
}) => {
  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.SYSTEM;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * animations.stagger.list)
        .springify()
        .damping(28)
        .stiffness(180)}
    >
      <TouchableOpacity
        style={[
          styles.itemContainer,
          !item.read && styles.itemUnread,
          isSelected && styles.itemSelected,
        ]}
        onPress={() => onPress(item)}
        onLongPress={() => onLongPress(item)}
        delayLongPress={300}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={item.title}
      >
        {selectionMode ? (
          <View style={[styles.checkboxContainer, isSelected && styles.checkboxSelected]}>
            {isSelected && <Icon name="check" size={scale(14)} color={colors.surface} />}
          </View>
        ) : (
          <View style={[styles.iconContainer, { backgroundColor: cfg.bg }]}>
            <Icon name={cfg.icon} size={scale(22)} color={cfg.color} />
          </View>
        )}

        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
          <Text
            style={styles.itemMessage}
            numberOfLines={isExpanded ? undefined : 2}
          >
            {item.message}
          </Text>
          <View style={styles.itemFooter}>
            <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
            {!selectionMode && (
              <Text style={styles.expandHint}>
                {isExpanded ? "Ver menos" : "Ver mais"}
              </Text>
            )}
          </View>
        </View>

        {!selectionMode && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDelete(item._id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Apagar notificação"
          >
            <Icon name="close" size={scale(16)} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const NotificationsScreen = () => {
  const logger = useLogger("NotificationsScreen", { enableLifecycleLogging: true });
  const navigation = useNavigation();
  const {
    notifications,
    fetchUserNotifications,
    markNotificationAsRead,
    deleteNotification,
    deleteUserNotifications,
    deleteNotificationsByIds,
  } = useUserData();
  const { showAlert } = useAlert();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchUserNotifications();
      setLoading(false);
    };
    load();

    // Refetch whenever this screen comes back into focus
    const unsubscribe = navigation.addListener('focus', fetchUserNotifications);
    return unsubscribe;
  }, []);

  // Exit selection mode when notifications list empties
  useEffect(() => {
    if (selectionMode && notifications.length === 0) {
      setSelectionMode(false);
      setSelectedIds(new Set());
    }
  }, [notifications.length, selectionMode]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUserNotifications();
    setRefreshing(false);
  }, [fetchUserNotifications]);

  const handlePress = useCallback(
    async (item) => {
      if (selectionMode) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(item._id)) {
            next.delete(item._id);
            if (next.size === 0) setSelectionMode(false);
          } else {
            next.add(item._id);
          }
          return next;
        });
        return;
      }

      // Toggle expand / collapse
      const nowExpanded = expandedId !== item._id;
      setExpandedId(nowExpanded ? item._id : null);

      if (nowExpanded && !item.read) {
        logger.logUserInteraction("notification_read", { id: item._id });
        await markNotificationAsRead(item._id);
      }
    },
    [selectionMode, expandedId, markNotificationAsRead]
  );

  const handleLongPress = useCallback(
    (item) => {
      if (!selectionMode) {
        setSelectionMode(true);
      }
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.add(item._id);
        return next;
      });
      logger.logUserInteraction("notification_selection_started", { id: item._id });
    },
    [selectionMode]
  );

  const handleDelete = useCallback(
    async (id) => {
      logger.logUserInteraction("notification_deleted", { id });
      await deleteNotification(id);
    },
    [deleteNotification]
  );

  const handleDeleteSelected = useCallback(async () => {
    const ids = Array.from(selectedIds);
    logger.logUserInteraction("bulk_delete_notifications", { count: ids.length });
    await deleteNotificationsByIds(ids);
    setSelectedIds(new Set());
    setSelectionMode(false);
  }, [selectedIds, deleteNotificationsByIds]);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map((n) => n._id)));
    }
  }, [selectedIds.size, notifications]);

  const handleCancelSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleClearPress = useCallback(() => {
    const hasRead = notifications.some((n) => n.read);
    showAlert({
      type: "confirmation",
      title: "Limpar notificações",
      message: "Escolha quais notificações pretende apagar.",
      buttons: [
        { text: "Cancelar", style: "cancel" },
        ...(hasRead
          ? [
              {
                text: "Lidas",
                onPress: async () => {
                  logger.logUserInteraction("clear_read_notifications");
                  await deleteUserNotifications(true);
                },
              },
            ]
          : []),
        {
          text: "Todas",
          style: "destructive",
          onPress: async () => {
            logger.logUserInteraction("clear_all_notifications");
            await deleteUserNotifications(false);
          },
        },
      ],
    });
  }, [notifications, showAlert, deleteUserNotifications]);

  const renderItem = ({ item, index }) => (
    <NotificationItem
      item={item}
      index={index}
      isExpanded={expandedId === item._id}
      isSelected={selectedIds.has(item._id)}
      selectionMode={selectionMode}
      onPress={handlePress}
      onLongPress={handleLongPress}
      onDelete={handleDelete}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="notifications-none" size={scale(80)} color={colors.legacyBorder} />
      <Text style={styles.emptyTitle}>Sem notificações</Text>
      <Text style={styles.emptySubtitle}>
        As suas notificações aparecerão aqui
      </Text>
    </View>
  );

  const allSelected = notifications.length > 0 && selectedIds.size === notifications.length;

  return (
    <View style={styles.container}>
      <Animated.View
        style={styles.headerContainer}
        entering={FadeInDown.delay(0).springify().damping(28).stiffness(180)}
      >
        {selectionMode ? (
          <>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={handleCancelSelection}
              activeOpacity={0.7}
            >
              <Icon name="close" size={scale(22)} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSelectAll} activeOpacity={0.7}>
              <Text style={styles.headerText}>
                {selectedIds.size > 0
                  ? `${selectedIds.size} selecionada${selectedIds.size !== 1 ? "s" : ""}`
                  : "Selecionar"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuButton, selectedIds.size === 0 && styles.menuButtonDisabled]}
              onPress={selectedIds.size > 0 ? handleDeleteSelected : undefined}
              activeOpacity={0.7}
              disabled={selectedIds.size === 0}
            >
              <Icon
                name="delete"
                size={scale(22)}
                color={selectedIds.size > 0 ? colors.error : colors.textDisabled}
              />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigation.openDrawer()}
              activeOpacity={0.7}
            >
              <Icon name="menu" size={scale(22)} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerText}>NOTIFICAÇÕES</Text>
            {notifications.length > 0 ? (
              <TouchableOpacity
                style={styles.menuButton}
                onPress={handleClearPress}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Limpar notificações"
              >
                <Icon name="delete-sweep" size={scale(22)} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : (
              <View style={styles.headerSpacer} />
            )}
          </>
        )}
      </Animated.View>

      {selectionMode && notifications.length > 0 && (
        <TouchableOpacity
          style={styles.selectAllRow}
          onPress={handleSelectAll}
          activeOpacity={0.7}
        >
          <Icon
            name={allSelected ? "check-box" : "check-box-outline-blank"}
            size={scale(20)}
            color={allSelected ? colors.primary : colors.textMuted}
          />
          <Text style={styles.selectAllText}>
            {allSelected ? "Desmarcar todas" : "Selecionar todas"}
          </Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={renderEmpty}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    paddingTop: spacing.headerHeight,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xxl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: borderRadius.xxl,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.sm,
  },
  headerSpacer: {
    width: scale(40),
    height: scale(40),
  },
  menuButtonDisabled: {
    opacity: 0.5,
  },
  headerText: {
    fontSize: scale(17),
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  selectAllRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  selectAllText: {
    fontSize: scale(13),
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    fontWeight: "500",
  },
  listContainer: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: scale(40),
    paddingTop: spacing.sm,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  itemUnread: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  itemSelected: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    backgroundColor: colors.primaryLight,
  },
  checkboxContainer: {
    width: scale(24),
    height: scale(24),
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.textMuted,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
    marginTop: scale(2),
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  iconContainer: {
    width: scale(44),
    height: scale(44),
    borderRadius: borderRadius.xxl,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  itemContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  itemTitle: {
    fontSize: scale(14),
    fontWeight: "700",
    color: colors.textPrimary,
    flex: 1,
  },
  unreadDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
  },
  itemMessage: {
    fontSize: scale(13),
    color: colors.textSecondary,
    lineHeight: scale(18),
    marginBottom: spacing.xs,
  },
  itemFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemDate: {
    fontSize: scale(11),
    color: colors.textMuted,
    fontWeight: "500",
  },
  expandHint: {
    fontSize: scale(11),
    color: colors.primary,
    fontWeight: "600",
  },
  deleteButton: {
    padding: spacing.xs,
    marginTop: scale(2),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: scale(80),
  },
  emptyTitle: {
    fontSize: scale(18),
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: spacing.xxl,
  },
  emptySubtitle: {
    fontSize: scale(14),
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.sm,
    marginHorizontal: scale(40),
    lineHeight: scale(20),
  },
});

export default NotificationsScreen;
