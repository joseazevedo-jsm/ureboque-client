import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
// Remove socket.io import as it's now handled in middleware
// import { io } from 'socket.io-client';

const IP = process.env.EXPO_PUBLIC_UREBOQUE_API;
// Remove the immediate socket initialization
// const socketID = io(`${IP}`);

const api = axios.create({
  baseURL: IP,
});
 

// Async thunks
export const fetchUserById = createAsyncThunk(
  'user/fetchUserById',
  async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async ({ userId, userData }) => {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data.user;
  }
);

export const saveUserFavoriteAddress = createAsyncThunk(
  'user/saveFavoriteAddress',
  async ({ userId, place }, { getState, rejectWithValue, dispatch }) => {
    try {
      // Simple check for duplicate places - this is all we really need
      const { user } = getState().user;
      if (!user) {
        console.error('Error: user is not defined in state');
        return rejectWithValue('User not found in state');
      }
      
      if (place._id && user?.saved_places) {
        const existingPlace = user.saved_places.find(p => p._id === place._id);
        if (existingPlace) {
          return user.saved_places;
        }
      }
      
      // Store the place data in memory before API call so we can use it later
      const placeToSave = place.place ? place : { place: place };
      
      // Make the API call - ensure we send the correct structure to the API
      // Check if place has a nested place property and use the appropriate structure
      const placeData = place.place ? {
        _id: place._id,
        ...place.place
      } : place;
      
      // The API expects place to be wrapped in a 'place' object according to the schema:
      // saved_places: [{ place: { name, coordinates, description, instructions } }]
      const apiPayload = {
        place: placeData.coordinates ? {
          name: placeData.name || 'New Place',
          description: placeData.description || 'No description',
          coordinates: placeData.coordinates,
          instructions: placeData.instructions || ''
        } : placeData
      };
      
      const response = await api.put(`/users/${userId}/places`, apiPayload);
      
      // Add additional safety checks for the response
      if (!response.data || !response.data.saved_places) {
        console.error('Invalid server response format:', response.data);
        return rejectWithValue('Invalid server response format');
      }
      
      // Since the API only returns place IDs, we need to merge these IDs with our local place data
      // Extract the newly added place ID from the response
      const savedPlaces = response.data.saved_places;
      if (savedPlaces.length > 0 && savedPlaces[0]._id && !savedPlaces[0].place) {
        // Find the new ID (usually the last one added)
        const newPlaceId = savedPlaces[savedPlaces.length - 1]._id;
        
        // Create an enhanced savedPlaces array with the complete place data
        const enhancedSavedPlaces = savedPlaces.map(placeItem => {
          // For the newly added place, use our local copy of the place data
          if (placeItem._id === newPlaceId) {
            return {
              _id: newPlaceId,
              place: placeToSave.place || {
                name: placeData.name || "New Place",
                description: placeData.description || "No description",
                coordinates: placeData.coordinates || { latitude: 0, longitude: 0 },
                instructions: placeData.instructions || ""
              }
            };
          }
          
          // For existing places, try to find them in the current state
          const existingPlace = user.saved_places?.find(p => p._id === placeItem._id);
          if (existingPlace) {
            return existingPlace;
          }
          
          // Fallback for unknown places
          return {
            _id: placeItem._id,
            place: {
              name: "Loading...",
              description: "Loading...",
              coordinates: { latitude: 0, longitude: 0 }
            }
          };
        });
        
        // Also schedule a refresh to get the complete data from server
        setTimeout(() => {
          dispatch(fetchUserById(userId));
        }, 1000);
        
        return enhancedSavedPlaces;
      }
      
      return savedPlaces;
    } catch (error) {
      console.error('Error saving favorite address:', error);
      return rejectWithValue(error.response?.data || error.message || 'Unknown error saving address');
    }
  }
);

export const removeUserFavoriteAddress = createAsyncThunk(
  'user/removeFavoriteAddress',
  async ({ userId, placeId }) => {
    const response = await api.delete(`/users/${userId}/places/${placeId}`);
    return response.data.saved_places;
  }
);

export const updateUserFavoriteAddress = createAsyncThunk(
  'user/updateFavoriteAddress',
  async ({ userId, place, placeId }) => {
    // Ensure place has the correct structure for the API
    const apiPayload = {
      place: place.place ? place.place : place
    };
    
    const response = await api.put(`/users/${userId}/places/${placeId}`, apiPayload);
    return response.data.saved_places;
  }
);

export const activateDiscountCode = createAsyncThunk(
  'user/activateDiscount',
  async ({ userId, code }) => {
    const response = await api.post(`/promotions/${code}/activate/${userId}`);
    return response.data.discount;
  }
);

export const removeDiscountCode = createAsyncThunk(
  'user/removeDiscount',
  async ({ userId, code }) => {
    const response = await api.put(`/promotions/${code}/remove/${userId}`);
    return response.data.discount;
  }
);

