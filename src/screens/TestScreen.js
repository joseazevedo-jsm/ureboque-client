import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { io } from 'socket.io-client';
import { EXPO_PUBLIC_UREBOQUE_API } from '@env';

const socket = io(EXPO_PUBLIC_UREBOQUE_API);

const TestScreen = () => {
  useEffect(() => {
    // Handle events from the server
    socket.on('event', (data) => {
      console.log('Received event:', data);
    });

    // Emit events to the server
    socket.emit('event', 'Hello from the client');

    return () => {
      // Clean up the socket connection
      socket.disconnect();
    };
  }, []);

  return <Text>Socket.io example</Text>;
};

export default TestScreen;