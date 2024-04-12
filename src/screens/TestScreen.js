import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { io } from 'socket.io-client';

const socket = io('http://192.168.1.130:9000');

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