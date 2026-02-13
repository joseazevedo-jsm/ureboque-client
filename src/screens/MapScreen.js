import React, { useEffect, memo, useMemo, useCallback } from "react";
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Circle, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";
import { ScalePressable } from "../components/common/ScalePressable";
import { BlurView } from "expo-blur";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { useMapScreen } from "../components/map/useMapScreen";
import Icon from "react-native-vector-icons/MaterialIcons";
import { scale } from "react-native-size-matters";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { Platform } from "react-native";
import CardSpots from "../components/cards/cardSpots";
import DestinationModal from "../components/modals/Destination/DestinationModal";
import { Marker } from "react-native-maps";
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

// Memoized car icon mapping for performance
const carIconMap = {
  'BLACK': require("../../resources/icons/car/UREB_TOPVIEW_BLACK.png"),
  'WHITE': require("../../resources/icons/car/UREB_TOPVIEW_WHITE.png"),
  'BLUE': require("../../resources/icons/car/UREB_TOPVIEW_BLUE.png"),
  'GREEN': require("../../resources/icons/car/UREB_TOPVIEW_GREEN.png"),
  'YELLOW': require("../../resources/icons/car/UREB_TOPVIEW_YELLOW.png"),
};

const defaultIcon = require("../../resources/icons/car/UREB_TOPVIEW_BLACK.png");

const getCarIconByColor = (color) => {
  try {
    return carIconMap[color?.toUpperCase()] || defaultIcon;
  } catch (error) {
    return defaultIcon;
  }
};

// --- Reusable Glass Components ---
const GlassBackground = ({ style }) => (
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
);

const GlassHandle = () => (
  <View style={styles.glassHandleContainer}>
    <View style={styles.glassHandleIndicator} />
  </View>
);

