import React, { useEffect, memo, useMemo, useCallback, useRef } from "react";
import {
  Image,
  Modal,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Circle, Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";
import { ScalePressable } from "../components/common/ScalePressable";
import { BlurView } from "expo-blur";
import Animated, { FadeIn, FadeInDown, FadeInRight, FadeInUp, useSharedValue, useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated";
import { colors, spacing, shadows, animations } from '../theme';
import { getPlaceIcon, ICON_ADD } from '../assets/icons';
import { useMapScreen } from "../components/map/useMapScreen";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
const Icon = MaterialIcons;
import { scale } from "react-native-size-matters";
import BottomSheet, {
  BottomSheetView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { Platform } from "react-native";
import CardSpots from "../components/cards/cardSpots";
import DestinationModal from "../components/modals/Destination/DestinationModal";
import MapViewDirections from "react-native-maps-directions";
import { FlatList } from "react-native-gesture-handler";
import CarTypes from "../components/cards/carTypes";
// OLD: import SavedPlacesModal from "../components/modals/SavedPlaces/SavedPlacesModal";
// NEW: Simplified saved addresses system
import SavedAddressesModal from "../components/savedAddresses/SavedAddressesModal";
import { useNavigation } from "@react-navigation/native";
import ConfirmationModal from "../components/modals/Confirmation/ConfirmationModal";
import DriverSearch from "../components/views/driverSearch";
import DriverStatus from "../components/views/driverStatus";
import { customStyleMap } from "../components/map/customStyleMap";
import ChatModal from "../components/modals/Chat/ChatModal";
import UserCarInfo from "../components/views/userCarInfo";
import PreCancelationModal from "../components/modals/Cancel/PreCancelationModal";
import CancelationModal from "../components/modals/Cancel/CancelationModal";
import DetailsItem from "../components/cards/detailsItem";
import PaymentOptions from "../components/map/paymentOptions";
import CustomMarker from "../components/map/customMarker";
import { KeyboardAvoidingView } from "react-native";
import { useLogger } from "../hooks/useLogger";
import { TRIP_STATUS } from "../constants/tripStatus";
import { useDriverLocation, useDriverLocationStale } from "../hooks/useMapDrivers";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// The modal/portal variant can preserve a closed internal index across Fast
// Refresh even after present() is called. Flow sheets are already mutually
// exclusive, so a regular controlled BottomSheet is simpler and deterministic.
// Keep the former imperative API so the flow manager does not need to care
// which Gorhom shell renders the sheet.
const FlowBottomSheet = React.forwardRef(({
  onDismiss,
  stackBehavior: _stackBehavior,
  onChange,
  snapPoints,
  ...props
}, forwardedRef) => {
  const sheetRef = useRef(null);
  const { bottom: bottomInset } = useSafeAreaInsets();
  // Some Huawei/EMUI builds report a zero navigation inset while the classic
  // three-button bar still covers the bottom of an edge-to-edge React view.
  const effectiveBottomInset = Platform.OS === 'android'
    ? Math.max(bottomInset, scale(32))
    : bottomInset;
  const safeSnapPoints = useMemo(
    () => snapPoints?.map((point) => typeof point === 'number' ? point + effectiveBottomInset : point),
    [snapPoints, effectiveBottomInset],
  );

  React.useImperativeHandle(forwardedRef, () => ({
    present: () => sheetRef.current?.snapToIndex(0),
    dismiss: () => sheetRef.current?.close(),
    snapToIndex: (index) => sheetRef.current?.snapToIndex(index),
    close: () => sheetRef.current?.close(),
  }), []);

  const handleChange = useCallback((index) => {
    onChange?.(index);
    if (index === -1) onDismiss?.();
  }, [onChange, onDismiss]);

  return (
    <BottomSheet
      ref={sheetRef}
      onChange={handleChange}
      snapPoints={safeSnapPoints}
      {...props}
    />
  );
});
FlowBottomSheet.displayName = 'FlowBottomSheet';

// Memoized car icon mapping for performance
const carIconMap = {
  'BLACK': require("../../resources/icons/car/UREB_TOPVIEW_BLACK.png"),
  'WHITE': require("../../resources/icons/car/UREB_TOPVIEW_WHITE.png"),
  'BLUE': require("../../resources/icons/car/UREB_TOPVIEW_BLUE.png"),
  'GREEN': require("../../resources/icons/car/UREB_TOPVIEW_GREEN.png"),
  'YELLOW': require("../../resources/icons/car/UREB_TOPVIEW_YELLOW.png"),
};

const defaultIcon = require("../../resources/icons/car/UREB_TOPVIEW_BLACK.png");
const MIN_DRIVER_MARKER_ANIMATION_MS = 900;
const MAX_DRIVER_MARKER_ANIMATION_MS = 15000;
const DEFAULT_DRIVER_MARKER_ANIMATION_MS = 6000;
const DRIVER_MARKER_FRAME_MS = 120;

// Centralized bottom-sheet sizing so related sheets stay consistent instead of
// drifting via hand-tuned magic numbers. tripStarted/driverArriving/tripEnding all
// render the same DriverStatus layout — the two that can show the "Cancelar
// viagem" row (en-route and arrived) need the same expanded height; tripEnding
// (in-progress, no cancel row) is shorter.
const SHEET_SNAP_POINTS = {
  driverStatusExpanded: scale(500),
  driverStatusExpandedNoCancel: scale(435),
  driverStatusCollapsed: scale(310),
  details: scale(520),
};

const getCarIconByColor = (color) => {
  try {
    return carIconMap[color?.toUpperCase()] || defaultIcon;
  } catch (error) {
    return defaultIcon;
  }
};

const isValidCoordinate = (location) => (
  Number.isFinite(location?.latitude) && Number.isFinite(location?.longitude)
);

const getDriverMarkerAnimationDuration = (lastUpdateAt) => {
  if (!lastUpdateAt) return 0;
  const elapsed = Date.now() - lastUpdateAt;
  return Math.min(
    MAX_DRIVER_MARKER_ANIMATION_MS,
    Math.max(MIN_DRIVER_MARKER_ANIMATION_MS, elapsed * 0.9 || DEFAULT_DRIVER_MARKER_ANIMATION_MS)
  );
};

const getNearestHeading = (currentHeading, nextHeading) => {
  const safeNext = Number.isFinite(nextHeading) ? nextHeading : currentHeading;
  const delta = ((safeNext - (currentHeading % 360) + 540) % 360) - 180;
  return currentHeading + delta;
};

// --- Reusable Glass Components ---
const GlassBackground = memo(({ style }) => (
  <BlurView
    intensity={Platform.select({ ios: 40, android: 90 })}
    tint={Platform.select({ ios: 'light', android: 'light' })}
    style={[
      style,
      {
        borderRadius: scale(32),
        overflow: 'hidden',
        backgroundColor: Platform.select({
          ios: 'rgba(255,255,255,0.7)',
          android: 'rgba(255,255,255,0.7)'
        })
      }
    ]}
  />
));

const GlassHandle = memo(() => (
  <View style={styles.glassHandleContainer}>
    <View style={styles.glassHandleIndicator} />
  </View>
));

const SmoothDriverMarker = memo(({ driver, location, isStale }) => {
  const lastUpdateAtRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [displayLocation, setDisplayLocation] = React.useState(() => (
    isValidCoordinate(location)
      ? { latitude: location.latitude, longitude: location.longitude }
      : null
  ));
  const heading = useSharedValue(location?.heading || 0);

  useEffect(() => {
    if (!isValidCoordinate(location)) return;

    const fromLocation = displayLocation || {
      latitude: location.latitude,
      longitude: location.longitude,
    };
    const toLocation = {
      latitude: location.latitude,
      longitude: location.longitude,
    };
    const duration = getDriverMarkerAnimationDuration(lastUpdateAtRef.current);
    lastUpdateAtRef.current = Date.now();

    if (animationFrameRef.current) {
      clearInterval(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (duration === 0) {
      setDisplayLocation(toLocation);
      return;
    }

    const startedAt = Date.now();
    animationFrameRef.current = setInterval(() => {
      const progress = Math.min(1, (Date.now() - startedAt) / duration);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      setDisplayLocation({
        latitude: fromLocation.latitude + ((toLocation.latitude - fromLocation.latitude) * easedProgress),
        longitude: fromLocation.longitude + ((toLocation.longitude - fromLocation.longitude) * easedProgress),
      });

      if (progress >= 1 && animationFrameRef.current) {
        clearInterval(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }, DRIVER_MARKER_FRAME_MS);

    return () => {
      if (animationFrameRef.current) {
        clearInterval(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [location?.latitude, location?.longitude]);

  useEffect(() => {
    const nextHeading = getNearestHeading(heading.value, location?.heading || 0);
    heading.value = withTiming(nextHeading, { duration: 700 });
  }, [location?.heading]);

  const carAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${heading.value}deg` }],
  }));

  if (!driver || !displayLocation) return null;

  return (
    <Marker
      coordinate={displayLocation}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <Animated.Image
        source={getCarIconByColor(driver?.car?.color)}
        style={[styles.driverCarIcon, carAnimatedStyle, isStale && styles.driverCarIconStale]}
        resizeMode="contain"
      />
    </Marker>
  );
});

const DriverTrackingLayer = memo(({ driver }) => {
  const location = useDriverLocation();
  const isStale = useDriverLocationStale();
  return <SmoothDriverMarker driver={driver} location={location} isStale={isStale} />;
});

const MapViewport = memo(({ models, operations, mapMarkers, carsAround }) => (
  <MapView
    provider={PROVIDER_GOOGLE}
    ref={models.mapRef}
    showsUserLocation={models.showsUserLocation}
    userLocationPriority={models.userLocationPriority}
    userLocationUpdateInterval={models.userLocationUpdateInterval}
    userLocationFastestInterval={models.userLocationFastestInterval}
    onUserLocationChange={operations.handleUserLocationChange}
    showsMyLocationButton={false}
    onRegionChangeComplete={operations.handleDragMarkerPositionChange}
    toolbarEnabled={false}
    customMapStyle={customStyleMap}
    style={styles.map}
  >
    {models?.showsUserLocation && isValidCoordinate(models?.userLocation) && (
      <Circle center={models.userLocation} radius={models.userLocation.accuracy || 50} strokeWidth={1} strokeColor="rgba(0, 0, 255, 0.5)" fillColor="rgba(0, 0, 255, 0.2)" />
    )}
    {mapMarkers}
    <DriverTrackingLayer driver={models.driver} />
    {models.isRouteVisible && models.routeMarkers?.length === 2 && (
      <>
        <MapViewDirections origin={models.routeMarkers[0]} destination={models.routeMarkers[1]} apikey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY} strokeWidth={0} onReady={operations.handleMapDirectionsReady} resetOnChange={false} />
        {models.currentRoute?.length > 0 && <Polyline coordinates={models.currentRoute} strokeColor={colors.primary} strokeWidth={scale(7)} lineJoin="round" lineCap="round" tappable={false} />}
      </>
    )}
    {carsAround}
  </MapView>
));

const MapControls = memo(({ models, operations, navigation, recenterAnimatedStyle, openDrawer }) => (
  <>
    {(models.isRouteVisible || models.canGoBackBottomSheet) && !models.service ? (
      <TouchableOpacity style={styles.details} onPress={operations.handleBackButtonPress} activeOpacity={0.8}><BlurView intensity={90} tint="systemMaterialLight" style={StyleSheet.absoluteFill} /><Icon name="arrow-back" size={scale(24)} color={colors.primary} /></TouchableOpacity>
    ) : (
      <TouchableOpacity style={styles.menuGlassButton} onPress={openDrawer} activeOpacity={0.8}><BlurView intensity={90} tint="systemMaterialLight" style={StyleSheet.absoluteFill} /><Icon name="menu" size={scale(24)} color={colors.primary} /></TouchableOpacity>
    )}
    {!models.isRouteVisible && !models.service && <View style={styles.bellWrapper}><TouchableOpacity style={styles.bellButton} onPress={() => navigation.navigate('Notificacoes')} activeOpacity={0.8}><BlurView intensity={90} tint="systemMaterialLight" style={StyleSheet.absoluteFill} /><Icon name="notifications-none" size={scale(24)} color={colors.primary} /></TouchableOpacity>{models.unreadNotificationsCount > 0 && <View style={styles.bellBadge}><Text style={styles.bellBadgeText}>{models.unreadNotificationsCount > 99 ? '99+' : models.unreadNotificationsCount}</Text></View>}</View>}
    {!models.isRouteVisible && !models.service && !models.markerVisible && <Animated.View entering={FadeIn.duration(300)} style={styles.locationChipWrapper}><ScalePressable onPress={operations.handleRecenterMap} style={styles.locationChip}><Icon name="my-location" size={scale(14)} color={colors.primary} style={{ marginRight: spacing.xs }} /><View><Text style={styles.locationChipLabel}>Sua Localização</Text><Text style={styles.locationChipAddress} numberOfLines={1}>{models.currentLocationLabel || 'Obtendo localização...'}</Text></View></ScalePressable></Animated.View>}
    {models.markerVisible && models.activeBottomSheet === 'dragMarker' && <View style={styles.markerOverlay} pointerEvents="none"><CustomMarker title={models.markerCity || 'Carregando...'} color={models.inputLocationObject === 0 ? colors.primary : colors.destinationPin} /></View>}
    {(models.isRouteVisible || models.service) && <Animated.View entering={FadeIn.duration(200)} style={[styles.recenterButtonWrapper, recenterAnimatedStyle]}><ScalePressable onPress={operations.handleRecenterMap} style={styles.recenterButton}><BlurView intensity={90} tint="systemMaterialLight" style={StyleSheet.absoluteFill} /><Icon name="my-location" size={scale(24)} color={colors.primary} /></ScalePressable></Animated.View>}
  </>
));

const DriverStatusSheet = memo(({
  sheetRef,
  sheetName,
  activeBottomSheet,
  expandedSnapPoint,
  status,
  models,
  operations,
  onShareLocation,
  onCancelTrip,
  driverStatusSheetRef,
}) => activeBottomSheet === sheetName ? (
  <FlowBottomSheet
    ref={sheetRef}
    onDismiss={() => operations.handleBottomSheetDismiss(sheetName)}
    index={0}
    snapPoints={[SHEET_SNAP_POINTS.driverStatusCollapsed, expandedSnapPoint]}
    enablePanDownToClose={false}
    enableDynamicSizing={false}
    stackBehavior="replace"
    keyboardBehavior="interactive"
    android_keyboardInputMode="adjustResize"
    backgroundStyle={{ backgroundColor: 'transparent' }}
    backgroundComponent={GlassBackground}
    handleComponent={GlassHandle}
  >
    <Animated.View
      key={activeBottomSheet}
      style={{ flex: 1 }}
      entering={FadeIn.duration(240)}
    >
      <DriverStatus
        status={status}
        driver={models?.driver}
        origin={models.originCity}
        destination={models.destinationCity}
        tripDuration={models.tripDuration}
        onCancelTrip={onCancelTrip}
        onDetailsTrip={operations.handleDetailsForm}
        onShareLocation={onShareLocation}
        onMessageDriver={operations.handleMessageDriver}
        onCallDriver={operations.handleCallDriver}
        bttmSheetRef={driverStatusSheetRef}
        unreadMessageCount={models.unreadMessageCount}
      />
    </Animated.View>
  </FlowBottomSheet>
) : null);

const TripStatusSheets = memo(({ models, operations, onShareLocation }) => (
  <>
    <DriverStatusSheet
      sheetRef={models.tripStartedSheetRef}
      sheetName="tripStarted"
      activeBottomSheet={models.activeBottomSheet}
      expandedSnapPoint={SHEET_SNAP_POINTS.driverStatusExpanded}
      status={TRIP_STATUS.DRIVER_EN_ROUTE}
      models={models}
      operations={operations}
      onShareLocation={onShareLocation}
      onCancelTrip={operations.handlePreCancelButtonPress}
      driverStatusSheetRef={models.tripStartedSheetRef}
    />
    <DriverStatusSheet
      sheetRef={models.driverArrivingSheetRef}
      sheetName="driverArriving"
      activeBottomSheet={models.activeBottomSheet}
      expandedSnapPoint={SHEET_SNAP_POINTS.driverStatusExpanded}
      status={TRIP_STATUS.DRIVER_ARRIVED}
      models={models}
      operations={operations}
      onShareLocation={onShareLocation}
      onCancelTrip={operations.handlePreCancelButtonPress}
      driverStatusSheetRef={models.driverArrivingSheetRef}
    />
    <DriverStatusSheet
      sheetRef={models.tripEndingSheetRef}
      sheetName="tripEnding"
      activeBottomSheet={models.activeBottomSheet}
      expandedSnapPoint={SHEET_SNAP_POINTS.driverStatusExpandedNoCancel}
      status={TRIP_STATUS.IN_PROGRESS}
      models={models}
      operations={operations}
      onShareLocation={onShareLocation}
      onCancelTrip={operations.handleCancelTrip}
      driverStatusSheetRef={models.driverArrivingSheetRef}
    />
  </>
));

const MapModalHost = memo(({ models, operations }) => (
  <>
    <DestinationModal
      visible={models.modalVisible}
      closeModal={operations.closeDestinationModal}
      onPlaceItemPress={operations.handlePressItemPress}
      onMarkerDragPress={operations.handleInitiateDragMarkerSelection()}
      onLocationTextInputFocus={operations.handleLocationTextInputFocus}
      origin={models.locationSelection?.origin?.address || models.originCity}
      destination={models.locationSelection?.destination?.address || models.destinationCity}
      inputCurr={models.locationSelection?.origin?.isCurrentLocation || models.isCurrLocation}
      activeInputIndex={models.inputLocationObject}
      userLocation={models.userLocation}
    />
    <SavedAddressesModal
      visible={models.modalSavedPlacesVisible}
      onClose={operations.closeSavedPlacesModal}
      onMapDragRequest={operations.handleSavedAddressMapDragRequest}
    />
    <ChatModal
      visible={models.modalChatVisible}
      closeModal={operations.closeChatModel}
      idService={models.service?._id}
      driver={models?.driver}
      setUnreadMessageCount={operations.setUnreadMessageCount}
      onCallDriver={operations.handleCallDriver}
    />
    <PreCancelationModal
      visible={models.modalPreCancelVisible}
      closeModal={operations.closePreCancelModal}
      onPressCancel={operations.handlePressCancel}
    />
    <CancelationModal
      questions={models.questions}
      onPressQuestion={operations.handlePressQuestion}
      visible={models.modalCancelVisible}
      closeModal={operations.closeCancelModal}
      alert={operations.handleCancelAlert}
    />
    <ConfirmationModal
      visible={models.modalConfirmationVisible}
      closeModal={operations.closeConfirmationModal}
      driver={{
        photo: models.driver?.photo,
        name: models.driver?.name,
      }}
      payment_total={models.ridePrice}
      payment_type={models.service?.payment?.method}
      service={{
        service: models.service,
        driver: models.driver,
      }}
    />
  </>
));

const MapScreen = memo(() => {
  const logger = useLogger('MapScreen');
  const { models, operations } = useMapScreen();

  // Dynamic recenter button — always 20pt above the active sheet's minimum snap
  const buttonBottom = useSharedValue(scale(300));
  useEffect(() => {
    const snapMap = {
      initial:        scale(260),
      carType:        scale(270),
      userCarInfo:    scale(380),
      payment:        scale(320),
      rideSearch:     scale(270),
      tripStarted:    scale(310),
      driverArriving: scale(310),
      tripEnding:     scale(310),
      details:        scale(520),
      dragMarker:     scale(230),
    };
    const target = snapMap[models.activeBottomSheet] ?? scale(280);
    buttonBottom.value = withSpring(target + spacing.xl, animations.spring.enter);
  }, [models.activeBottomSheet]);
  const recenterAnimatedStyle = useAnimatedStyle(() => ({ bottom: buttonBottom.value }));

  logger.debug('MapScreen rendered', {
    activeBottomSheet: models.activeBottomSheet,
    hasDestination: !!models.destination,
    hasSelectedCar: !!models.selectedCar,
    driverCount: models.nearbyDrivers?.length || 0
  });

  const snapPoints = useMemo(
    () => [scale(230), scale(250), scale(260), scale(520)],
    []
  );


  // Memoized map markers for performance
  const memoizedMapMarkers = useMemo(() => {
    return models.mapMarkers.map((item, index) => {
      if (!isValidCoordinate(item)) return null;
      if (models.driver && models.tripState && index === 0) {
        return null;
      }

      return (
        <Marker coordinate={item} key={`marker-${index}-${item.latitude}-${item.longitude}`}>
          <CustomMarker
            title={
              models?.tripState
                ? models?.tripState === "assigned"
                  ? models.originCity
                  : models.destinationCity
                : index === 0
                  ? models.originCity
                  : models.destinationCity
            }
            time={
              index === 0
                ? models.tripDuration
                  ? operations.formatDuration(models.tripDuration)
                  : 0
                : null
            }
            color={index === 0 ? colors.primary : colors.destinationPin}
          />
        </Marker>
      );
    });
  }, [
    models.mapMarkers,
    models.tripState,
    models.driver,
    models.originCity,
    models.destinationCity,
    models.tripDuration,
    operations.formatDuration
  ]);

  const handleShareLocation = useCallback(async () => {
    if (!isValidCoordinate(models.userLocation)) return;
    const { latitude, longitude, receivedAt } = models.userLocation;
    const url = `https://maps.google.com/?q=${latitude},${longitude}`;
    const isStale = receivedAt && Date.now() - receivedAt > 120000;
    try {
      const label = isStale ? 'A última localização conhecida do meu telemóvel' : 'A minha localização atual';
      await Share.share({ message: `${label}: ${url}`, url });
    } catch (_) {}
  }, [models.userLocation]);

  // Memoized spots item renderer
  const renderSpotsItem = useCallback(({ item, index }) => {
    const place = item?.place || {};
    const placeName = place.name || 'Local guardado';
    const isAddFavorite = placeName === "Adicionar Favorito";
    const iconSource = getPlaceIcon(placeName);
    return (
      <CardSpots
        title={placeName}
        description={place.description || place.address}
        onPress={isAddFavorite
          ? operations.handleAddFavouriteButtonPress
          : operations.handleOnFavouriteButtonPress(item)}
        index={index}
        isAddFavorite={isAddFavorite}
        iconSource={iconSource}
      />
    );
  }, [operations.handleAddFavouriteButtonPress, operations.handleOnFavouriteButtonPress]);

  // The route is normally a second or two behind opening this sheet, so an
  // outright failure message here would cry wolf on every request. Only call it
  // unroutable once the two points are effectively the same, which is the case
  // the route can never resolve; otherwise say we are still calculating.
  const sameOriginAndDestination =
    models.markers?.length === 2 &&
    isValidCoordinate(models.markers[0]) &&
    isValidCoordinate(models.markers[1]) &&
    Math.hypot(
      (models.markers[1].latitude - models.markers[0].latitude) * 111320,
      (models.markers[1].longitude - models.markers[0].longitude) * 111320 *
        Math.cos((models.markers[0].latitude * Math.PI) / 180),
    ) < 25;

  const carTypesEmptyMessage = sameOriginAndDestination
    ? 'O destino é praticamente o mesmo que o local de recolha. Escolha um destino diferente.'
    : 'A calcular percurso...';

  // Memoized car types item renderer
  const renderCarTypesItem = useCallback(({ item }) => {
    // Returning undefined here renders an empty list with no explanation. When
    // the route cannot be computed (identical origin and destination, or a
    // failed Directions call) that leaves the user on a dead-end sheet with no
    // options, no price and no way to understand why — see ListEmptyComponent.
    if (models.mapDirections && models.prices) {
      const priceperkm =
        Math.floor(models.mapDirections.distance) * 1000 + Number(item.price);

      const price =
        models.user?.discount?.active
          ? priceperkm - priceperkm * (models.user?.discount?.percentage / 100)
          : priceperkm;

      return (
        <CarTypes
          typeCar={item.typeCar}
          descr={item.descr}
          descr2={item.descr2}
          price={price}
          route={models.mapDirections ? models.mapDirections : null}
          onPress={operations.handleTypeCarPress(item.typeCar, price)}
        />
      );
    }
  }, [models.mapDirections, models.prices, models.user?.discount, operations.handleTypeCarPress]);

  // Memoized cars around markers for performance
  const memoizedCarsAround = useMemo(() => {
    if (models?.service) return null;

    return models.carsAround
      .filter(isValidCoordinate)
      .map((item, index) => (
        <Marker coordinate={item} key={`car-around-${index}-${item.latitude}-${item.longitude}`}>
          <Image
            source={getCarIconByColor(item.color || 'default')}
            style={{
              width: 50,
              height: 50,
              transform: [{ rotate: "-90deg" }],
            }}
            resizeMode="contain"
          />
        </Marker>
      ));
  }, [models.carsAround, models?.service]);

  const navigation = useNavigation();
  const drawerReturnSheetRef = useRef('initial');

  useEffect(() => {
    const unsubscribe = navigation.addListener('drawerClose', () => {
      if (!models.modalVisible && !models.modalSavedPlacesVisible && !models.service) {
        operations.presentBottomSheet(drawerReturnSheetRef.current || 'initial');
      }
    });
    return unsubscribe;
  }, [navigation, models.modalVisible, models.modalSavedPlacesVisible, models.service, operations.presentBottomSheet]);

  const openDrawer = () => {
    // Do not leave a sheet portal above the drawer. This also prevents a
    // dismissed sheet from intercepting touches when the drawer closes.
    drawerReturnSheetRef.current = models.activeBottomSheet || 'initial';
    operations.dismissAllBottomSheets();
    navigation.openDrawer();
  };

  return (
    <View style={styles.container}>
      <MapViewport models={models} operations={operations} mapMarkers={memoizedMapMarkers} carsAround={memoizedCarsAround} />


      <MapControls models={models} operations={operations} navigation={navigation} recenterAnimatedStyle={recenterAnimatedStyle} openDrawer={openDrawer} />

        {models.activeBottomSheet === 'initial' && <FlowBottomSheet
          ref={models.bottomSheetModalRef}
          onDismiss={() => operations.handleBottomSheetDismiss('initial')}
          index={0}
          snapPoints={[scale(260)]}
          enableDynamicSizing={false}
          enablePanDownToClose={false}
          stackBehavior="replace"
          keyboardBehavior="interactive"
          android_keyboardInputMode="adjustResize"
          backgroundStyle={{ backgroundColor: 'rgba(255,255,255,0.0)' }}
          backgroundComponent={GlassBackground}
          handleComponent={GlassHandle}
        >
          <BottomSheetView style={styles.sheetContainerGlass}>
            {/* Section header: Rebocar para + Ver tudo */}
            <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>Rebocar para</Text>
              <TouchableOpacity onPress={operations.handleAddFavouriteButtonPress}>
                <Text style={styles.sectionHeaderLink}>Ver tudo</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Horizontal saved-place cards */}
            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <FlatList
                data={models.favPlaces}
                renderItem={renderSpotsItem}
                keyExtractor={(item, index) => String(item?._id ?? `favorite-${index}`)}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: scale(8) }}
              />
            </Animated.View>

            {/* Pill search bar — bottom of sheet */}
            <Animated.View entering={FadeInDown.delay(140).springify()}>
              <ScalePressable
                onPress={operations.handleMapSearchBarPress}
                style={styles.floatingPillContainer}
              >
                <View style={styles.floatingPill}>
                  <View style={styles.pillIconBubble}>
                    <Icon name="search" size={scale(18)} color={colors.primary} />
                  </View>
                  <Text style={styles.pillPlaceholder}>Para onde está indo?</Text>
                  <View style={styles.pillArrow}>
                    <Icon name="chevron-right" size={scale(20)} color={colors.surface} />
                  </View>
                </View>
              </ScalePressable>
            </Animated.View>
          </BottomSheetView>
        </FlowBottomSheet>}

        {models.activeBottomSheet === 'carType' && <FlowBottomSheet
          ref={models.carTypeSelectionSheetRef}
          onDismiss={() => operations.handleBottomSheetDismiss('carType')}
          index={0}
          snapPoints={[scale(270)]}
          enablePanDownToClose={false}
          enableDynamicSizing={false}
          stackBehavior="replace"
          keyboardBehavior="interactive"
          android_keyboardInputMode="adjustResize"
          backgroundStyle={{ backgroundColor: 'transparent' }}
          backgroundComponent={GlassBackground}
          handleComponent={GlassHandle}
        >
          <Animated.View style={{ flex: 1 }} entering={FadeIn.duration(240)}>
            <Text
              style={{
                fontSize: scale(18),
                alignSelf: "center",
                color: colors.primary,
                fontWeight: "900",
                marginBottom: scale(10),
              }}
            >
              SELECIONE O TIPO DE CARRO
            </Text>
            <FlatList
              data={models.mapDirections && models.prices ? models.prices : []}
              renderItem={renderCarTypesItem}
              keyExtractor={(item, index) => String(item?._id ?? `price-${index}`)}
              ListEmptyComponent={
                <Text style={styles.carTypesEmptyText}>
                  {carTypesEmptyMessage}
                </Text>
              }
            />
          </Animated.View>
        </FlowBottomSheet>}

        {models.activeBottomSheet === 'userCarInfo' && <FlowBottomSheet
          ref={models.userCarInfoSheetRef}
          onDismiss={() => operations.handleBottomSheetDismiss('userCarInfo')}
          index={0}
          snapPoints={[scale(380), scale(500)]}
          enableDynamicSizing={false}
          enablePanDownToClose={false}
          stackBehavior="replace"
          keyboardBehavior="interactive"
          android_keyboardInputMode="adjustResize"
          backgroundStyle={{ backgroundColor: 'transparent' }}
          backgroundComponent={GlassBackground}
          handleComponent={GlassHandle}
        >
          <Animated.View style={{ flex: 1 }} entering={FadeIn.duration(240)}>
            <UserCarInfo
              handleBrandInputValueChange={operations.handleBrandInputValueChange}
              handleColorInputValueChange={operations.handleColorInputValueChange}
              handleLicenseInputValueChange={operations.handleLicenseInputValueChange}
              handleModelInputValueChange={operations.handleModelInputValueChange}
              handleConfirmButtonPress={operations.handleConfirmButtonPress}
              defaultSaveChecked={!models.user?.vehicles?.length}
              initialValues={{
                brand: models.brand,
                model: models.model,
                license: models.license,
                color: models.color,
              }}
            />
          </Animated.View>
        </FlowBottomSheet>}

        {models.activeBottomSheet === 'payment' && <FlowBottomSheet
          ref={models.paymentOptionsSheetRef}
          onDismiss={() => operations.handleBottomSheetDismiss('payment')}
          index={0}
          snapPoints={[scale(320)]}
          enablePanDownToClose={false}
          enableDynamicSizing={false}
          stackBehavior="replace"
          keyboardBehavior="interactive"
          android_keyboardInputMode="adjustResize"
          backgroundStyle={{ backgroundColor: 'transparent' }}
          backgroundComponent={GlassBackground}
          handleComponent={GlassHandle}
        >
          <Animated.View style={{ flex: 1 }} entering={FadeIn.duration(240)}>
            <PaymentOptions handleConfirmPaymentPress={operations.handleConfirmPaymentPress} models={models} />
          </Animated.View>
        </FlowBottomSheet>}
        {models.activeBottomSheet === 'rideSearch' && <FlowBottomSheet
          ref={models.rideSearchSheetRef}
          onDismiss={() => operations.handleBottomSheetDismiss('rideSearch')}
          index={0}
          snapPoints={[scale(270), scale(350)]}
          enablePanDownToClose={false}
          enableDynamicSizing={false}
          stackBehavior="replace"
          keyboardBehavior="interactive"
          android_keyboardInputMode="adjustResize"
          backgroundStyle={{ backgroundColor: 'transparent' }}
          backgroundComponent={GlassBackground}
          handleComponent={GlassHandle}
        >
          <Animated.View
            key={models.activeBottomSheet}
            style={{ flex: 1 }}
            entering={FadeIn.duration(240)}
          >
            <DriverSearch
              destination={models.destinationCity}
              origin={models.originCity}
              timer={models.timer}
              formatTime={operations.formatTime}
              accepted={models.driverConnected}
              onCancelSearch={operations.handleCancelSearch}
              calculateProgress={operations.calculateProgress}
            />
          </Animated.View>
        </FlowBottomSheet>}

        <TripStatusSheets
          models={models}
          operations={operations}
          onShareLocation={handleShareLocation}
        />

        {models.activeBottomSheet === 'details' && <FlowBottomSheet
          ref={models.bottomSheetModalRefDetails}
          onDismiss={() => operations.handleBottomSheetDismiss('details')}
          index={0}
          snapPoints={[SHEET_SNAP_POINTS.details]}
          enableDynamicSizing={false}
          enablePanDownToClose={false}
          stackBehavior="replace"
          keyboardBehavior="interactive"
          android_keyboardInputMode="adjustResize"
          backgroundStyle={{ backgroundColor: 'transparent' }}
          backgroundComponent={GlassBackground}
          handleComponent={GlassHandle}
        >
          <Animated.View style={{ flex: 1 }} entering={FadeIn.duration(240)}>
            {models.driver && models.service && (
              <DetailsItem
                origin={models.originCity}
                destination={models.destinationCity}
                driver={models?.driver}
                clientCar={`${models.brand} | ${models.model} | ${models.color} | ${models.license}`}
                paymentMethod={models?.service?.payment?.method}
                paymentPrice={models.ridePrice}
                type={models?.service?.type_car}
                onBackPress={operations.handleBackDetailsButtonPress}
                onMessageDriver={operations.handleMessageDriver}
              />
            )}
          </Animated.View>
        </FlowBottomSheet>}

        {models.activeBottomSheet === 'dragMarker' && <FlowBottomSheet
          ref={models.bottomSheetModalDragMarker}
          onDismiss={() => operations.handleBottomSheetDismiss('dragMarker')}
          index={0}
          snapPoints={snapPoints}
          enablePanDownToClose={false}
          enableDynamicSizing={false}
          stackBehavior="replace"
          keyboardBehavior="interactive"
          android_keyboardInputMode="adjustResize"
          backgroundStyle={{ backgroundColor: 'transparent' }}
          backgroundComponent={GlassBackground}
          handleComponent={GlassHandle}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {models.inputLocationObject === 0
                ? "DE ONDE VAI PARTIR?"
                : "PARA ONDE ESTÁ INDO?"}
            </Text>

            {/* Display selected address */}
            <View style={styles.searchContainer}>
              <View style={styles.searchTextContainer}>
                <Text style={styles.searchText}>
                  {models.markerCity}
                </Text>
              </View>
            </View>

            {/* Action buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={operations.handleReturnToSearchFromDragMarker}
              >
                <Icon name="search" size={scale(18)} color={colors.textSecondary} />
                <Text style={styles.secondaryButtonText}>
                  Voltar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={operations.handleConfirmDragMarkerLocation}
              >
                <Icon name="check" size={scale(18)} color="#fff" />
                <Text style={styles.confirmButtonText}>
                  Confirmar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </FlowBottomSheet>}

      <MapModalHost models={models} operations={operations} />
    </View>
  );
});

const styles = StyleSheet.create({
  markerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: '50%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 100,
  },
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  carTypesEmptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: scale(14),
    paddingHorizontal: scale(24),
    paddingVertical: scale(16),
    lineHeight: scale(20),
  },
  driverCarIcon: {
    width: scale(50),
    height: scale(50),
  },
  // Faded: this is the last position reported, not a confirmed live one.
  driverCarIconStale: {
    opacity: 0.4,
  },
  bellWrapper: {
    position: 'absolute',
    top: scale(44),
    right: scale(20),
    width: scale(48),
    height: scale(48),
  },
  bellButton: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  bellBadge: {
    position: 'absolute',
    top: -scale(4),
    right: -scale(4),
    minWidth: scale(18),
    height: scale(18),
    borderRadius: scale(9),
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(3),
    borderWidth: 2,
    borderColor: colors.background,
  },
  bellBadgeText: {
    color: '#fff',
    fontSize: scale(10),
    fontWeight: '700',
    lineHeight: scale(13),
  },
  locationChipWrapper: {
    position: 'absolute',
    top: scale(44),
    left: scale(80),
    right: scale(80),
    alignItems: 'center',
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: scale(20),
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  locationChipLabel: {
    fontSize: scale(11),
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  locationChipAddress: {
    fontSize: scale(12),
    color: colors.textPrimary,
    fontWeight: '500',
    maxWidth: scale(200),
  },
  menuGlassButton: {
    width: scale(48),
    height: scale(48),
    position: "absolute",
    borderRadius: scale(24),
    top: scale(44),
    left: scale(20),
    alignItems: "center",
    justifyContent: "center",
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    backgroundColor: 'rgba(255,255,255,0.4)', // Fallback
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  details: {
    width: scale(48),
    height: scale(48),
    position: 'absolute',
    borderRadius: scale(24),
    top: scale(44),
    left: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadows.md,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  recenterButtonWrapper: {
    position: 'absolute',
    right: spacing.xl,
  },
  recenterButton: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadows.md,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  svgContainer: {
    width: scale(318),
    height: scale(50),
    borderRadius: scale(7),
    borderWidth: scale(4),
    borderColor: colors.primary,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: scale(15),
    paddingHorizontal: scale(16),
    marginVertical: scale(10),
  },
  backDetails: {
    width: scale(48),
    height: scale(48),
    position: 'absolute',
    borderRadius: scale(24),
    top: scale(44),
    left: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadows.md,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  containerInputs: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(10),
  },
  row: {
    flexDirection: "row",
    marginBottom: scale(20),
  },
  input: {
    flex: 1,
    width: scale(318),
    height: scale(50),
    borderRadius: scale(7),
    borderWidth: scale(4),
    borderColor: colors.primary,
    overflow: "hidden",
    marginHorizontal: scale(10),
    paddingHorizontal: scale(10),
  },
  button: {
    width: scale(310),
    height: scale(50),
    borderRadius: scale(7),
    backgroundColor: colors.primary,
    marginHorizontal: scale(20),
    justifyContent: "center",
    alignItems: "center",
  },
  circle: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(75),
    borderColor: "black",
    borderWidth: scale(2),
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  circle2: {
    width: scale(35),
    height: scale(35),
    borderRadius: scale(75),
    borderColor: colors.primary,
    borderWidth: scale(2),
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginHorizontal: scale(18),
    marginTop: scale(20),
  },
  circle3: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(75),
    borderWidth: scale(2),
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  cross: {
    fontSize: scale(35),
    color: "black",
  },
  spacing: {
    width: scale(30), // Desired spacing width between the circle and other items
  },
  divider: {
    alignSelf: "center",
    borderBottomColor: "#000",
    borderBottomWidth: scale(2),
    marginVertical: scale(5),
    width: scale(330),
  },
  overlay: {
    position: "absolute",
    backgroundColor: "#fff",
    width: scale(300),
    height: scale(200),
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    top: scale(250),
    borderRadius: scale(20),
  },
  modalContent: {
    marginHorizontal: scale(20),
  },
  modalTitle: {
    fontSize: scale(16),
    color: colors.textPrimary,
    fontWeight: "800",
    marginTop: scale(15),
    marginBottom: scale(20),
    letterSpacing: 0.5,
  },
  searchContainer: {
    borderRadius: scale(16),
    backgroundColor: colors.background,
    padding: scale(16),
    marginBottom: scale(20),
    flexDirection: "row",
    alignItems: "center",
  },
  searchGradientBorder: {
    borderRadius: scale(16),
    padding: scale(2), // serves as border width
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  sheetContainerGlass: {
    flex: 1,
    paddingTop: scale(12),
  },
  capsuleHandleContainer: {
    alignItems: 'center',
    marginBottom: scale(20),
    marginTop: scale(8),
  },
  capsuleHandle: {
    width: scale(40),
    height: scale(5),
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: scale(10),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxs,
    paddingBottom: spacing.md,
  },
  sectionHeaderTitle: {
    fontSize: scale(14),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionHeaderLink: {
    fontSize: scale(14),
    fontWeight: '600',
    color: colors.primary,
  },
  floatingPillContainer: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    elevation: 10,
  },
  floatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: scale(26),
    height: scale(52),
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
       ...shadows.md
  },
  pillIconBubble: {
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillPlaceholder: {
    flex: 1,
    fontSize: scale(15),
    color: colors.textMuted,
  },
  pillArrow: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(17),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassSectionTitle: {
    fontSize: scale(14),
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.md,
    marginHorizontal: spacing.lg,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  squircleCard: {
    alignItems: 'center',
    width: scale(72),
  },
  squircleGradient: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(24), // Super-ellipseish
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(8),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  squircleText: {
    fontSize: scale(12),
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  svgContainer: {
    // ...

    paddingHorizontal: scale(10),
  },
  glassHandleContainer: {
    alignItems: 'center',
    paddingVertical: scale(12),
  },
  glassHandleIndicator: {
    width: scale(40),
    height: scale(5),
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: scale(10),
  },
  searchText: {
    fontSize: scale(15),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(12),
    marginTop: scale(5),
    marginBottom: scale(10),
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    backgroundColor: '#F1F5F9',
    borderRadius: scale(14),
    height: scale(48),
  },
  secondaryButtonText: {
    color: '#64748B',
    fontSize: scale(15),
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    backgroundColor: colors.primary,
    borderRadius: scale(14),
    height: scale(48),
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: scale(15),
    fontWeight: '600',
  },
});
export default MapScreen;
