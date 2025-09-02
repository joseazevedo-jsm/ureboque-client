import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { io } from 'socket.io-client';
import { EXPO_PUBLIC_UREBOQUE_API } from '@env';
import Logger from '../utils/Logger';

const socket = io(EXPO_PUBLIC_UREBOQUE_API);

const TestScreen = () => {
  useEffect(() => {
    Logger.info('TestScreen', 'Screen mounted, initializing socket');
    
    // Handle events from the server
    socket.on('event', (data) => {
      Logger.debug('TestScreen', 'Socket event received', { data });
    });

    // Emit events to the server
    socket.emit('event', 'Hello from the client');
    Logger.debug('TestScreen', 'Socket event emitted');

    return () => {
      Logger.info('TestScreen', 'Cleaning up socket connection');
      socket.disconnect();
    };
  }, []);

  return <Text>Socket.io test with logging</Text>;
};

export default TestScreen;