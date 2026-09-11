import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { scale } from "react-native-size-matters";
import { useNavigation } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
const Icon = MaterialIcons;
import ServiceHistoryItem from "../components/cards/serviceHistoryItem";
import ServiceDetailModal from "../components/modals/serviceDetailModal";
import useHistoryScreen from "../components/history/useHistoryScreen";
import { useLogger } from "../hooks/useLogger";
import Animated, { FadeInDown } from 'react-native-reanimated';
import { animations, colors, spacing, borderRadius, shadows } from '../theme';

const HistoryScreen = () => {
  const logger = useLogger('HistoryScreen', {
    enableLifecycleLogging: true,
    logProps: true
  });

  const navigation = useNavigation();
  const { models, operations } = useHistoryScreen();
  const [selectedService, setSelectedService] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchText, setSearchText] = useState('');

  logger.debug('HistoryScreen rendered', {
    servicesCount: models?.services?.length || 0,
    isLoading: models?.isLoading,
    activeFilter,
    searchText: searchText ? 'has_search' : 'no_search'
  });

  const handleServicePress = (service) => {
    logger.logUserInteraction('service_history_item_pressed', {
      serviceId: service._id,
      status: service.status
    });
    setSelectedService(service);
    setDetailModalVisible(true);
  };

  const handleFilterPress = (filter) => {
    logger.logUserInteraction('history_filter_changed', {
      from: activeFilter,
      to: filter
    });
    setActiveFilter(filter);
  };

  const getFilteredServices = () => {
    let filtered = models.services || [];

    logger.debug('Filtering services', { totalServices: filtered.length, activeFilter, searchText: searchText ? 'set' : 'empty' });

    // Apply status filter - handle nested structure
    if (activeFilter !== 'all') {
      const beforeFilter = filtered.length;
      filtered = filtered.filter(serviceItem => {
        const serviceData = serviceItem.service || serviceItem;
        return serviceData.status === activeFilter;
      });
      logger.debug('Status filter applied', { filter: activeFilter, before: beforeFilter, after: filtered.length });
    }

    // Apply search filter - handle nested structure
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      const beforeSearch = filtered.length;

      filtered = filtered.filter(serviceItem => {
        try {
          const serviceData = serviceItem.service || serviceItem;
          const carData = serviceItem.car;

          // Search in car details
          let carMatch = false;
          if (carData) {
            const carString = [carData.brand, carData.model, carData.color, carData.licensePlate]
              .filter(Boolean)
              .join(' ')
              .toLowerCase();
            carMatch = carString.includes(searchLower);
          }

          // Search in driver name
          const driverMatch = (serviceData.driver?.details?.name?.toLowerCase().includes(searchLower)) || false;

          // Search in locations
          const locationMatch = (Array.isArray(serviceData.locations) &&
            serviceData.locations.length > 0)
            ? serviceData.locations.some(location =>
            (location.address?.toLowerCase().includes(searchLower) ||
              location.name?.toLowerCase().includes(searchLower))
            )
            : false;

          // Search in service ID
          const idMatch = serviceData._id?.toLowerCase().includes(searchLower);

          const matches = carMatch || driverMatch || locationMatch || idMatch;


          return matches;
        } catch (error) {
          logger.error('Search filter error', error);
          return true; // Include service if search fails
        }
      });

      logger.debug('Search filter applied', { before: beforeSearch, after: filtered.length });
    }

    logger.debug('Final filtered services', { count: filtered.length });
    return filtered;
  };

  const renderFilterButton = (filter, label) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        activeFilter === filter && styles.activeFilterButton
      ]}
      onPress={() => handleFilterPress(filter)}
      accessibilityLabel={`Filtrar por ${label}`}
      accessibilityRole="button"
      accessibilityState={{ selected: activeFilter === filter }}
    >
      <Text style={[
        styles.filterText,
        activeFilter === filter && styles.activeFilterText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderServiceItem = ({ item, index }) => (
    <Animated.View entering={FadeInDown.delay(index * animations.stagger.list).springify().damping(28).stiffness(180)}>
      <ServiceHistoryItem
        service={item}
        onPress={() => handleServicePress(item)}
      />
    </Animated.View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="history" size={scale(80)} color={colors.legacyBorder} />
      <Text style={styles.emptyTitle}>Nenhum histórico encontrado</Text>
      <Text style={styles.emptySubtitle}>
        {activeFilter === 'all'
          ? "Seus serviços de reboque aparecerão aqui"
          : `Nenhum serviço ${activeFilter === 'completed' ? 'concluído' :
            activeFilter === 'cancelled' ? 'cancelado' : 'solicitado'} encontrado`
        }
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View style={styles.headerContainer} entering={FadeInDown.delay(0).springify().damping(28).stiffness(180)}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            logger.logUserInteraction('menu_button_pressed', { from: 'HistoryScreen' });
            navigation.openDrawer();
          }}
          activeOpacity={0.7}
        >
          <Icon name="menu" size={scale(22)} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerText}>HISTÓRICO</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      {/* Search Bar */}
      <Animated.View style={styles.searchContainer} entering={FadeInDown.delay(80).springify().damping(28).stiffness(180)}>
        <Icon name="search" size={scale(20)} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por destino ou motorista"
          placeholderTextColor={colors.textSecondary}
          value={searchText}
          onChangeText={(text) => {
            setSearchText(text);
            if (text.trim()) {
              logger.logUserInteraction('history_search_used', { searchLength: text.length });
            }
          }}
        />
        {searchText.length > 0 && (
          <TouchableOpacity
            style={styles.clearSearch}
            onPress={() => {
              setSearchText('');
              logger.logUserInteraction('search_cleared', {});
            }}
            accessibilityLabel="Limpar pesquisa"
            accessibilityRole="button"
          >
            <Icon name="clear" size={scale(20)} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Filter Buttons */}
      <Animated.View entering={FadeInDown.delay(140).springify().damping(28).stiffness(180)}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['all', 'completed', 'cancelled', 'requested']}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingHorizontal: scale(20), paddingBottom: scale(10), gap: scale(2) }}
          renderItem={({ item }) => {
            const labelMap = {
              all: 'Todos',
              completed: 'Concluídos',
              cancelled: 'Cancelados',
              requested: 'Solicitados'
            };
            return (
              <View style={{ marginRight: scale(8) }}>
                {renderFilterButton(item, labelMap[item])}
              </View>
            );
          }}
          style={{ maxHeight: scale(50) }}
        />
      </Animated.View>

      {/* Services List */}
      {models.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando histórico...</Text>
        </View>
      ) : models.error ? (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={scale(60)} color={colors.error} />
          <Text style={styles.errorText}>{models.error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              logger.logUserInteraction('retry_button_pressed', {});
              operations.handleRetry();
            }}
          >
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={getFilteredServices()}
          keyExtractor={(item, index) => String(item?.service?._id || item?._id || `history-${index}`)}
          renderItem={renderServiceItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={models.isRefreshing}
              onRefresh={operations.handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}

      {/* Service Detail Modal */}
      <ServiceDetailModal
        visible={detailModalVisible}
        service={selectedService}
        onClose={() => {
          logger.logUserInteraction('service_detail_modal_closed', {
            serviceId: selectedService?._id
          });
          setDetailModalVisible(false);
          setSelectedService(null);
        }}
      />
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
  backButton: {
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
  headerText: {
    fontSize: scale(17),
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    height: scale(50),
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  searchIcon: {
    marginRight: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: scale(15),
    color: colors.textPrimary,
    height: "100%",
  },
  clearSearch: {
    padding: spacing.sm,
  },
  filterContainer: {
    flexDirection: "row",
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xxl,
    gap: spacing.sm,
  },
  filterButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: "center",
    ...shadows.sm,
  },
  activeFilterButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.primaryGlow,
  },
  filterText: {
    fontSize: scale(13),
    color: colors.textSecondary,
    fontWeight: "600",
  },
  activeFilterText: {
    color: colors.surface,
    fontWeight: "700",
  },
  listContainer: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: scale(40),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: scale(15),
    color: colors.textSecondary,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: scale(40),
  },
  errorText: {
    fontSize: scale(15),
    color: colors.error,
    textAlign: "center",
    marginTop: spacing.lg,
    marginHorizontal: scale(40),
    lineHeight: scale(22),
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxxl,
    borderRadius: borderRadius.xl,
    marginTop: spacing.xxl,
    ...shadows.primaryGlow,
  },
  retryButtonText: {
    color: colors.surface,
    fontSize: scale(16),
    fontWeight: "700",
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

export default HistoryScreen;
