import React from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Alert
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { scale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import PlaceItem from '../../cards/placeItem';
import { ScalePressable } from '../../common/ScalePressable';
import { useTextSearchQuery } from '../../../models/places/useTextSearchQuery';
import { useDebounce } from 'use-debounce';
import { useUserLocationStateContext } from '../../../context/UserLocationStateContext';
import Geocoder from 'react-native-geocoding';
import { colors, shadows, borderRadius, spacing } from '../../../theme';

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
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

  const renderSearchResult = ({ item, index }) => (
    <Animated.View entering={FadeInRight.delay(100 + (index * 30)).springify()}>
      <ScalePressable onPress={() => handleLocationSelect(item)}>
        <PlaceItem
          key={item.place_id}
          name={item.name}
          iconUrl={item.icon}
          address={item.formatted_address}
        />
      </ScalePressable>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ScalePressable style={styles.closeButton} onPress={() => selectSearchResult({ address: '', coordinates: null, name: '' })}>
          <Icon name="arrow-back" size={scale(25)} />
        </ScalePressable>
      </View>

      {/* Search Input */}
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={scale(22)} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholderTextColor={colors.textMuted}
            placeholder="Escolha o seu destino"
            onChangeText={handleSearch}
            value={searchQuery}
          />
        </View>

        {/* Current Location Button */}
        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <ScalePressable onPress={handleCurrentLocation}>
            <View style={styles.locationButton}>
              <View style={styles.iconContainer}>
                <Icon name="navigation" size={scale(26)} color={colors.primary} />
              </View>
              <Text style={styles.locationText}>Localização atual</Text>
            </View>
          </ScalePressable>
        </Animated.View>

        {/* Map Drag Button */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <ScalePressable onPress={handleMapDrag}>
            <View style={styles.locationButton}>
              <View style={styles.iconContainer}>
                <Icon name="map" size={scale(26)} color={colors.primary} />
              </View>
              <Text style={styles.locationText}>Definir localização no mapa</Text>
            </View>
          </ScalePressable>
        </Animated.View>
      </Animated.View>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
  },
  closeButton: {
    width: scale(44),
    height: scale(44),
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  searchContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    ...shadows.md,
  },
  searchInputContainer: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.xl,
    flexDirection: "row",
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  searchInput: {
    fontSize: scale(15),
    paddingHorizontal: spacing.md,
    flex: 1,
    color: colors.textPrimary,
  },
  locationButton: {
    flexDirection: "row",
    marginBottom: spacing.md,
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  iconContainer: {
    height: scale(48),
    width: scale(48),
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  locationText: {
    color: colors.textPrimary,
    fontSize: scale(15),
    paddingHorizontal: spacing.sm,
    fontWeight: "500",
  },
  resultsContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    flex: 1,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  separator: {
    height: spacing.md,
  }
});

export default LocationSearch;