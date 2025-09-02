import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Logger from '../utils/Logger';

class SocketService {
  constructor() {
    this.socket = null;
  }

  async connect(userToken) {
    const timer = Logger.startTimer ? Logger.startTimer('socket_connection') : null;
    
    if (!userToken) {
      Logger.error('SocketService', 'Authentication token required for socket connection');
      throw new Error('Authentication token required for socket connection');
    }

    const socketUrl = process.env.EXPO_PUBLIC_SOCKET_URL;
    Logger.info('SocketService', 'Attempting socket connection', { socketUrl });
    
    this.socket = io(socketUrl, {
      auth: {
        token: userToken
      },
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      Logger.info('SocketService', 'Socket connected successfully', { 
        socketId: this.socket.id,
        duration: timer ? timer.end() : null
      });
    });

    this.socket.on('disconnect', (reason) => {
      Logger.warn('SocketService', 'Socket disconnected', { 
        reason,
        socketId: this.socket?.id 
      });
    });

    this.socket.on('connect_error', (error) => {
      Logger.error('SocketService', 'Socket connection error', {
        error: error.message,
        type: error.type,
        description: error.description
      });
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      Logger.info('SocketService', 'Disconnecting socket', { socketId: this.socket.id });
      this.socket.disconnect();
      this.socket = null;
      Logger.debug('SocketService', 'Socket disconnected and cleaned up');
    } else {
      Logger.debug('SocketService', 'No socket to disconnect');
    }
  }

  getSocket() {
    return this.socket;
  }
}

export default new SocketService();