import { io, Socket } from 'socket.io-client';
import { API_URL } from '../config/api';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket;
  socket = io(`${API_URL}/chat`, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
