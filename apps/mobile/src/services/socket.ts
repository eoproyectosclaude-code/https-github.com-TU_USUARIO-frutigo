import { io, type Socket } from 'socket.io-client';
import { API_BASE } from './api';

export interface LiveLocation {
  lat: number;
  lng: number;
  at: string;
}

/**
 * Suscribe el seguimiento en vivo de un pedido vía WebSocket.
 * Devuelve una función para cerrar la conexión.
 */
export function subscribeTracking(
  orderId: string,
  handlers: {
    onLocation?: (loc: LiveLocation) => void;
    onStatus?: (status: string) => void;
  },
): () => void {
  const socket: Socket = io(`${API_BASE}/tracking`, {
    transports: ['websocket'],
    forceNew: true,
  });

  socket.on('connect', () => socket.emit('track', orderId));
  if (handlers.onLocation) socket.on('location', handlers.onLocation);
  if (handlers.onStatus) socket.on('status', (p: { status: string }) => handlers.onStatus?.(p.status));

  return () => {
    socket.removeAllListeners();
    socket.disconnect();
  };
}
