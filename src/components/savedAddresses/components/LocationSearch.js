import React from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { scale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PlaceItem from '../../cards/placeItem'; // Keep existing component
import { useTextSearchQuery } from '../../../models/places/useTextSearchQuery';
import { useDebounce } from 'use-debounce';
import { useUserLocationStateContext } from '../../../context/UserLocationStateContext';
import Geocoder from 'react-native-geocoding';

const LocationSearch = ({ 
  state,
  searchLocations,
  selectSearchResult,
  updateCurrentAddress,
  onClose,
  onMapDragRequest
}) => {
  const { userLocation } = useUserLocationStateContext();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const { responseData } = useTextSearchQuery(debouncedSearchQuery);

  // Real search function using your existing logic
  const handleSearch = (query) => {
    setSearchQuery(query);
    searchLocations(query);
  };

  // Get search results from the real API
  const searchResults = responseData?.results || [];

  const handleLocationSelect = (location) => {
    // Transform Google Places API response to expected format and return to form
    selectSearchResult({
      address: location.formatted_address,
      coordinates: {
        latitude: location.geometry.location.lat,
        longitude: location.geometry.location.lng
      },
      name: location.name
    });
  };

  const handleCurrentLocation = async () => {
    try {
      if (!userLocation?.latitude || !userLocation?.longitude) {
        Alert.alert('Erro', 'Não foi possível determinar sua localização. Tente novamente.');
        return;
      }

      const response = await Geocoder.from(userLocation.latitude, userLocation.longitude);
      const address = response.results[0]?.formatted_address;
      const name = response.results[0]?.address_components[0]?.long_name;

      if (!address) {
        Alert.alert('Erro', 'Não foi possível determinar seu endereço. Tente novamente.');
        return;
      }

      updateCurrentAddress('coordinates', {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      });
      updateCurrentAddress('description', address);
      if (!state.currentAddress.name) {
        updateCurrentAddress('name', name || 'Localização Atual');
      }

      selectSearchResult({
        address,
        coordinates: { latitude: userLocation.latitude, longitude: userLocation.longitude },
        name: name || 'Localização Atual'
      });
    } catch (error) {
      Alert.alert('Erro', 'Algo deu errado. Tente novamente.');
    }
  };

  const handleMapDrag = () => {
    if (onMapDragRequest) {
      // Close the search modal and request map drag from parent
      onMapDragRequest((selectedLocation) => {
        // This callback will be called when map drag is confirmed
        if (selectedLocation && selectedLocation.coordinates) {
          updateCurrentAddress('description', selectedLocation.address || 'Localização selecionada no mapa');
          updateCurrentAddress('coordinates', selectedLocation.coordinates);
          if (!state.currentAddress.name) {
            updateCurrentAddress('name', selectedLocation.name || 'Local no Mapa');
          }
          selectSearchResult({
            address: selectedLocation.address || 'Localização selecionada no mapa',
            coordinates: selectedLocation.coordinates,
            name: selectedLocation.name || 'Local no Mapa'
          });
        }
      });
    } else {
      // Fallback: Use mock data if no callback provided
      updateCurrentAddress('description', 'Localização selecionada no mapa');
      updateCurrentAddress('coordinates', { latitude: -8.83755, longitude: 13.23432 });
      if (!state.currentAddress.name) {
        updateCurrentAddress('name', 'Local no Mapa');
      }
      selectSearchResult({
        address: 'Localização selecionada no mapa',
        coordinates: { latitude: -8.83755, longitude: 13.23432 },
        name: 'Local no Mapa'
      });
    }
  };

  const renderSearchResult = ({ item }) => (
    <PlaceItem
      key={item.place_id}
      name={item.name}
      iconUrl={item.icon}
      address={item.formatted_address}
      onPress={() => handleLocationSelect(item)}
    />
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => selectSearchResult({ address: '', coordinates: null, name: '' })}>
          <Icon name="arrow-back" size={scale(25)} />
        </TouchableOpacity>
      </View>

      {/* Search Input - Same design as current */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={scale(25)} color="#ccc" />
          <TextInput
            style={styles.searchInput}
            placeholderTextColor="#808080"
            placeholder="Escolha o seu destino"
            onChangeText={handleSearch}
            value={searchQuery}
          />
        </View>

        {/* Current Location Button - Same design */}
        <TouchableOpacity onPress={handleCurrentLocation}>
          <View style={styles.locationButton}>
            <View style={styles.iconContainer}>
              <Icon name="navigation" size={scale(30)} color="#0089FF" />
            </View>
            <Text style={styles.locationText}>Localização atual</Text>
          </View>
        </TouchableOpacity>

        {/* Map Drag Button - Same design */}
        <TouchableOpacity onPress={handleMapDrag}>
          <View style={styles.locationButton}>
            <View style={styles.iconContainer}>
              <Icon name="map" size={scale(30)} color="#0089FF" />
            </View>
            <Text style={styles.locationText}>Definir localização no mapa</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Search Results */}
      <View style={styles.resultsContainer}>
        <FlatList
          data={searchResults}
          renderItem={renderSearchResult}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag"
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
    </View>
  );
};

// Keep existing styles from AddressModal bottomSheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ccc",
  },
  header: {
    padding: scale(15)
  },
  closeButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(7),
    backgroundColor: "#fff",
    alignItems: 'center',
    justifyContent: 'center'
  },
  searchContainer: {
    backgroundColor: "#fff",
    borderRadius: scale(5),
    marginBottom: scale(3),
    padding: scale(10),
    marginHorizontal: scale(10)
  },
  searchInputContainer: {
    borderRadius: scale(7),
    borderWidth: scale(3),
    borderColor: "#0089FF",
    fontSize: scale(18),
    padding: scale(8),
    marginBottom: scale(20),
    flexDirection: "row",
    alignItems: 'center'
  },
  searchInput: {
    fontSize: scale(15),
    paddingHorizontal: scale(10),
    flex: 1
  },
  locationButton: {
    flexDirection: "row",
    marginBottom: scale(15),
    alignItems: "center",
  },
  iconContainer: {
    height: scale(45),
    width: scale(45),
    borderRadius: scale(7),
    borderWidth: scale(2),
    borderColor: "#0089FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(7),
  },
  locationText: {
    color: "#000",
    fontSize: scale(15),
    paddingHorizontal: scale(10),
    textAlignVertical: "center",
  },
  resultsContainer: {
    backgroundColor: "#fff",
    borderRadius: scale(5),
    flex: 1,
    marginHorizontal: scale(10),
    padding: scale(10)
  },
  separator: {
    height: scale(15)
  }
});

export default LocationSearch;