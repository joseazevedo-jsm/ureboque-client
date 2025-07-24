import { io } from 'socket.io-client';
import { socketConnected, socketDisconnected, socketError } from '../store/slices/userSlice';

// Keep socket instance outside of Redux
let socket = null;
let eventHandlers = {}; // Track event handlers
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 5;

export const socketMiddleware = () => store => next => action => {
  const result = next(action);
  
  switch (action.type) {
    case 'socket/connect':
      const IP = process.env.EXPO_PUBLIC_UREBOQUE_API;
      console.log('Connecting socket via middleware...', IP);
      
      // If we've tried too many times in a row, wait longer before trying again
      if (connectionAttempts > MAX_CONNECTION_ATTEMPTS) {
        console.log(`Too many failed connection attempts (${connectionAttempts}). Waiting longer before retry.`);
        setTimeout(() => {
          connectionAttempts = 0; // Reset counter after waiting
        }, 10000); // Wait 10 seconds
        store.dispatch(socketError('Too many connection attempts failed. Please try again later.'));
        return result;
      }
      
      // First check if socket is already connected to avoid redundant connection attempts
      if (socket && socket.connected) {
        console.log('Socket is already connected, no need to reconnect');
        store.dispatch(socketConnected()); // Ensure state is updated
        return result;
      }
      
      // Initialize socket if needed
      if (!socket) {
        console.log('Creating new socket instance...');
        socket = io(`${IP}`, {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
          timeout: 10000, // 10 second timeout
          transports: ['websocket', 'polling']
        });
        
        // Setup socket event listeners (only once)
        socket.on('connect', () => {
          console.log('Socket connected successfully!');
          connectionAttempts = 0; // Reset on successful connection
          store.dispatch(socketConnected());
        });
        
        socket.on('connect_error', (error) => {
          connectionAttempts++; // Increment counter on error
          console.error(`Socket connection error (attempt ${connectionAttempts}):`, error.message);
          store.dispatch(socketError(error.message));
          store.dispatch(socketDisconnected()); // Ensure disconnected state is set
        });
        
        socket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          store.dispatch(socketDisconnected());
          
          // If server disconnected us, try to reconnect after a delay
          if (reason === 'io server disconnect') {
            setTimeout(() => {
              if (socket) socket.connect();
            }, 3000);
          }
        });
        
        // Add error handler
        socket.on('error', (error) => {
          console.error('Socket error:', error);
          store.dispatch(socketError(error.message || 'Unknown socket error'));
          store.dispatch(socketDisconnected()); // Ensure disconnected state is set
        });
        
        // Add reconnect handlers for better logging
        socket.io.on('reconnect_attempt', (attempt) => {
          console.log(`Socket reconnection attempt ${attempt}`);
        });
        
        socket.io.on('reconnect', (attempt) => {
          console.log(`Socket reconnected after ${attempt} attempts`);
          store.dispatch(socketConnected());
        });
        
        socket.io.on('reconnect_error', (error) => {
          console.error('Socket reconnection error:', error);
          store.dispatch(socketDisconnected()); // Ensure disconnected state is set
        });
        
        socket.io.on('reconnect_failed', () => {
          console.error('Socket reconnection failed after all attempts');
          store.dispatch(socketError('Failed to reconnect after multiple attempts'));
          store.dispatch(socketDisconnected()); // Ensure disconnected state is set
        });
      }
      
      // Connect if not already connected
      if (!socket.connected) {
        console.log('Socket not connected, attempting to connect...');
        socket.connect();
      }
      
      break;
      
    case 'socket/disconnect':
      if (socket) {
        console.log('Manually disconnecting socket...');
        // Remove all event listeners
        Object.keys(eventHandlers).forEach(event => {
          if (eventHandlers[event]) {
            socket.off(event, eventHandlers[event]);
          }
        });
        
        socket.disconnect();
        eventHandlers = {};
        store.dispatch(socketDisconnected()); // Ensure state is updated
      }
      break;
      
    case 'socket/emit':
      if (socket && socket.connected) {
        const { event, data } = action.payload;
        console.log(`Emitting ${event} event with data:`, data);
        socket.emit(event, data);
      } else {
        console.warn(`Cannot emit ${action.payload.event} event: socket not connected`);
        // Try to reconnect if trying to emit but not connected
        store.dispatch({ type: 'socket/connect' });
      }
      break;
      
    case 'socket/listen':
      if (socket) {
        const { event, handler } = action.payload;
        console.log(`Setting up listener for ${event} event`);
        
        // Remove any existing handler for this event
        if (eventHandlers[event]) {
          console.log(`Removing existing listener for ${event} event`);
          socket.off(event, eventHandlers[event]);
        }
        
        // Add the new handler
        eventHandlers[event] = handler;
        socket.on(event, handler);
        console.log(`Successfully registered listener for ${event} event`);
      } else {
        console.warn('Cannot set up event listener: socket not initialized');
        // Initialize socket if not yet created
        store.dispatch({ type: 'socket/connect' });
      }
      break;
      
    case 'socket/unlisten':
      if (socket) {
        const event = action.payload.event;
        console.log(`Removing listener for ${event} event`);
        if (eventHandlers[event]) {
          socket.off(event, eventHandlers[event]);
          delete eventHandlers[event];
          console.log(`Successfully removed listener for ${event} event`);
        } else {
          console.log(`No listener found for ${event} event`);
        }
      }
      break;
      
    case 'socket/unlisten_all':
      if (socket) {
        console.log('Removing all listeners - WARNING: This may affect chat functionality');
        console.log('Current active listeners:', Object.keys(eventHandlers).join(', '));
        
        // Save message handler if it exists to preserve chat functionality
        const messageHandler = eventHandlers['message'];
        
        Object.keys(eventHandlers).forEach(event => {
          if (event !== 'message') { // Skip message handler to preserve chat
            console.log(`Removing listener for ${event} event`);
            socket.off(event, eventHandlers[event]);
            delete eventHandlers[event];
          } else {
            console.log(`Preserving message listener for chat functionality`);
          }
        }); 
      }
      break;
  }
  
  return result;
}; 