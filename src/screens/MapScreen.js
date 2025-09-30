import React, { useEffect, memo, useMemo, useCallback } from "react";
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Circle, PROVIDER_GOOGLE } from "react-native-maps";
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

      if (models.driver && index === 0 && models.driverLocation) {
        
        const carColor = models.driver?.car?.color;
        const carIcon = getCarIconByColor(carColor);
        const heading = models?.driverLocation?.heading || "0";
 
        return (
          <Marker
            coordinate={{
              latitude: models.driverLocation.latitude,
              longitude: models.driverLocation.longitude,
            }}
            key={`driver-${models.driverLocation.latitude}-${models.driverLocation.longitude}-${heading}`}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <Image
              source={carIcon}
              style={{
                width: 50,
                height: 50,
                transform: [{ rotate: `${heading}deg` }],
              }}
              resizeMode="contain"
            />
          </Marker>
        );
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
            color={index === 0 ? "#0089FF" : "#FF005E"}
          />
        </Marker>
      );
    });
  }, [
    models.mapMarkers, 
    models.driver, 
    models.driverLocation, 
    models.tripState, 
    models.originCity, 
    models.destinationCity, 
    models.tripDuration,
    operations.formatDuration
  ]);

  // Memoized spots item renderer
  const renderSpotsItem = useCallback(({ item }) => {
    return item.place.name === "Adicionar Favorito" ? (
      <CardSpots
        title={item.place.name}
        description={item.place.description}
        onPress={operations.handleAddFavouriteButtonPress}
      />
    ) : (
      <CardSpots
        title={item.place.name}
        description={item.place.description}
        onPress={operations.handleOnFavouriteButtonPress(item)}
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
            radius={5000}
            strokeWidth={1}
            strokeColor="rgba(0, 0, 255, 0.5)"
            fillColor="rgba(0, 0, 255, 0.2)"
          />
        )}

        {memoizedMapMarkers}
        {models.isRouteVisible && (
          <MapViewDirections
            origin={
              models.driverLocation
                ? models.driverLocation
                : models.mapMarkers[0]
            }
            destination={models.mapMarkers[1]}
            apikey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}
            strokeColor="#0089FF"
            strokeWidth={scale(7)}
            onReady={operations.handleMapDirectionsReady}
            resetOnChange={false}
          />
        )}

        {memoizedCarsAround}
      </MapView>

 
      {models.isRouteVisible && !models.service ? (
        <TouchableOpacity style={styles.details} onPress={operations.handleBackButtonPress}>
          <Icon name="arrow-back" size={scale(30)} color="#0089FF" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.details} onPress={() => openDrawer()}>
          <Icon name="menu" size={scale(30)} color="#0089FF" />
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
            left: "50%",
            position: "absolute",
            top: "50%",
          }}
        >
          <Icon name="my-location" size={scale(30)} color="#0089FF" />

        </View>
      )}

      <BottomSheetModalProvider>

        <BottomSheetModal
          ref={models.bottomSheetModalRef}
          index={0}
          snapPoints={[scale(220)]}
          enableDynamicSizing={false}
          enablePanDownToClose={false}
        >
          <View style={styles.svgContainer}>
            <Icon name="my-location" size={scale(18)} color="#0089FF" />
            <TouchableOpacity
              style={{ marginLeft: scale(10) }}
              onPress={operations.handleMapSearchBarPress}
            >
              <Text style={{ fontSize: scale(15) }}>De onde vai partir?</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={models.favPlaces}
            renderItem={renderSpotsItem}
            keyExtractor={(item) => item._id.toString()}
            horizontal={true}
            contentContainerStyle={{ marginHorizontal: scale(15) }}
          />
        </BottomSheetModal>

        <BottomSheetModal
          ref={models.carTypeSelectionSheetRef}
          index={0}
          snapPoints={[scale(270)]}
          enablePanDownToClose={false}
          enableDynamicSizing={false}
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
          snapPoints={[scale(300), scale(550)]}
          enableDynamicSizing={false}
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
          snapPoints={[scale(270)]}
          enablePanDownToClose={false}
          enableDynamicSizing={false}
        >
          <PaymentOptions handleConfirmPaymentPress={operations.handleConfirmPaymentPress} models={models} />
        </BottomSheetModal>
        <BottomSheetModal
          ref={models.rideSearchSheetRef}
          index={0}
          snapPoints={[scale(270), scale(320)]}
          enablePanDownToClose={false}
          enableDynamicSizing={false}
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
          snapPoints={[scale(312), scale(435)]}
          enablePanDownToClose={false}
          enableDynamicSizing={false}
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
          snapPoints={[scale(320), scale(380)]}
          enablePanDownToClose={false}
          enableDynamicSizing={false}
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
          snapPoints={[scale(475)]}
          enableDynamicSizing={false}
        >
          {models.driver && models.service && (
            <DetailsItem
              destination={models.destinationCity}
              driver={models?.driver}
              clientCar={`${models.brand} | ${models.model} | ${models.color} | ${models.license}`}
              paymentMethod={models?.service?.payment?.method}
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
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {models.inputLocationObject === 0
                ? "DE ONDE VAI PARTIR?"
                : "PARA ONDE ESTÁ INDO?"}
            </Text>

            {/* Display selected address */}
            <View style={styles.searchContainer}>
              <Icon name="search" size={scale(20)} color="#ccc" />
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
                <Icon name="search" size={scale(18)} color="#0089ff" />
                <Text style={styles.secondaryButtonText}>
                  Buscar novamente
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
          service:models.service,
          driver:models.driver
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
  details: {
    width: scale(40),
    height: scale(40),
    position: "absolute",
    borderRadius: scale(7),
    backgroundColor: "#fff",
    top: scale(35),
    alignItems: "center",
    justifyContent: "center",
    left: scale(20),
    shadowColor: "#000",
    shadowOffset: { width: scale(2), height: scale(2) },
    shadowOpacity: 0.5,
    shadowRadius: 4,
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
    fontSize: scale(18),
    color: "#0089FF",
    fontWeight: "900",
    marginTop: scale(15),
    marginBottom: scale(25),
  },
  searchContainer: {
    borderRadius: scale(7),
    borderWidth: scale(3),
    borderColor: "#0089FF",
    fontSize: scale(18),
    padding: scale(8),
    marginBottom: scale(25),
    flexDirection: "row",
  },
  searchTextContainer: {
    paddingHorizontal: scale(10),
  },
  searchText: {
    fontSize: scale(16),
    color: "#808080",
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(10),
    marginTop: scale(10),
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(5),
    backgroundColor: '#fff',
    borderWidth: scale(2),
    borderColor: '#0089ff',
    borderRadius: scale(7),
    height: scale(40),
  },
  secondaryButtonText: {
    color: '#0089ff',
    fontSize: scale(14),
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(5),
    backgroundColor: "#0089ff",
    borderRadius: scale(7),
    height: scale(40),
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: scale(14),
    fontWeight: '600',
  },
});
export default MapScreen;
