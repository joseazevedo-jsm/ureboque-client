import React, { useEffect } from "react";
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Circle, PROVIDER_GOOGLE } from "react-native-maps";
import { LocationPermissionsService } from "../services/LocationPermissionsService";
import { useMapScreen } from "../components/map/useMapScreen";
import Icon from "react-native-vector-icons/MaterialIcons";
import { scale } from "react-native-size-matters";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
} from "@gorhom/bottom-sheet";
import { Platform } from "react-native";
import { useMemo } from "react";
import CardSpots from "../components/cards/cardSpots";
import DestinationModal from "../components/modals/Destination/DestinationModal";
import { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { FlatList } from "react-native-gesture-handler";
import CarTypes from "../components/cards/carTypes";
import SavedPlacesModal from "../components/modals/SavedPlaces/SavedPlacesModal";
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

const MapScreen = () => {
  const { models, operations } = useMapScreen();

  const snapPoints = useMemo(
    () => [scale(220), scale(250), scale(260), scale(520)],
    []
  );
  const renderMapMarker = () => {
    return models.mapMarkers.map((item, index) => {
      if (models.driver && index === 0 && models.driverLocation) {
        return (
          <Marker.Animated
            ref={models.markerAnimated}
            coordinate={{
              latitude: models.driverLocation.latitude,
              longitude: models.driverLocation.longitude,
            }}
            key={`${models.driverLocation.latitude}-${models.driverLocation.longitude}`}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <Image
              source={require("../../resources/icons/UREB_TOPVIEW.png")}
              style={{
                width: 50,
                height: 50,
                transform: [
                  {
                    rotate: `${
                      models?.driverLocation?.heading
                        ? models?.driverLocation?.heading
                        : "0"
                    }deg`,
                  },
                ],
              }}
              resizeMode="contain"
            />
          </Marker.Animated>
        );
      }

      return (
        <Marker.Animated coordinate={item} key={index}>
          <CustomMarker
            title={index === 0 ? models.originCity : models.destinationCity}
            time={
              index === 0
                ? models.tripDuration
                  ? operations.formatDuration(models.tripDuration)
                  : 0
                : null
            }
            color={index === 0 ? "#0089FF" : "#FF005E"}
          />
        </Marker.Animated>
      );
    });
  };

  const renderSpotsItem = ({ item }) => {
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
  };

  const renderCarTypesItem = ({ item }) => {
    if (models.mapDirections && models.prices) {
      const priceperkm =
        Math.floor(models.mapDirections.distance) * 1000 + Number(item.price);
      console.log("ORIGINAL PRICE: ", priceperkm);

      const price =
        models.user.discount && models.user.discount.active
          ? priceperkm - priceperkm * (models.user.discount.percentage / 100)
          : priceperkm;

      return (
        <CarTypes
          typeCar={item.typeCar}
          descr={item.descr}
          descr2={item.descr2}
          price={price}
          route={models.mapDirections}
          onPress={operations.handleTypeCarPress(item.typeCar, price)}
        />
      );
    }
  };

  const navigation = useNavigation();

  const openDrawer = () => {
    navigation.openDrawer();
  };

  if (!models.user) return null;

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        ref={models.mapRef}
        showsUserLocation
        onUserLocationChange={operations.handleUserLocationChange}
        showsMyLocationButton={false}
        onRegionChangeComplete={operations.handleMarkerDragEnd}
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

        {renderMapMarker()}
        {models.isRouteVisible && (
          <MapViewDirections
            origin={
              models.driverLocation
                ? models.driverLocation
                : models.mapMarkers[0]
            }
            destination={models.mapMarkers[1]}
            apikey="AIzaSyBqPFzMJ7TgohKLMZ8Q0Z1iRVmk63OWWpk"
            strokeColor="#0089FF"
            strokeWidth={scale(7)}
            onReady={operations.handleMapDirectionsReady}
            resetOnChange={false}
          />
        )}

        {!models?.service &&
          models.carsAround.map((item, index) => (
            <Marker coordinate={item} key={index.toString()}>
              <Image
                source={require("../../resources/icons/UREB_TOPVIEW.png")}
                style={{
                  width: 50,
                  height: 50,
                  transform: [{ rotate: "-90deg" }],
                }}
                resizeMode="contain"
              />
            </Marker>
          ))}
      </MapView>

      <LocationPermissionsService />

      <TouchableOpacity style={styles.details} onPress={() => openDrawer()}>
        <Icon name="menu" size={scale(30)} color="#0089FF" />
      </TouchableOpacity>

      {models.isRouteVisible && !models.service && (
        <TouchableOpacity onPress={operations.handleBackButtonPress}>
          <View style={styles.back}>
            <Icon name="arrow-back" size={scale(30)} color="#0089FF" />
          </View>
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
          {models.markerCity && (
            <Text style={{ fontSize: scale(15), color: "red" }}>
              {models.markerCity}
            </Text>
          )}
        </View>
      )}

      <BottomSheetModalProvider>

        <BottomSheetModal
          ref={models.bottomSheetModalRef}
          index={0}
          snapPoints={[scale(220)]}
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
          snapPoints={[scale(260)]}
          enablePanDownToClose={false}
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
          snapPoints={[scale(260), scale(300)]}
          keyboardBehavior="interactive"
          android_keyboardInputMode="adjustResize"
          enablePanDownToClose={false}
          enableDismissOnClose={false}
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
          index={1}
          snapPoints={snapPoints}
          enablePanDownToClose={false}
        >
          <PaymentOptions operations={operations}  models={models}/>
        </BottomSheetModal>
        <BottomSheetModal
          ref={models.rideSearchSheetRef}
          index={0}
          snapPoints={[scale(235), scale(300)]}
          onChange={operations.handleBottomSheetSearchExtended}
          enablePanDownToClose={false}
        >
          <DriverSearch
            destination={models.destinationCity}
            origin={models.originCity}
            timer={models.timer}
            formatTime={operations.formatTime}
            accepted={models.driverConnected}
          />
        </BottomSheetModal>

        <BottomSheetModal
          ref={models.tripStartedSheetRef}
          index={0}
          snapPoints={[scale(312), scale(435)]}
          enablePanDownToClose={false}
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
            bttmSheetRef={models.tripStartedSheetRef}
          />
        </BottomSheetModal>

        <BottomSheetModal
          ref={models.driverArrivingSheetRef}
          index={0}
          snapPoints={[scale(310), scale(425)]}
          enablePanDownToClose={false}
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
            bttmSheetRef={models.driverArrivingSheetRef}
          />
        </BottomSheetModal>

        <BottomSheetModal
          ref={models.tripEndingSheetRef}
          index={0}
          snapPoints={[scale(320), scale(380)]}
          enablePanDownToClose={false}
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
            bttmSheetRef={models.driverArrivingSheetRef}
          />
        </BottomSheetModal>

        <BottomSheetModal
          ref={models.bottomSheetModalRefDetails}
          index={0}
          snapPoints={[scale(475)]}
        >
          {models.driver && models.service && (
            <DetailsItem
              destination={models.destinationCity}
              driver={models?.driver}
              clientCar={`${models.brand} | ${models.model} | ${models.color} | ${models.license}`}
              paymentMethod={models?.service?.payment?.method}
            />
          )}
        </BottomSheetModal>

        <BottomSheetModal
          ref={models.bottomSheetModalDragMarker}
          index={0}
          snapPoints={snapPoints}
          enablePanDownToClose={false}
        >
            <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {models.inputLocationObject === 0
              ? "DE ONDE VAI PARTIR?"
              : "PARA ONDE ESTÁ INDO?"}
          </Text>
          <View style={styles.searchContainer}>
            <Icon name="search" size={scale(20)} color="#ccc" />
            <TouchableOpacity style={styles.searchTextContainer}>
              <Text style={styles.searchText}>
                {models.markerCity}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={operations.handleConfirmDraggablePress}
          >
            <Text style={styles.confirmButtonText}>
              Confirmar
            </Text>
          </TouchableOpacity>
        </View>
        </BottomSheetModal>

      </BottomSheetModalProvider>

      <DestinationModal
        visible={models.modalVisible}
        closeModal={operations.closeDestinationModal}
        onPlaceItemPress={operations.handlePressItemPress}
        onMarkerDragPress={operations.handleMarkerDragPress()}
        onLocationTextInputFocus={operations.handleLocationTextInputFocus}
        origin={models.originCity}
        destination={models.destinationCity}
        inputCurr={models.isCurrLocation}
      />

      <SavedPlacesModal
        visible={models.modalSavedPlacesVisible}
        closeModal={operations.closeSavedPlacesModal}
        addressCallBack={models.newSavedPlaceAddress}
        mapDrag={operations.handleMarkerDragSavedPlaces}
      />

      <ChatModal
        visible={models.modalChatVisible}
        closeModal={operations.closeChatModel}
        idService={models.service?._id}
        driver={models?.driver}
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
        service={models.service}
      />
    </View>
  );
};

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
  back: {
    width: scale(30),
    borderRadius: scale(45 / 2),
    backgroundColor: "#fff",
    bottom: scale(260),
    alignItems: "center",
    justifyContent: "center",
    left: scale(20),
    shadowColor: "#000",
    shadowOffset: { width: scale(2), height: scale(2) },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },

  backDetails: {
    width: scale(30),
    borderRadius: scale(45 / 2),
    backgroundColor: "#fff",
    bottom: scale(530),
    alignItems: "center",
    justifyContent: "center",
    left: scale(20),
    shadowColor: "#000",
    shadowOffset: { width: scale(2), height: scale(2) },
    shadowOpacity: 0.5,
    shadowRadius: 4,
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
  confirmButton: {
    backgroundColor: "#0089ff",
    borderRadius: scale(7),
    height: scale(40),
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: scale(18),
  },
});
export default MapScreen;