export const fetchPrices = createAsyncThunk(
  'user/fetchPrices',
  async () => {
    const response = await api.get("/prices/all");
    return response.data;
  }
);

// Logout async thunk to handle side effects properly
export const logoutUser = createAsyncThunk(
  'user/logout',
  async (_, { dispatch }) => {
    try {
      // Remove tokens from AsyncStorage
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userId');
      
      // Disconnect socket if connected
      dispatch({ type: 'socket/disconnect' });
      
      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if AsyncStorage fails, we should still logout the user
      return true;
    }
  }
);

export const getAppStatus = createAsyncThunk(
  'user/getAppStatus',
  async (userId) => {
    const response = await api.get(`service/getLastService/${userId}`);
    if (response.status === 200) {
      const { status, review } = response.data.service;
      if (status && !review.rating) {
        return response.data;
      }
    }
    return null;
  }
);

export const login = createAsyncThunk(
  'user/login',
  async ({ token, id }, { dispatch }) => {
    try {
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userId', id);
      dispatch(getAppStatus(id));
      dispatch(fetchUserById(id));
      return token;
    } catch (error) {
      throw error;
    }
  }
);

export const isLoggedIn = createAsyncThunk(
  'user/isLoggedIn',
  async (_, { dispatch }) => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      const userId = await AsyncStorage.getItem('userId');

      if (userToken && userId) {
        dispatch(getAppStatus(userId));
        dispatch(fetchUserById(userId));
        return userToken;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }
);

const initialState = {
  user: null,
  isLoading: false,
  userToken: null,
  serviceStatus: null,
  socketConnected: false, // Track socket connection status
  socketError: null,      // Track socket errors
  prices: null,
  error: null
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      console.log('action.payload', action.payload);
      state.user = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setUserToken: (state, action) => {
      state.userToken = action.payload;
    },
    setServiceStatus: (state, action) => {
      state.serviceStatus = action.payload;
    },
    setPrices: (state, action) => {
      state.prices = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.userToken = null;
      state.isLoading = false;
      state.socketConnected = false;
    },
    
    // Socket state updates (these are called by the middleware)
    socketConnected: (state) => {
      state.socketConnected = true;
      state.socketError = null;
    },
    socketDisconnected: (state) => {
      state.socketConnected = false;
    },
    socketError: (state, action) => {
      state.socketError = action.payload;
      state.socketConnected = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.user = { ...state.user, ...action.payload };
      })
      .addCase(saveUserFavoriteAddress.fulfilled, (state, action) => {
        // Ensure safe update with proper null checks
        if (state.user && action.payload) {
          // Always use the enhanced data that was prepared in the thunk
          // The thunk already handles ensuring place objects exist
          state.user.saved_places = action.payload;
        } else {
          console.error('Invalid state or payload in saveUserFavoriteAddress.fulfilled');
        }
      })
      .addCase(saveUserFavoriteAddress.rejected, (state, action) => {
        console.error('Error in saveUserFavoriteAddress:', action.error);
        state.error = action.error.message;
      })
      .addCase(removeUserFavoriteAddress.fulfilled, (state, action) => {
        if (state.user && action.payload) {
          state.user.saved_places = action.payload;
        }
      })
      .addCase(updateUserFavoriteAddress.fulfilled, (state, action) => {
        if (state.user && action.payload) {
          state.user.saved_places = action.payload;
        }
      })
      .addCase(activateDiscountCode.fulfilled, (state, action) => {
        state.user.discount = action.payload;
      })
      .addCase(removeDiscountCode.fulfilled, (state, action) => {
        state.user.discount = action.payload;
      })
      .addCase(fetchPrices.fulfilled, (state, action) => {
        state.prices = action.payload;
      })
      .addCase(getAppStatus.fulfilled, (state, action) => {
        state.serviceStatus = action.payload;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.userToken = null;
        state.isLoading = false;
        state.socketConnected = false;
      })
      .addCase(login.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userToken = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      .addCase(isLoggedIn.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(isLoggedIn.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userToken = action.payload;
      })
      .addCase(isLoggedIn.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      });
  }
});

// Export the regular action creators
export const { 
  setUser, 
  setLoading, 
  setUserToken, 
  setServiceStatus, 
  setPrices, 
  logout,
  socketConnected,
  socketDisconnected,
  socketError
} = userSlice.actions;

// Simple action creators for socket actions (handled by middleware)
export const connectSocket = () => ({ type: 'socket/connect' });
export const disconnectSocket = () => ({ type: 'socket/disconnect' });
export const emitSocketEvent = (event, data) => ({
  type: 'socket/emit',
  payload: { event, data }
});

// Socket event listener actions
export const listenSocketEvent = (event, handler) => ({
  type: 'socket/listen',
  payload: { event, handler }
});

export const unlistenSocketEvent = (event) => ({
  type: 'socket/unlisten',
  payload: { event }
});

export const unlistenAllSocketEvents = () => ({
  type: 'socket/unlisten_all'
});

export default userSlice.reducer;