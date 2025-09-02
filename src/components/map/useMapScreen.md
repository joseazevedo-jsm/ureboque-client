# useMapScreen Hook Documentation

## Overview
The `useMapScreen` hook is the main controller for the map screen functionality in the Ureboque ride-hailing application. It manages map interactions, nearby driver searches, trip booking flow, and real-time communication with drivers.

## Key Features
- **Map Management**: User location tracking, markers, directions
- **Nearby Drivers**: Automatic polling and display of available drivers
- **Trip Booking Flow**: Multi-step process from destination selection to payment
- **Real-time Communication**: Socket.io integration for driver matching and trip updates
- **Bottom Sheet Management**: Coordinated UI state management

## State Management

### Map & Location States
```javascript
const [mapMarkers, setMapMarkers] = useState([]);           // Origin and destination markers
const [mapDirections, setMapDirections] = useState(null);   // Route directions
const [userLocation, setUserLocation] = useState(null);    // Current user position
const [originCoords, setOriginCoords] = useState(null);    // Trip origin coordinates
const [destinationCoords, setDestinationCoords] = useState(null); // Trip destination
```

### Driver & Service States
```javascript
const [carsAround, setCarsAround] = useState([]);          // Nearby drivers array
const [isLoadingDrivers, setIsLoadingDrivers] = useState(false); // Driver search loading
const [service, setService] = useState(null);             // Active service/trip
const [driver, setDriver] = useState(null);               // Assigned driver info
const [tripState, setTripState] = useState(null);         // Trip status: 'assigned', 'in-progress'
```

### UI States
```javascript
const [modalVisible, setModalVisible] = useState(false);   // Destination selection modal
const [activeBottomSheet, setActiveBottomSheet] = useState(null); // Current bottom sheet
// Multiple bottom sheet refs for different trip stages
```

## Core Functions

### Nearby Drivers System
```javascript
const getNearbyDrivers = async () => {
  if (isLoadingDrivers || service) return;
  
  setIsLoadingDrivers(true);
  try {
    const params = {
      latitude: userLocation?.latitude,
      longitude: userLocation?.longitude,
      maxDistance: 5000,
    };
    const resp = await api.get("/drivers/nearby", { params });
    const nearbyDrivers = resp.data.map(/* transform data */);
    setCarsAround(nearbyDrivers);
  } catch (error) {
    ErrorService.handleAPIError(error);
  } finally {
    setIsLoadingDrivers(false);
  }
};
```

**Automatic Polling Logic:**
- Polls every 20 seconds when no active service
- Stops when service becomes active
- Automatically resumes when service ends
- Prevents duplicate requests with loading state

### Trip Booking Flow
1. **Destination Selection**: User picks origin and destination
2. **Car Type Selection**: Choose vehicle type and view pricing
3. **Vehicle Details**: Enter user's car information
4. **Payment Options**: Select payment method
5. **Driver Search**: Find and match with nearby drivers
6. **Trip Execution**: Real-time tracking and updates

### Socket Event Handlers
```javascript
const handleSocketEvents = () => {
  socket.on("bestDriver", handleBestDriver);
  socket.on("driverConnected", handleDriverConnected);
  socket.on("driverLocation", handleDriverLocation);
  socket.on("serviceAccepted", handleServiceAccepted);
  socket.on("serviceStarted", handleServiceStarted);
  socket.on("serviceEnded", handleServiceEnded);
  socket.on("serviceCancelled", handleServiceCancelled);
  socket.on("noDriver", handleNoDriver);
};
```

## useEffect Hooks

### 1. Map Centering
```javascript
useEffect(() => {
  centerToUserLocation();
}, [centerToUserLocation]);
```

### 2. Nearby Drivers Polling
```javascript
useEffect(() => {
  if (!userLocation || service) {
    setCarsAround([]); // Clear cars when service is active
    return;
  }

  getNearbyDrivers(); // Initial fetch
  pollingTimerRef.current = setInterval(getNearbyDrivers, 20000);

  return () => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  };
}, [userLocation, service]);
```

### 3. Socket Events Management
```javascript
useEffect(() => {
  const cleanup = handleSocketEvents();
  return cleanup;
}, [socket, user]);
```

### 4. Service Status Updates
Handles service state changes from server and updates UI accordingly.

### 5. Timer Management
Manages countdown timer for driver search timeout.

## Bottom Sheet Management

### Available Bottom Sheets
- `bottomSheetModalRef`: Initial destination selection
- `carTypeSelectionSheetRef`: Vehicle type selection
- `userCarInfoSheetRef`: User vehicle details input
- `paymentOptionsSheetRef`: Payment method selection
- `rideSearchSheetRef`: Driver search progress
- `tripStartedSheetRef`: Trip assigned state
- `driverArrivingSheetRef`: Driver approaching
- `tripEndingSheetRef`: Trip in progress

### State Tracking
```javascript
const [activeBottomSheet, setActiveBottomSheet] = useState(null);
```

## Key Handler Functions

### Location Handling
- `handleUserLocationChange`: Updates user location from map
- `handleMapSearchBarPress`: Opens destination selection
- `handleMarkerDragEnd`: Handles draggable marker updates

### Trip Flow Handlers
- `handleTypeCarPress`: Car type selection
- `handleConfirmPaymentPress`: Initiates trip request
- `handleCancelSearch`: Cancels ongoing search
- `handleCancelTrip`: Cancels active trip

### Driver Communication
- `handleMessageDriver`: Opens chat with driver
- `handleDriverLocation`: Updates driver position in real-time

## Error Handling
- Uses `ErrorService.handleAPIError()` for consistent error handling
- Socket connection checks before emitting events
- Graceful degradation when services are unavailable

## Memory Management
- Proper cleanup of intervals and timeouts
- Socket event listener cleanup
- Ref management for animations and timers

## Constants
```javascript
const LATITUDE_DELTA = 0.0022;
const LONGITUDE_DELTA = 0.005;
const DEFAULT_TIMER_DURATION = 180; // 3 minutes
```

## Return Value
Returns an object with two main sections:
- `models`: All state variables and refs
- `operations`: All handler functions and operations

## Usage Example
```javascript
import { useMapScreen } from './components/map/useMapScreen';

const MapScreen = () => {
  const { models, operations } = useMapScreen();
  
  return (
    <View>
      <MapView ref={models.mapRef}>
        {/* Map components */}
      </MapView>
      {/* UI components using models and operations */}
    </View>
  );
};
```

## Recent Improvements
- **Fixed Nearby Drivers Polling**: Replaced manual setTimeout chain with setInterval for reliable continuous polling
- **Better State Management**: Clearer separation between loading and search states  
- **Automatic Restart**: Nearby driver search automatically resumes after trip completion
- **Memory Leak Prevention**: Proper cleanup of intervals and timers