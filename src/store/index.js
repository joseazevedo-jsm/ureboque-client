import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import locationReducer from './slices/locationSlice';
import { socketMiddleware } from '../middleware/socketMiddleware';

export const store = configureStore({
  reducer: {
    user: userReducer,
    location: locationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [
          'socket/connect', 
          'socket/connected', 
          'socket/error', 
          'socket/emit',
          'socket/listen',
          'socket/unlisten',
          'socket/unlisten_all'
        ],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.handler', 'payload.error'],
        // Ignore these paths in the state
        ignoredPaths: ['user.socketError'],
      },
    }).concat(socketMiddleware()),
});

export default store; 