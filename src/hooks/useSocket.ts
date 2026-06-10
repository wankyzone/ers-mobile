import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export function useSocket(url: string) {
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (!url) return;

    socketRef.current = io(url, {
      transports: ['websocket'],
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [url]);

  return socketRef;
}