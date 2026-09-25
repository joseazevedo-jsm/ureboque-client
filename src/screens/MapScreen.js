import React, { createContext, useContext, useEffect, memo, useMemo, useCallback, useRef, useState } from "react";
import { Image, Modal, PixelRatio, useWindowDimensions, Share, StyleSheet, View } from 'react-native';
import { AppText as Text } from '../components/common/AppText';
import { AppPressable as TouchableOpacity } from '../components/common/AppPressable';

import MapView, { Circle, Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import { ScalePressable } from "../components/common/ScalePressable";
import { BlurView } from "expo-blur";
import Animated, { FadeIn, FadeInDown, FadeInRight, FadeInUp, useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { sizes, layout, typography, componentStyles, colors, spacing, shadows, borderRadius } from '../theme';
import ScheduledTowDetails from '../components/common/ScheduledTowDetails';
import { formatScheduledFor } from '../utils/scheduling';
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
import { useMeasuredSheet, useNavBarPad } from "../components/map/useMeasuredSheet";

// The modal/portal variant can preserve a closed internal index across Fast
// Refresh even after present() is called. Flow sheets are already mutually
// exclusive, so a regular controlled BottomSheet is simpler and deterministic.
// Keep the former imperative API so the flow manager does not need to care
// which Gorhom shell renders the sheet.
// Rendered only while it is the active sheet, and opened imperatively once its
// ref attaches. See the note on showBottomSheet: a BottomSheet measures its
// container once on mount, which is the source of the recovery effects below.
// Snap points are authored at the default text size and exclude the navigation
// bar. The rendered sheet grows with the font scale (capped) and sits above the
// bar; some Huawei/EMUI builds report a zero inset while the three-button bar
// still covers the bottom of an edge-to-edge view. Shared so anything placed
// above a sheet uses the same height the sheet really has.
const useSheetHeight = () => {
  const inset = useNavBarPad();
  // Keep the map sheet proportional on large-display accessibility settings;
  // text itself still scales, while the sheet avoids swallowing the map.
  const fontScale = Math.min(Math.max(PixelRatio.getFontScale(), 1), 1.15);
  return useCallback((point) => Math.round(point * fontScale) + inset, [fontScale, inset]);
};

const capitalize = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text);

// Lets any mounted sheet report that it moved to another snap point.
const SheetMovedContext = createContext(null);

const FlowBottomSheet = React.forwardRef(({
  stackBehavior: _stackBehavior,
  onChange,
  snapPoints,
  // Heights that came from useMeasuredSheet are already the real content
  // height, so they take the nav-bar allowance but not the font-scale multiply
  // (the measured content has scaled with the font already).
  measured = false,
  isActive = true,
  index = 0,
  children,
  ...props
}, forwardedRef) => {
  const sheetRef = useRef(null);
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();
  const { top: topInset } = useSafeAreaInsets();
  const sheetHeight = useSheetHeight();
  const navBarPad = useNavBarPad();
  const safeSnapPoints = useMemo(
    () => snapPoints?.map((point) => {
      if (typeof point !== 'number') return point;
      const height = measured ? point + navBarPad : sheetHeight(point);
      return Math.min(height, viewportHeight - topInset - spacing.lg);
    }),
    [snapPoints, measured, navBarPad, sheetHeight, viewportHeight, topInset],
  );

  React.useImperativeHandle(forwardedRef, () => ({
    present: () => sheetRef.current?.snapToIndex(0),
    dismiss: () => sheetRef.current?.close(),
    snapToIndex: (index) => sheetRef.current?.snapToIndex(index),
    close: () => sheetRef.current?.close(),
  }), []);

  const onSheetMoved = useContext(SheetMovedContext);
  const handleChange = useCallback((changedIndex) => {
    onSheetMoved?.();
    onChange?.(changedIndex);
  }, [onChange, onSheetMoved]);

  if (!isActive) return null;

  return (
    <BottomSheet
      ref={sheetRef}
      onChange={handleChange}
      snapPoints={safeSnapPoints}
      maxDynamicContentSize={viewportHeight - topInset - spacing.lg}
      index={index}
      // A sheet mounts at index -1 and animates up to its snap point. That
      // animation is driven by Reanimated, which does not run while the app is
      // backgrounded — so a sheet that swapped in while the user was in another
      // app stayed parked below the screen, mounted and laid out but never
      // raised, and nothing re-issued the animation on resume. Measured: the
      // handle sat at y=1.02 instead of 0.54. Starting at the snap point
      // outright removes the animation, so there is nothing left to drop.
      animateOnMount={false}
      {...props}
    >
      {children}
    </BottomSheet>
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
// Snap point arrays must keep a stable identity. BottomSheet re-initialises its
// layout whenever the snapPoints prop changes, and an inline array literal is a
// new value on every render — during a trip, where driver-location updates
// re-render this screen continuously, the sheet was re-initialising faster than
// it could settle and so never opened at all. Built once per window height and
// cached, so identity only changes when the window really does (rotation,
// foldable unfold, split-screen) — never on an ordinary re-render.
const buildSheetSnaps = (screenHeight) => {
  const SHEET_SNAP_POINTS = {
    driverStatusExpanded: Math.round(screenHeight * 0.72),
    driverStatusExpandedNoCancel: Math.round(screenHeight * 0.64),
    driverStatusCollapsed: Math.round(screenHeight * 0.42),
    details: Math.round(screenHeight * 0.9),
  };

  const PAYMENT_SNAP = [Math.round(screenHeight * 0.49), Math.round(screenHeight * 0.76)];

  const BOOKING_SNAP = {
    initial:     ['45%'],
    initialWithScheduled: ['50%'],
    carType:     [Math.round(screenHeight * 0.34)],
    userCarInfo: [Math.round(screenHeight * 0.50), Math.round(screenHeight * 0.76)],
    payment:     PAYMENT_SNAP,
    paymentScheduled: PAYMENT_SNAP,
    // rideSearch stops just below the route card's divider at rest ("Cancelar
    // Viagem" stays off-screen) and drags up only far enough to reveal that
    // button — anything taller leaves dead space under it. Height budget (dp):
    // handle 21 + header 104 + routeCard 118 | + spacer 20 + button 44 + nav bar
    // pad 43 (the transparent gesture bar lets the surface run to the physical
    // screen bottom; the pad keeps the button above it).
    rideSearch:  [244, 351],
    // Scheduled search adds one description line ("Recolha ...") to both stops.
    rideSearchScheduled: [264, 371],
    details:     [SHEET_SNAP_POINTS.details],
    dragMarker:  [Math.round(screenHeight * 0.34)],
  };

  const DRIVER_STATUS_SNAP = [
    SHEET_SNAP_POINTS.driverStatusCollapsed,
    SHEET_SNAP_POINTS.driverStatusExpanded,
  ];
  const DRIVER_STATUS_SNAP_NO_CANCEL = [
    SHEET_SNAP_POINTS.driverStatusCollapsed,
    SHEET_SNAP_POINTS.driverStatusExpandedNoCancel,
  ];

  // Resting heights for the recenter button (see MapControls).
  const SHEET_REST_HEIGHT = {
    initial: 300,
    carType: BOOKING_SNAP.carType[0],
    userCarInfo: BOOKING_SNAP.userCarInfo[0],
    payment: BOOKING_SNAP.payment[0],
    rideSearch: BOOKING_SNAP.rideSearch[0],
    details: BOOKING_SNAP.details[0],
    driverArriving: SHEET_SNAP_POINTS.driverStatusCollapsed,
    tripStarted: SHEET_SNAP_POINTS.driverStatusCollapsed,
    tripEnding: SHEET_SNAP_POINTS.driverStatusCollapsed,
  };

  return { PAYMENT_SNAP, BOOKING_SNAP, DRIVER_STATUS_SNAP, DRIVER_STATUS_SNAP_NO_CANCEL, SHEET_REST_HEIGHT };
};

const sheetSnapsCache = new Map();
const useSheetSnaps = () => {
  const height = Math.round(useWindowDimensions().height);
  if (!sheetSnapsCache.has(height)) sheetSnapsCache.set(height, buildSheetSnaps(height));
  return sheetSnapsCache.get(height);
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
const GlassBackground = memo(({ style }) => <View style={[style, { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xxl, borderTopRightRadius: borderRadius.xxl }]} />);

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

  // Staleness has to travel through the animated style, not a conditional
  // entry in the style array. Reanimated owns this node's props once an
  // animated style is attached, and a sibling static style that flips after
  // mount is not re-applied — `isStale` was toggling correctly for minutes
  // while the marker stayed fully opaque, so a driver who had stopped
  // reporting still looked live.
  const staleness = useSharedValue(1);
  useEffect(() => {
    staleness.value = withTiming(isStale ? 0.4 : 1, { duration: 300 });
  }, [isStale]);

  const carAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${heading.value}deg` }],
    opacity: staleness.value,
  }));

  if (!driver || !displayLocation) return null;

  return (
    <Marker
      coordinate={displayLocation}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <Animated.Image
        source={getCarIconByColor(driver?.car?.color)}
        style={[styles.driverCarIcon, carAnimatedStyle]}
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
    onRegionChangeComplete={operations.handleRegionChangeComplete}
    toolbarEnabled={false}
    customMapStyle={customStyleMap}
    style={styles.map}
  >
    {models?.showsUserLocation && isValidCoordinate(models?.userLocation) && (
      <Circle center={models.userLocation} radius={models.userLocation.accuracy || 50} strokeWidth={1} strokeColor={colors.mapAccuracyStroke} fillColor={colors.mapAccuracyFill} />
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

// The recenter button is hidden by default in every sheet. It appears only after
// the user moves the map, and hides again when they recenter or when the sheet
// changes in any way (a new step, or dragged to another snap point). So it is
// only ever visible while the sheet is still, and can sit at that sheet's
// resting height instead of chasing a sheet that is resizing.
const RECENTER_GAP = scale(16);

const MapControls = memo(({ models, operations, navigation, openDrawer, measuredRestHeight }) => {
  const insets = useSafeAreaInsets();
  const controlTop = insets.top + spacing.lg;
  const rideActive = !!models.driver || ['assigned', 'in-progress', 'completed'].includes(models.tripState);
  const sheetHeight = useSheetHeight();
  const { BOOKING_SNAP, SHEET_REST_HEIGHT } = useSheetSnaps();
  // Sheets that size themselves from their content report their real resting
  // height; the rest still come from the hand-tuned table below. Keeping the
  // measured ones out of that table is what stops the two drifting apart.
  const restHeight =
    models.activeBottomSheet === 'rideSearch' && models.service?.scheduledFor ? BOOKING_SNAP.rideSearchScheduled[0]
      : SHEET_REST_HEIGHT[models.activeBottomSheet];
  const sheetBottom = measuredRestHeight != null
    ? measuredRestHeight
    : restHeight != null ? sheetHeight(restHeight) : null;
  const showRecenter = models.mapMovedByUser && sheetBottom != null;
  return (
  <>
    {(models.isRouteVisible || models.canGoBackBottomSheet) && !models.service ? (
      <TouchableOpacity accessibilityLabel="Voltar" style={[styles.details, { top: controlTop }]} onPress={operations.handleBackButtonPress} activeOpacity={0.8}><Icon name="arrow-back" size={scale(24)} color={colors.primary} /></TouchableOpacity>
    ) : (
      <TouchableOpacity accessibilityLabel="Abrir menu" style={[styles.menuGlassButton, { top: controlTop }]} onPress={openDrawer} activeOpacity={0.8}><Text style={styles.menuGlyph}>☰</Text></TouchableOpacity>
    )}
    {!models.isRouteVisible && !models.service && <View style={[styles.bellWrapper, { top: controlTop }]}><TouchableOpacity accessibilityLabel="Notificações" style={styles.bellButton} onPress={() => navigation.navigate('Notificacoes')} activeOpacity={0.8}><Icon name="notifications-none" size={scale(24)} color={colors.primary} /></TouchableOpacity>{models.unreadNotificationsCount > 0 && <View style={styles.bellBadge}><Text style={styles.bellBadgeText}>{models.unreadNotificationsCount > 99 ? '99+' : models.unreadNotificationsCount}</Text></View>}</View>}
    {!rideActive && !models.markerVisible && <Animated.View entering={FadeIn.duration(300)} style={[styles.locationChipWrapper, { top: controlTop }]}><ScalePressable onPress={operations.handleRecenterMap} style={styles.locationChip}><Icon name="my-location" size={sizes.iconSmall} color={colors.primary} style={{ marginRight: spacing.xs }} /><View><Text style={styles.locationChipLabel}>Sua Localização</Text><Text style={styles.locationChipAddress} numberOfLines={1}>{models.currentLocationLabel || 'Obtendo localização...'}</Text></View></ScalePressable></Animated.View>}
    {models.markerVisible && models.activeBottomSheet === 'dragMarker' && <View style={styles.markerOverlay} pointerEvents="none"><CustomMarker title={models.markerCity || 'Carregando...'} color={models.inputLocationObject === 0 ? colors.primary : colors.destinationPin} /></View>}
    {showRecenter && <Animated.View entering={FadeIn.duration(200)} style={[styles.recenterButtonWrapper, { bottom: sheetBottom + RECENTER_GAP }]}><ScalePressable accessibilityLabel="Centrar mapa na minha localização" onPress={operations.handleRecenterMap} style={styles.recenterButton}><Icon name="my-location" size={scale(24)} color={colors.primary} /></ScalePressable></Animated.View>}
  </>
  );
});

const DriverStatusSheet = memo(({
  sheetRef,
  sheetName,
  activeBottomSheet,
  snapPoints,
  onContentLayout,
  onFoldLayout,
  status,
  models,
  operations,
  onShareLocation,
  onCancelTrip,
  driverStatusSheetRef,
}) => {
  const isActive = activeBottomSheet === sheetName;
  return (
  <FlowBottomSheet
    isActive={isActive}
    ref={sheetRef}
    index={0}
    // Measured: rest lands on the divider above the actions, expanded ends
    // just past "Cancelar viagem". The old flat 72% ran the last button's
    // bottom edge under the system nav bar.
    snapPoints={snapPoints}
    measured
    enablePanDownToClose={false}
    enableDynamicSizing={false}
    stackBehavior="replace"
    backgroundStyle={{ backgroundColor: 'transparent' }}
    backgroundComponent={GlassBackground}
    handleComponent={GlassHandle}
  >
    <Animated.View
      key={activeBottomSheet}
      onLayout={onContentLayout}
      entering={FadeIn.duration(240)}
    >
      <DriverStatus
        onFoldLayout={onFoldLayout}
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
  );
});

const TripStatusSheets = memo(({ models, operations, onShareLocation, sheets }) => (
  <>
    <DriverStatusSheet
      sheetRef={models.tripStartedSheetRef}
      sheetName="tripStarted"
      activeBottomSheet={models.activeBottomSheet}
      snapPoints={sheets.tripStarted.snapPoints}
      onContentLayout={sheets.tripStarted.onContentLayout}
      onFoldLayout={sheets.tripStarted.onFoldLayout}
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
      snapPoints={sheets.driverArriving.snapPoints}
      onContentLayout={sheets.driverArriving.onContentLayout}
      onFoldLayout={sheets.driverArriving.onFoldLayout}
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
      snapPoints={sheets.tripEnding.snapPoints}
      onContentLayout={sheets.tripEnding.onContentLayout}
      onFoldLayout={sheets.tripEnding.onFoldLayout}
      status={TRIP_STATUS.IN_PROGRESS}
      models={models}
      operations={operations}
      onShareLocation={onShareLocation}
      onCancelTrip={operations.handleCancelTrip}
      driverStatusSheetRef={models.tripEndingSheetRef}
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
  const homeInsets = useSafeAreaInsets();
  // Transparent gesture nav bar: surfaces run to the physical screen bottom;
  // this pad keeps sheet content above the bar. FlowBottomSheet already adds it
  // to every numeric snap point, so snap points must not add it a second time —
  // doing so was why the payment sheet sat ~30dp taller than its content.
  const navBarPad = useNavBarPad();
  const { PAYMENT_SNAP, BOOKING_SNAP, DRIVER_STATUS_SNAP, DRIVER_STATUS_SNAP_NO_CANCEL } = useSheetSnaps();
  const {
    snapPoints: paymentSnapPoints,
    onContentLayout: onPaymentLayout,
  } = useMeasuredSheet(PAYMENT_SNAP);
  const {
    snapPoints: initialSnapPoints,
    onContentLayout: onInitialLayout,
  } = useMeasuredSheet(BOOKING_SNAP.initial);
  const {
    snapPoints: carInfoSnapPoints,
    onContentLayout: onCarInfoLayout,
  } = useMeasuredSheet(BOOKING_SNAP.userCarInfo);
  const {
    snapPoints: rideSearchSnapPoints,
    onContentLayout: onRideSearchLayout,
    onFoldLayout: onRideSearchFold,
  } = useMeasuredSheet(BOOKING_SNAP.rideSearch);
  const {
    snapPoints: detailsSnapPoints,
    onContentLayout: onDetailsLayout,
  } = useMeasuredSheet(BOOKING_SNAP.details);
  // The three trip sheets share one layout, but each measures itself: the
  // in-progress one has no "Cancelar viagem" row and so is genuinely shorter.
  const tripStartedSheet = useMeasuredSheet(DRIVER_STATUS_SNAP);
  const driverArrivingSheet = useMeasuredSheet(DRIVER_STATUS_SNAP);
  const tripEndingSheet = useMeasuredSheet(DRIVER_STATUS_SNAP_NO_CANCEL);
  const tripSheets = useMemo(() => ({
    tripStarted: tripStartedSheet,
    driverArriving: driverArrivingSheet,
    tripEnding: tripEndingSheet,
  }), [tripStartedSheet, driverArrivingSheet, tripEndingSheet]);
  const logger = useLogger('MapScreen');
  const { models, operations } = useMapScreen();

  // The resting height of whichever measured sheet is on, so the recenter
  // button can sit above it without a second copy of the snap-point table.
  const measuredRestHeight = useMemo(() => {
    const points = {
      initial: initialSnapPoints,
      payment: paymentSnapPoints,
      userCarInfo: carInfoSnapPoints,
      rideSearch: rideSearchSnapPoints,
      details: detailsSnapPoints,
      tripStarted: tripSheets.tripStarted.snapPoints,
      driverArriving: tripSheets.driverArriving.snapPoints,
      tripEnding: tripSheets.tripEnding.snapPoints,
    }[models.activeBottomSheet];
    const rest = points?.[0];
    return typeof rest === 'number' ? rest + navBarPad : null;
  }, [models.activeBottomSheet, initialSnapPoints, paymentSnapPoints, carInfoSnapPoints, rideSearchSnapPoints, detailsSnapPoints, tripSheets, navBarPad]);

  logger.debug('MapScreen rendered', {
    activeBottomSheet: models.activeBottomSheet,
    hasDestination: !!models.destination,
    hasSelectedCar: !!models.selectedCar,
    driverCount: models.nearbyDrivers?.length || 0,
    // The trip sheets render null without a driver, so an active sheet with no
    // driver looks identical to no sheet at all. Both are needed to tell those
    // apart from a log.
    tripStatus: models.tripData?.status,
    hasDriver: !!models.driver,
  });

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
  // NB: the hook exposes this array as `mapMarkers`, not `markers`. Reading the
  // wrong name made this check silently impossible, so an unroutable pair fell
  // through to "A calcular percurso..." and hung there.
  const routePoints = models.mapMarkers;
  const sameOriginAndDestination =
    routePoints?.length === 2 &&
    isValidCoordinate(routePoints[0]) &&
    isValidCoordinate(routePoints[1]) &&
    Math.hypot(
      (routePoints[1].latitude - routePoints[0].latitude) * 111320,
      (routePoints[1].longitude - routePoints[0].longitude) * 111320 *
        Math.cos((routePoints[0].latitude * Math.PI) / 180),
    ) < 25;

  // A failed price fetch is indistinguishable from a slow one if the only
  // message is "A calcular percurso...". On a slow or flaky link the request
  // times out after 10s and the sheet then sat on that text forever — no
  // price, no car types, no way to retry. Say what happened and offer the
  // retry instead.
  const priceFetchFailed = models.pricesError && !models.prices;
  // Prices loaded but the list is empty (nothing configured on the server):
  // not a loading state, so don't say "a calcular" forever.
  const noCarTypes = Array.isArray(models.prices) && models.prices.length === 0;
  const carTypesEmptyMessage = sameOriginAndDestination
    ? 'O destino é praticamente o mesmo que o local de recolha. Escolha um destino diferente.'
    : priceFetchFailed
      ? 'Não foi possível calcular o preço. Verifique a sua ligação à internet.'
      : noCarTypes
        ? 'De momento não há reboques disponíveis. Tente novamente mais tarde.'
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
              width: sizes.control,
              height: sizes.control,
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
    return undefined;
  }, []);

  // The drawer no longer dismisses the sheet. Dismissing it meant the only
  // record of which sheet to restore lived in a ref, restored from a
  // drawerClose event — and when that event did not fire, or bailed on its
  // guard, the sheet was simply gone and the app had to be restarted. Sheet
  // visibility is state; the drawer has no business editing it.
  const openDrawer = () => {
    navigation.openDrawer();
  };

  return (
    <SheetMovedContext.Provider value={operations.handleSheetMoved}>
    <View style={styles.container}>
      <MapViewport models={models} operations={operations} mapMarkers={memoizedMapMarkers} carsAround={memoizedCarsAround} />


      <ScheduledTowDetails
        job={models.scheduledTow}
        visible={models.scheduledDetailsVisible && !!models.scheduledTow}
        onClose={operations.closeScheduledDetails}
        destructiveLabel="Cancelar agendamento"
        confirmText={models.scheduledTow?.claimedBy
          ? 'O seu reboque agendado será cancelado e o motorista que o reservou é avisado.'
          : 'O seu reboque agendado será cancelado.'}
        keepLabel="Manter"
        confirmLabel="Sim, cancelar"
        onDestructive={operations.handleCancelScheduledTow}
      />
      <MapControls models={models} operations={operations} navigation={navigation} openDrawer={openDrawer} measuredRestHeight={measuredRestHeight} />

        <FlowBottomSheet
          isActive={models.activeBottomSheet === 'initial'}
          // Remount after an alert closes: a sheet that mounted under the
          // alert's Modal measured a zero-height container and renders nothing.
          ref={models.bottomSheetModalRef}
          index={0}
          // One stop at the measured content height: the search pill is the
          // primary action and has to be fully visible at rest. The old '45%'
          // /'50%' strings bypassed the nav-bar allowance entirely, which left
          // most of the pill behind the system bar.
          snapPoints={initialSnapPoints}
          measured
          enableDynamicSizing={false}
          enablePanDownToClose={false}
          stackBehavior="replace"
          backgroundStyle={{ backgroundColor: colors.transparent }}
          backgroundComponent={GlassBackground}
          handleComponent={GlassHandle}
        >
          <BottomSheetView onLayout={onInitialLayout} style={styles.sheetContainerGlass}>
            {/* Tow booked for later: only present while one exists */}
            {models.scheduledTow && (
              <Animated.View entering={FadeInDown.springify()}>
                <ScalePressable onPress={operations.handleScheduledTowPress} style={styles.scheduledCard}>
                  <View style={styles.scheduledIcon}>
                    <Icon name="event" size={sizes.icon} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.scheduledTitle}>{capitalize(formatScheduledFor(models.scheduledTow.scheduledFor))}</Text>
                    <View style={styles.scheduledStatusRow}>
                      <View style={[styles.scheduledDot, models.scheduledTow.claimedBy && styles.scheduledDotClaimed]} />
                      <Text style={styles.scheduledStatus} numberOfLines={1}>
                        {models.scheduledTow.claimedBy && models.scheduledTow.confirmRequestedAt && !models.scheduledTow.confirmedAt
                          ? 'Reservado · a aguardar confirmação'
                          : models.scheduledTow.claimedBy
                          ? `Confirmado${models.scheduledTow.claimedBy.details?.name ? ` · ${models.scheduledTow.claimedBy.details.name}` : ''}`
                          : 'À procura de motorista'}
                      </Text>
                    </View>
                  </View>
                  <Icon name="chevron-right" size={sizes.icon} color={colors.primary} />
                </ScalePressable>
              </Animated.View>
            )}

            {/* Section header: Rebocar para + Ver tudo */}
            <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>Rebocar para</Text>
              <TouchableOpacity style={{ minHeight: sizes.control, minWidth: sizes.controlLarge + spacing.xl, justifyContent: 'center', alignItems: 'flex-end' }} onPress={operations.handleAddFavouriteButtonPress}>
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
                contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}
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
                    <Icon name="search" size={sizes.icon} color={colors.primary} />
                  </View>
                  <Text style={styles.pillPlaceholder}>Para onde está indo?</Text>
                  <View style={styles.pillArrow}>
                    <Icon name="chevron-right" size={scale(20)} color={colors.surface} />
                  </View>
                </View>
              </ScalePressable>
            </Animated.View>
          </BottomSheetView>
        </FlowBottomSheet>

        <FlowBottomSheet
          isActive={models.activeBottomSheet === 'carType'}
          ref={models.carTypeSelectionSheetRef}
          index={0}
          snapPoints={BOOKING_SNAP.carType}
          enablePanDownToClose={false}
          enableDynamicSizing={false}
          stackBehavior="replace"
          backgroundStyle={{ backgroundColor: 'transparent' }}
          backgroundComponent={GlassBackground}
          handleComponent={GlassHandle}
        >
          <Animated.View style={{ flex: 1 }} entering={FadeIn.duration(240)}>
            <Text
              style={{
                fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
                // alignSelf centres the element but does not constrain it, so
                // at larger text sizes the heading grew wider than the sheet
                // and its first letter was clipped off the left edge. Fill the
                // width and centre the text inside padding instead.
                textAlign: "center",
                paddingHorizontal: spacing.lg,
                color: colors.primary,
                fontWeight: "700",
                marginBottom: spacing.sm,
              }}
            >
              SELECIONE O TIPO DE CARRO
            </Text>
            <FlatList
              data={models.mapDirections && models.prices ? models.prices : []}
              renderItem={renderCarTypesItem}
              keyExtractor={(item, index) => String(item?._id ?? `price-${index}`)}
              ListEmptyComponent={
                <View>
                  <Text style={styles.carTypesEmptyText}>
                    {carTypesEmptyMessage}
                  </Text>
                  {(priceFetchFailed || noCarTypes) && (
                    <TouchableOpacity
                      style={styles.carTypesRetryButton}
                      onPress={operations.fetchPrices}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.carTypesRetryText}>Tentar novamente</Text>
                    </TouchableOpacity>
                  )}
                </View>
              }
            />
          </Animated.View>
        </FlowBottomSheet>

        <FlowBottomSheet
          isActive={models.activeBottomSheet === 'userCarInfo'}
          ref={models.userCarInfoSheetRef}
          index={0}
          // Measured: the old second stop was a flat 76% of the screen, which
          // sat ~235dp below the Confirmar button.
          snapPoints={carInfoSnapPoints}
          measured
          enableDynamicSizing={false}
          enablePanDownToClose={false}
          stackBehavior="replace"
          // Only this sheet has text fields. Sheets without inputs must not react
          // to the keyboard: the next sheet mounts while the keyboard is still
          // closing and would be lifted, then slide down after it.
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          android_keyboardInputMode="adjustPan"
          backgroundStyle={{ backgroundColor: 'transparent' }}
          backgroundComponent={GlassBackground}
          handleComponent={GlassHandle}
        >
          <Animated.View onLayout={onCarInfoLayout} entering={FadeIn.duration(240)}>
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
        </FlowBottomSheet>

        <FlowBottomSheet
          isActive={models.activeBottomSheet === 'payment'}
          ref={models.paymentOptionsSheetRef}
          index={0}
          // Picking a payment method *is* the action here — there is no button
          // below a divider — so the sheet has a single stop at exactly the
          // content height. It regrows on its own when "Agendar" adds the time
          // wheel, which is what used to leave ~80dp of blank under the options.
          snapPoints={paymentSnapPoints}
          measured
          enableContentPanningGesture={false}
          enablePanDownToClose={false}
          enableDynamicSizing={false}
          stackBehavior="replace"
          backgroundStyle={{ backgroundColor: 'transparent' }}
          backgroundComponent={GlassBackground}
          handleComponent={GlassHandle}
        >
          <Animated.View onLayout={onPaymentLayout} entering={FadeIn.duration(160)}>
            <PaymentOptions
              handleConfirmPaymentPress={operations.handleConfirmPaymentPress}
              onScheduleChange={operations.handleScheduleChange}
              models={models}
            />
          </Animated.View>
        </FlowBottomSheet>
        <FlowBottomSheet
          isActive={models.activeBottomSheet === 'rideSearch'}
          ref={models.rideSearchSheetRef}
          index={0}
          // Measured: rest lands on the divider under the route card and the
          // drag up reveals "Cancelar Viagem" with nothing below it. The two
          // hand-tuned pairs this replaced only held for one text size.
          snapPoints={rideSearchSnapPoints}
          measured
          enablePanDownToClose={false}
          enableDynamicSizing={false}
          stackBehavior="replace"
          backgroundStyle={{ backgroundColor: 'transparent' }}
          backgroundComponent={GlassBackground}
          handleComponent={GlassHandle}
        >
          <Animated.View
            key={models.activeBottomSheet}
            onLayout={onRideSearchLayout}
            entering={FadeIn.duration(240)}
          >
            <DriverSearch
              onFoldLayout={onRideSearchFold}
              scheduledFor={models.service?.scheduledFor}
              scheduledService={models.service}
              destination={models.destinationCity}
              origin={models.originCity}
              timer={models.timer}
              formatTime={operations.formatTime}
              accepted={models.driverConnected}
              onCancelSearch={operations.handleCancelSearch}
              calculateProgress={operations.calculateProgress}
            />
          </Animated.View>
        </FlowBottomSheet>

        <TripStatusSheets
          models={models}
          operations={operations}
          onShareLocation={handleShareLocation}
          sheets={tripSheets}
        />

        <FlowBottomSheet
          isActive={models.activeBottomSheet === 'details'}
          ref={models.bottomSheetModalRefDetails}
          index={0}
          // Measured: this was a flat 90% of the screen regardless of content,
          // which left ~130dp of blank under the payment row.
          snapPoints={detailsSnapPoints}
          measured
          enableDynamicSizing={false}
          enablePanDownToClose={false}
          stackBehavior="replace"
          backgroundStyle={{ backgroundColor: 'transparent' }}
          backgroundComponent={GlassBackground}
          handleComponent={GlassHandle}
        >
          <Animated.View onLayout={onDetailsLayout} entering={FadeIn.duration(240)}>
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
        </FlowBottomSheet>

        <FlowBottomSheet
          isActive={models.activeBottomSheet === 'dragMarker'}
          ref={models.bottomSheetModalDragMarker}
          index={0}
          snapPoints={BOOKING_SNAP.dragMarker}
          enablePanDownToClose={false}
          enableDynamicSizing={false}
          stackBehavior="replace"
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
                <Icon name="search" size={sizes.icon} color={colors.textSecondary} />
                <Text style={styles.secondaryButtonText}>
                  Voltar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={operations.handleConfirmDragMarkerLocation}
              >
                <Icon name="check" size={sizes.icon} color={colors.surface} />
                <Text style={styles.confirmButtonText}>
                  Confirmar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </FlowBottomSheet>

      <MapModalHost models={models} operations={operations} />
    </View>
    </SheetMovedContext.Provider>
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
  carTypesRetryButton: {
    alignSelf: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  carTypesRetryText: {
    color: colors.surface,
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    fontWeight: '700',
  },
  carTypesEmptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    lineHeight: 20,
  },
  driverCarIcon: {
    width: scale(50),
    height: scale(50),
  },
  // Faded: this is the last position reported, not a confirmed live one.
  driverCarIconStaleRemoved: {
  },
  bellWrapper: {
    position: 'absolute',
    top: scale(44),
    right: scale(20),
    width: sizes.control,
    minHeight: sizes.control,
  },
  bellButton: {
    width: sizes.control,
    minHeight: sizes.control,
    borderRadius: borderRadius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  bellBadge: {
    position: 'absolute',
    top: -scale(4),
    right: -scale(4),
    minWidth: scale(18),
    height: scale(18),
    borderRadius: borderRadius.md,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    borderWidth: 2,
    borderColor: colors.background,
  },
  bellBadgeText: {
    color: colors.surface,
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    fontWeight: '700',
    lineHeight: 16,
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
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  locationChipLabel: {
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  locationChipAddress: {
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    color: colors.textPrimary,
    fontWeight: '500',
    maxWidth: scale(200),
  },
  menuGlassButton: {
    width: sizes.control,
    minHeight: sizes.control,
    position: "absolute",
    borderRadius: borderRadius.xxl,
    top: scale(44),
    left: scale(20),
    alignItems: "center",
    justifyContent: "center",
    overflow: 'hidden',
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    backgroundColor: colors.surface, // Fallback
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  menuGlyph: {
    fontSize: typography.h2.fontSize, lineHeight: typography.h2.lineHeight,
    lineHeight: typography.h2.lineHeight,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  details: {
    width: sizes.control,
    minHeight: sizes.control,
    position: 'absolute',
    borderRadius: borderRadius.xxl,
    top: scale(44),
    left: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadows.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  recenterButtonWrapper: {
    position: 'absolute',
    right: spacing.xl,
  },
  recenterButton: {
    width: sizes.control,
    minHeight: sizes.control,
    borderRadius: borderRadius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadows.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  svgContainer: {
    width: scale(318),
    height: scale(50),
    borderRadius: borderRadius.sm,
    borderWidth: scale(4),
    borderColor: colors.primary,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.sm,
  },
  backDetails: {
    width: sizes.control,
    minHeight: sizes.control,
    position: 'absolute',
    borderRadius: borderRadius.xxl,
    top: scale(44),
    left: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadows.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  containerInputs: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
  },
  row: {
    flexDirection: "row",
    marginBottom: spacing.xl,
  },
  input: {
    flex: 1,
    width: scale(318),
    height: scale(50),
    borderRadius: borderRadius.sm,
    borderWidth: scale(4),
    borderColor: colors.primary,
    overflow: "hidden",
    marginHorizontal: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  button: {
    width: scale(310),
    height: scale(50),
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
    marginHorizontal: spacing.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  circle: {
    width: scale(60),
    height: scale(60),
    borderRadius: borderRadius.full,
    borderColor: "black",
    borderWidth: scale(2),
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  circle2: {
    width: scale(35),
    height: scale(35),
    borderRadius: borderRadius.full,
    borderColor: colors.primary,
    borderWidth: scale(2),
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  circle3: {
    width: scale(20),
    height: scale(20),
    borderRadius: borderRadius.full,
    borderWidth: scale(2),
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  cross: {
    fontSize: typography.hero.fontSize, lineHeight: typography.hero.lineHeight,
    color: "black",
  },
  spacing: {
    width: scale(30), // Desired spacing width between the circle and other items
  },
  divider: {
    alignSelf: "center",
    borderBottomColor: colors.textPrimary,
    borderBottomWidth: scale(2),
    marginVertical: spacing.xs,
    width: scale(330),
  },
  overlay: {
    position: "absolute",
    backgroundColor: colors.surface,
    width: scale(300),
    height: scale(200),
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    top: scale(250),
    borderRadius: borderRadius.lg,
  },
  modalContent: {
    marginHorizontal: spacing.xl,
  },
  modalTitle: {
    fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
    color: colors.textPrimary,
    fontWeight: "700",
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    letterSpacing: 0.5,
  },
  searchContainer: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
  },
  searchGradientBorder: {
    borderRadius: borderRadius.lg,
    padding: spacing.xs, // serves as border width
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  // No flex: the sheet is sized from what this measures, so it has to hug its
  // content rather than stretch to whatever height it was given.
  sheetContainerGlass: {
    paddingTop: spacing.sm,
  },
  capsuleHandleContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
  },
  capsuleHandle: {
    width: scale(40),
    height: scale(5),
    backgroundColor: colors.overlaySoft,
    borderRadius: borderRadius.md,
  },
  scheduledCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.xxl,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  scheduledIcon: {
    width: scale(38),
    height: scale(38),
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  scheduledTitle: { fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight, fontWeight: '700', color: colors.textPrimary },
  scheduledStatusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  scheduledDot: { width: scale(7), height: scale(7), borderRadius: borderRadius.sm, backgroundColor: colors.warning },
  scheduledDotClaimed: { backgroundColor: colors.success },
  scheduledStatus: { fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight, color: colors.textSecondary },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxs,
    paddingBottom: spacing.sm,
  },
  sectionHeaderTitle: {
    flex: 1,
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionHeaderLink: {
    alignSelf: 'stretch',
    textAlign: 'right',
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    fontWeight: '600',
    color: colors.primary,
  },
  floatingPillContainer: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    elevation: 10,
  },
  floatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    minHeight: sizes.control,
    paddingVertical: spacing.sm,
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
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    color: colors.textMuted,
  },
  pillArrow: {
    width: scale(34),
    height: scale(34),
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassSectionTitle: {
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
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
    borderRadius: borderRadius.xxl, // Super-ellipseish
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  squircleText: {
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  svgContainer: {
    // ...

    paddingHorizontal: spacing.sm,
  },
  glassHandleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  glassHandleIndicator: {
    width: scale(40),
    height: scale(5),
    backgroundColor: colors.overlaySoft,
    borderRadius: borderRadius.md,
  },
  searchText: {
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    minHeight: sizes.control,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    minHeight: sizes.control,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    color: colors.surface,
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    fontWeight: '600',
  },
});
export default MapScreen;
