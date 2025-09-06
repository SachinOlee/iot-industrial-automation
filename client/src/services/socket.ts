// client/src/services/socket.ts
import io, { Socket } from 'socket.io-client';
import { API_BASE_URL } from '../utils/constants';

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;

  connect(token: string) {
    this.token = token;
    
    this.socket = io(API_BASE_URL.replace('/api', ''), {
      auth: {
        token,
      },
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
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

  // Emit sensor data
  emitSensorData(data: any) {
    if (this.socket) {
      this.socket.emit('sensor_data', data);
    }
  }

  // Listen for sensor updates
  onSensorUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('sensor_update', callback);
    }
  }

  // Remove sensor update listener
  offSensorUpdate() {
    if (this.socket) {
      this.socket.off('sensor_update');
    }
  }
}

export default new SocketService();