const MapScreen = memo(() => {
  const logger = useLogger('MapScreen');
  const { models, operations } = useMapScreen();

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
            color={index === 0 ? "#0089FF" : "#FF005E"}
          />
        </Marker>
      );
    });
  }, [
    models.mapMarkers,
    models.tripState,
    models.originCity,
    models.destinationCity,
    models.tripDuration,
    operations.formatDuration
  ]);

  // Separate component for the driver to isolate high-frequency updates
  const MemoizedDriverMarker = useMemo(() => {
    if (!models.driver || !models.driverLocation) return null;

    return (
      <Marker
        coordinate={{
          latitude: models.driverLocation.latitude,
          longitude: models.driverLocation.longitude,
        }}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <Image
          source={getCarIconByColor(models.driver?.car?.color)}
          style={{
            width: scale(50),
            height: scale(50),
            transform: [{ rotate: `${models?.driverLocation?.heading || "0"}deg` }],
          }}
          resizeMode="contain"
        />
      </Marker>
    );
  }, [models.driver, models.driverLocation?.latitude, models.driverLocation?.longitude, models.driverLocation?.heading]);

  // Memoized spots item renderer
  const renderSpotsItem = useCallback(({ item, index }) => {
    const isAddFavorite = item.place.name === "Adicionar Favorito";
    return (
      <CardSpots
        title={item.place.name}
        description={item.place.description}
        onPress={isAddFavorite
          ? operations.handleAddFavouriteButtonPress
          : operations.handleOnFavouriteButtonPress(item)}
        index={index}
        isAddFavorite={isAddFavorite}
      />
    );
  }, [operations.handleAddFavouriteButtonPress, operations.handleOnFavouriteButtonPress]);

  // Memoized car types item renderer
  const renderCarTypesItem = useCallback(({ item }) => {
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
  }, [models.mapDirections, models.prices, models.user?.discount || {}, operations.handleTypeCarPress]);

  // Memoized cars around markers for performance
  const memoizedCarsAround = useMemo(() => {
    if (models?.service) return null;

    return models.carsAround.map((item, index) => (
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

  const openDrawer = () => {
    navigation.openDrawer();
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        ref={models.mapRef}
        showsUserLocation
        onUserLocationChange={operations.handleUserLocationChange}
        showsMyLocationButton={false}
        onRegionChangeComplete={operations.handleDragMarkerPositionChange}
        toolbarEnabled={false}
        customMapStyle={customStyleMap}
        style={styles.map}
      >
        {models?.userLocation && (
          <Circle
            center={models?.userLocation}
            radius={50}
            strokeWidth={1}
            strokeColor="rgba(0, 0, 255, 0.5)"
            fillColor="rgba(0, 0, 255, 0.2)"
          />
        )}

        {memoizedMapMarkers}

        {MemoizedDriverMarker}

        {models.isRouteVisible && (
          <>
            <MapViewDirections
              origin={models.mapMarkers[0]}
              destination={models.mapMarkers[1]}
              apikey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}
              strokeWidth={0} // Invisible: we only use it for calculation logic
              onReady={operations.handleMapDirectionsReady}
              resetOnChange={false}
            />
            {models.currentRoute && models.currentRoute.length > 0 && (
              <Polyline
                coordinates={models.currentRoute}
                strokeColor="#0089FF"
                strokeWidth={scale(7)}
                lineJoin="round"
                lineCap="round"
                tappable={false}
              />
            )}
          </>
        )}

        {memoizedCarsAround}
      </MapView>


      {models.isRouteVisible && !models.service ? (
        <TouchableOpacity style={styles.details} onPress={operations.handleBackButtonPress}>
          <Icon name="arrow-back" size={scale(30)} color="#0089FF" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.menuGlassButton}
          onPress={() => openDrawer()}
          activeOpacity={0.8}
        >
          <BlurView
            intensity={90}
            tint="systemMaterialLight"
            style={StyleSheet.absoluteFill}
          />
          <Icon name="menu" size={scale(24)} color="#1E293B" />
        </TouchableOpacity>
      )}


      {models.detailsInfo && (
        <TouchableOpacity onPress={operations.handleBackDetailsButtonPress}>
          <View style={styles.backDetails}>
            <Icon name="arrow-back" size={scale(30)} color="#0089FF" />
          </View>
        </TouchableOpacity>
      )}

      {models.markerVisible && (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: "50%",
            justifyContent: "flex-end",
            alignItems: "center",
            zIndex: 100,
          }}
          pointerEvents="none"
        >
          <CustomMarker
            title={models.markerCity || "Carregando..."}
            color={models.inputLocationObject === 0 ? "#0089FF" : "#FF005E"}
          />
        </View>
      )}

      {models.isRouteVisible && (
        <TouchableOpacity
          style={styles.recenterButton}
          onPress={operations.handleRecenterMap}
        >
          <Icon name="my-location" size={scale(24)} color="#0089FF" />
        </TouchableOpacity>
      )}

      <BottomSheetModalProvider>

        <BottomSheetModal
          ref={models.bottomSheetModalRef}
          index={0}
          snapPoints={[scale(280)]}
          enableDynamicSizing={false}
          enablePanDownToClose={false}
          stackBehavior="replace"
          keyboardBehavior="interactive"
          android_keyboardInputMode="adjustResize"
          backgroundStyle={{ backgroundColor: 'rgba(255,255,255,0.0)' }}
          backgroundComponent={GlassBackground}
          handleComponent={GlassHandle}
        >
          <View style={styles.sheetContainerGlass}>
            {/* Handle is now external */}

            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <ScalePressable
                onPress={operations.handleMapSearchBarPress}
                style={styles.floatingPillContainer}
              >
                <LinearGradient
                  colors={['#FFFFFF', '#F0F9FF']}
                  style={styles.floatingPill}
                >
                  <View style={styles.pillIconBubble}>
                    <Icon name="search" size={scale(20)} color="#0089FF" />
                  </View>
                  <Text style={styles.pillPlaceholder}>Para onde vamos?</Text>
                  <View style={styles.pillAction}>
                    <Icon name="arrow-forward" size={scale(16)} color="#94A3B8" />
                  </View>
                </LinearGradient>
              </ScalePressable>
            </Animated.View>

            <View style={styles.placesContainer}>
              <Text style={styles.glassSectionTitle}>Seus Lugares</Text>
              <FlatList
                data={models.favPlaces}
                renderItem={renderSpotsItem}
                keyExtractor={(item) => item._id.toString()}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: scale(20), paddingVertical: scale(10) }}
              />
            </View>
          </View>
        </BottomSheetModal>

        <BottomSheetModal
          ref={models.carTypeSelectionSheetRef}
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
          <Text
            style={{
              fontSize: scale(18),
              alignSelf: "center",
              color: "#0089FF",
              fontWeight: "900",
              marginBottom: scale(10),
            }}
          >
            SELECIONE O TIPO DE CARRO
          </Text>
          <FlatList
            data={models.prices}
            renderItem={renderCarTypesItem}
            keyExtractor={(item) => item._id.toString()}
          />
        </BottomSheetModal>

        <BottomSheetModal
          ref={models.userCarInfoSheetRef}
          index={0}
          snapPoints={[scale(320), scale(550)]}
          enableDynamicSizing={false}
          enablePanDownToClose={false}
          stackBehavior="replace"
          keyboardBehavior="interactive"
          android_keyboardInputMode="adjustResize"
          backgroundStyle={{ backgroundColor: 'transparent' }}
          backgroundComponent={GlassBackground}
          handleComponent={GlassHandle}
        >
          <UserCarInfo
            handleBrandInputValueChange={operations.handleBrandInputValueChange}
            handleColorInputValueChange={operations.handleColorInputValueChange}
            handleLicenseInputValueChange={
              operations.handleLicenseInputValueChange
            }
            handleModelInputValueChange={operations.handleModelInputValueChange}
            handleConfirmButtonPress={operations.handleConfirmButtonPress}
          />
        </BottomSheetModal>

        <BottomSheetModal
          ref={models.paymentOptionsSheetRef}
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
          <PaymentOptions handleConfirmPaymentPress={operations.handleConfirmPaymentPress} models={models} />
        </BottomSheetModal>
        <BottomSheetModal
          ref={models.rideSearchSheetRef}
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
          <DriverSearch
            destination={models.destinationCity}
            origin={models.originCity}
            timer={models.timer}
            formatTime={operations.formatTime}
            accepted={models.driverConnected}
            onCancelSearch={operations.handleCancelSearch}
            calculateProgress={operations.calculateProgress}
          />
        </BottomSheetModal>

        <BottomSheetModal
          ref={models.tripStartedSheetRef}
          index={0}
          snapPoints={[scale(310), scale(450)]}
          enablePanDownToClose={false}
          enableDynamicSizing={false}
          stackBehavior="replace"
          keyboardBehavior="interactive"
          android_keyboardInputMode="adjustResize"
          backgroundStyle={{ backgroundColor: 'transparent' }}
          backgroundComponent={GlassBackground}
          handleComponent={GlassHandle}
        >
          <DriverStatus
            status={0}
            driver={models?.driver}
            origin={models.originCity}
            destination={models.destinationCity}
            tripDuration={models.tripDuration}
            onCancelTrip={operations.handlePreCancelButtonPress}
            onDetailsTrip={operations.handleDetailsForm}
            onMessageDriver={operations.handleMessageDriver}
            onCallDriver={operations.handleCallDriver}
            bttmSheetRef={models.tripStartedSheetRef}
            unreadMessageCount={models.unreadMessageCount}
          />
        </BottomSheetModal>

        <BottomSheetModal
          ref={models.driverArrivingSheetRef}
          index={0}
          snapPoints={[scale(310), scale(425)]}
          enablePanDownToClose={false}
          enableDynamicSizing={false}
          stackBehavior="replace"
          keyboardBehavior="interactive"
          android_keyboardInputMode="adjustResize"
          backgroundStyle={{ backgroundColor: 'transparent' }}
          backgroundComponent={GlassBackground}
          handleComponent={GlassHandle}
        >
          <DriverStatus
            status={1}
            driver={models?.driver}
            origin={models.originCity}
            destination={models.destinationCity}
            tripDuration={models.tripDuration}
            onCancelTrip={operations.handleCancelTrip}
            onDetailsTrip={operations.handleDetailsForm}
            onMessageDriver={operations.handleMessageDriver}
            onCallDriver={operations.handleCallDriver}
            bttmSheetRef={models.driverArrivingSheetRef}
            unreadMessageCount={models.unreadMessageCount}
          />
        </BottomSheetModal>

        <BottomSheetModal
          ref={models.tripEndingSheetRef}
          index={0}
          snapPoints={[scale(310), scale(380)]}
          enablePanDownToClose={false}
          enableDynamicSizing={false}
          stackBehavior="replace"
          keyboardBehavior="interactive"
          android_keyboardInputMode="adjustResize"
          backgroundStyle={{ backgroundColor: 'transparent' }}
          backgroundComponent={GlassBackground}
          handleComponent={GlassHandle}
        >
          <DriverStatus
            status={2}
            driver={models?.driver}
            origin={models.originCity}
            destination={models.destinationCity}
            tripDuration={models.tripDuration}
            onCancelTrip={operations.handleCancelTrip}
            onDetailsTrip={operations.handleDetailsForm}
            onMessageDriver={operations.handleMessageDriver}
            onCallDriver={operations.handleCallDriver}
            bttmSheetRef={models.driverArrivingSheetRef}
            unreadMessageCount={models.unreadMessageCount}
          />
        </BottomSheetModal>

        <BottomSheetModal
          ref={models.bottomSheetModalRefDetails}
          index={0}
          snapPoints={[scale(520)]}
          enableDynamicSizing={false}
          stackBehavior="replace"
          keyboardBehavior="interactive"
          android_keyboardInputMode="adjustResize"
          backgroundStyle={{ backgroundColor: 'transparent' }}
          backgroundComponent={GlassBackground}
          handleComponent={GlassHandle}
        >
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
            />
          )}
        </BottomSheetModal>

        <BottomSheetModal
          ref={models.bottomSheetModalDragMarker}
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
                <Icon name="search" size={scale(18)} color="#64748B" />
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
        </BottomSheetModal>

      </BottomSheetModalProvider>

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
      />

      {/* NEW: Simplified saved addresses system - no complex state management */}
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
          driver: models.driver
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  menuGlassButton: {
    width: scale(48),
    height: scale(48),
    position: "absolute",
    borderRadius: scale(24),
    top: scale(44), // Adjusted for safe area
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
  recenterButton: {
    position: 'absolute',
    bottom: scale(330),
    right: scale(20),
    width: scale(40),
    height: scale(40),
    borderRadius: scale(15),
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: scale(2), height: scale(2) },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  svgContainer: {
    width: scale(318),
    height: scale(50),
    borderRadius: scale(7),
    borderWidth: scale(4),
    borderColor: "#0089ff",
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: scale(15),
    paddingHorizontal: scale(16),
    marginVertical: scale(10),
  },
  backDetails: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: scale(2), height: scale(2) },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
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
    borderColor: "#0089ff",
    overflow: "hidden",
    marginHorizontal: scale(10),
    paddingHorizontal: scale(10),
  },
  button: {
    width: scale(310),
    height: scale(50),
    borderRadius: scale(7),
    backgroundColor: "#0089ff",
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
    borderColor: "#0089ff",
    borderWidth: scale(2),
    backgroundColor: "#0089ff",
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
    color: "#1E293B",
    fontWeight: "800",
    marginTop: scale(15),
    marginBottom: scale(20),
    letterSpacing: 0.5,
  },
  searchContainer: {
    borderRadius: scale(16),
    backgroundColor: "#F8FAFC",
    padding: scale(16),
    marginBottom: scale(20),
    flexDirection: "row",
    alignItems: "center",
  },
  searchGradientBorder: {
    borderRadius: scale(16),
    padding: scale(2), // serves as border width
    elevation: 4,
    shadowColor: "#0089FF",
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
  floatingPillContainer: {
    marginHorizontal: scale(24), // Wider margins for "floating" look
    marginBottom: scale(28),
    shadowColor: "#0089FF",
    shadowOffset: { width: 0, height: 4 }, // Softer shadow
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8
  },
  floatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: scale(20),
    paddingVertical: scale(16),
    paddingHorizontal: scale(20),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  pillIconBubble: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: '#F0F9FF', // Light Blue
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(16),
  },
  pillPlaceholder: {
    flex: 1,
    fontSize: scale(16),
    fontWeight: '600',
    color: '#334155', // Slate 700
    letterSpacing: 0.3,
  },
  pillAction: {
    backgroundColor: '#F1F5F9',
    borderRadius: scale(12),
    padding: scale(8),
  },
  placesContainer: {
    marginTop: scale(10),
  },
  glassSectionTitle: {
    fontSize: scale(14),
    fontWeight: '700',
    color: '#64748B', // Slate 500
    marginBottom: scale(16),
    marginHorizontal: scale(24),
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
    color: "#1E293B",
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
    backgroundColor: "#0089FF",
    borderRadius: scale(14),
    height: scale(48),
    shadowColor: "#0089FF",
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
