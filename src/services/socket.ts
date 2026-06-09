import { io, Socket } from 'socket.io-client';
import { getDeviceId } from '../utils/device';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

let socket: Socket | null = null;

export async function connectSocket(userId: string): Promise<Socket> {
  if (socket) return socket;

  const deviceId = await getDeviceId();

  socket = io(BASE_URL, {
    transports: ['websocket'],
    query: {
      userId,
      deviceId,
    },
  });

  socket.on('connect', () => {
    console.log('⚡ Socket connected');

    // 🔥 JOIN USER ROOM (IMPORTANT)
    socket?.emit('join:user', userId);
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected');
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}