import { io } from 'socket.io-client';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL!;

let socket: any;

export function connectSocket(userId: string) {
  socket = io(BASE_URL, {
    transports: ['websocket'],
  });

  socket.emit('join:user', userId);

  return socket;
}

export function getSocket() {
  return socket;
}