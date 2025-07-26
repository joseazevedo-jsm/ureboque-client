import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SocketService {
  constructor() {
    this.socket = null;
  }

  async connect(userToken) {
    if (!userToken) {
      throw new Error('Authentication token required for socket connection');
    }

    const socketUrl = process.env.EXPO_PUBLIC_SOCKET_URL;
    
    this.socket = io(socketUrl, {
      auth: {
        token: userToken
      },
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      console.log('Socket connected securely');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }
}

export default new SocketService();