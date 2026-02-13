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
import Icon from "react-native-vector-icons/MaterialIcons";
import ServiceHistoryItem from "../components/cards/serviceHistoryItem";
import ServiceDetailModal from "../components/modals/serviceDetailModal";
import useHistoryScreen from "../components/history/useHistoryScreen";
import { useLogger } from "../hooks/useLogger";

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

  // Enhanced debug logging
  console.log('📱 HistoryScreen rendered:', {
    servicesCount: models?.services?.length || 0,
    isLoading: models?.isLoading,
    hasModels: !!models,
    services: models?.services ? 'exists' : 'null',
    activeFilter,
    searchText: searchText ? 'has_search' : 'no_search',
    error: models?.error
  });

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

    console.log('🔍 Filtering services:', {
      totalServices: filtered.length,
      activeFilter,
      searchText,
      firstService: filtered[0] // Log first service for debugging
    });

    // Apply status filter - handle nested structure
    if (activeFilter !== 'all') {
      const beforeFilter = filtered.length;
      filtered = filtered.filter(serviceItem => {
        const serviceData = serviceItem.service || serviceItem;
        return serviceData.status === activeFilter;
      });
      console.log(`📊 Status filter '${activeFilter}': ${beforeFilter} -> ${filtered.length} services`);
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

          if (matches) {
            console.log('🔍 Service matches search:', {
              id: serviceData._id,
              carMatch,
              driverMatch,
              locationMatch,
              idMatch
            });
          }

          return matches;
        } catch (error) {
          console.error('❌ Search filter error for service:', serviceItem, error);
          return true; // Include service if search fails
        }
      });

      console.log(`🔍 Search filter '${searchText}': ${beforeSearch} -> ${filtered.length} services`);
    }

    console.log('✅ Final filtered services:', filtered.length);
    return filtered;
  };

  const renderFilterButton = (filter, label) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        activeFilter === filter && styles.activeFilterButton
      ]}
      onPress={() => handleFilterPress(filter)}
    >
      <Text style={[
        styles.filterText,
        activeFilter === filter && styles.activeFilterText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderServiceItem = ({ item }) => (
    <ServiceHistoryItem
      service={item}
      onPress={() => handleServicePress(item)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="history" size={scale(80)} color="#ccc" />
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
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            logger.logUserInteraction('menu_button_pressed', { from: 'HistoryScreen' });
            navigation.openDrawer();
          }}
        >
          <Icon name="menu" size={scale(25)} color="#0089FF" />
        </TouchableOpacity>
        <Text style={styles.headerText}>HISTÓRICO</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={scale(20)} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por destino ou motorista"
          placeholderTextColor="#666"
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
          >
            <Icon name="clear" size={scale(20)} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Buttons */}
      <View>
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
      </View>

      {/* Services List */}
      {models.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0089FF" />
          <Text style={styles.loadingText}>Carregando histórico...</Text>
        </View>
      ) : models.error ? (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={scale(60)} color="#ff6b6b" />
          <Text style={styles.errorText}>{models.error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              console.log('🔄 Retry button pressed');
              operations.handleRetry();
            }}
          >
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={getFilteredServices()}
          keyExtractor={(item) => (item.service?._id || item._id)}
          renderItem={renderServiceItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={models.isRefreshing}
              onRefresh={operations.handleRefresh}
              colors={["#0089FF"]}
              tintColor="#0089FF"
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
    backgroundColor: "#F8FAFC", // Slate 50
  },
  headerContainer: {
    paddingTop: scale(60), // More breathing room
    paddingBottom: scale(20),
    paddingHorizontal: scale(24),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: scale(8),
    borderRadius: scale(20),
    backgroundColor: '#F1F5F9', // Slate 100
  },
  headerText: {
    fontSize: scale(20),
    fontWeight: "800",
    color: "#1E293B", // Slate 900
    letterSpacing: -0.5,
    flex: 1,
    textAlign: 'center',
    marginRight: scale(40), // Balance back button
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: scale(20),
    marginVertical: scale(20),
    backgroundColor: "#fff",
    borderRadius: scale(16),
    paddingHorizontal: scale(16),
    height: scale(52),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  searchIcon: {
    marginRight: scale(12),
  },
  searchInput: {
    flex: 1,
    fontSize: scale(15),
    color: "#1E293B",
    height: '100%',
  },
  clearSearch: {
    padding: scale(8),
  },
  filterContainer: {
    flexDirection: "row",
    marginBottom: scale(20),
    paddingHorizontal: scale(20),
    gap: scale(8), // Native gap support
  },
  filterButton: {
    paddingVertical: scale(8),
    paddingHorizontal: scale(16),
    borderRadius: scale(20),
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    alignItems: "center",
  },
  activeFilterButton: {
    backgroundColor: "#0089FF",
    borderColor: "#0089FF",
    shadowColor: "#0089FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  filterText: {
    fontSize: scale(13),
    color: "#64748B",
    fontWeight: "600",
  },
  activeFilterText: {
    color: "#fff",
    fontWeight: "700",
  },
  listContainer: {
    paddingHorizontal: scale(20),
    paddingBottom: scale(40),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: scale(16),
    fontSize: scale(15),
    color: "#64748B",
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: scale(40),
  },
  errorText: {
    fontSize: scale(15),
    color: "#EF4444",
    textAlign: "center",
    marginTop: scale(16),
    marginHorizontal: scale(40),
    lineHeight: scale(22),
  },
  retryButton: {
    backgroundColor: "#0089FF",
    paddingVertical: scale(14),
    paddingHorizontal: scale(32),
    borderRadius: scale(12),
    marginTop: scale(24),
    shadowColor: "#0089FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: "#fff",
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
    color: "#1E293B",
    marginTop: scale(24),
  },
  emptySubtitle: {
    fontSize: scale(14),
    color: "#94A3B8",
    textAlign: "center",
    marginTop: scale(8),
    marginHorizontal: scale(40),
    lineHeight: scale(20),
  },
});

export default HistoryScreen;