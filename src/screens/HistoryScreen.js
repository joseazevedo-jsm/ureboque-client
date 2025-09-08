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
            logger.logUserInteraction('back_button_pressed', { from: 'HistoryScreen' });
            logger.logNavigation('HistoryScreen', 'previous', { action: 'back' });
            navigation.goBack();
          }}
        >
          <Icon name="arrow-back" size={scale(25)} color="#0089FF" />
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
      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'Todos')}
        {renderFilterButton('completed', 'Concluídos')}
        {renderFilterButton('cancelled', 'Cancelados')}
        {renderFilterButton('requested', 'Solicitados')}
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
    backgroundColor: "#fff",
  },
  headerContainer: {
    height: scale(80),
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(20),
    paddingTop: scale(30),
  },
  backButton: {
    padding: scale(5),
  },
  headerText: {
    fontWeight: "bold",
    fontSize: scale(18),
    color: "#0089FF",
    marginLeft: scale(80),
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: scale(20),
    marginBottom: scale(15),
    backgroundColor: "#f5f5f5",
    borderRadius: scale(25),
    paddingHorizontal: scale(15),
    height: scale(45),
  },
  searchIcon: {
    marginRight: scale(10),
  },
  searchInput: {
    flex: 1,
    fontSize: scale(16),
    color: "#000",
  },
  clearSearch: {
    padding: scale(5),
  },
  filterContainer: {
    flexDirection: "row",
    marginBottom: scale(15),
    justifyContent:"center"
   },
  filterButton: {
    paddingVertical: scale(8),
    paddingHorizontal: scale(12),
    borderRadius: scale(20),
    backgroundColor: "#f0f0f0",
    marginHorizontal: scale(2),
    alignItems: "center",
  },
  activeFilterButton: {
    backgroundColor: "#0089FF",
  },
  filterText: {
    fontSize: scale(12),
    color: "#666",
    fontWeight: "500",
  },
  activeFilterText: {
    color: "#fff",
  },
  listContainer: {
    paddingHorizontal: scale(20),
    paddingBottom: scale(20),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: scale(10),
    fontSize: scale(16),
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: scale(100),
  },
  errorText: {
    fontSize: scale(16),
    color: "#ff6b6b",
    textAlign: "center",
    marginTop: scale(20),
    marginHorizontal: scale(40),
  },
  retryButton: {
    backgroundColor: "#0089FF",
    paddingVertical: scale(12),
    paddingHorizontal: scale(24),
    borderRadius: scale(8),
    marginTop: scale(20),
  },
  retryButtonText: {
    color: "#fff",
    fontSize: scale(16),
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: scale(100),
  },
  emptyTitle: {
    fontSize: scale(18),
    fontWeight: "bold",
    color: "#666",
    marginTop: scale(20),
  },
  emptySubtitle: {
    fontSize: scale(14),
    color: "#999",
    textAlign: "center",
    marginTop: scale(10),
    marginHorizontal: scale(40),
  },
});

export default HistoryScreen;