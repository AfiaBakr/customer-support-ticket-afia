'use client';

import { io, type Socket } from 'socket.io-client';
import { API_URL } from './constants';

let socket: Socket | null = null;
let currentToken: string | null = null;

/** Returns a singleton Socket.IO connection authenticated with the given token. */
export function getSocket(token: string): Socket {
  if (socket && currentToken === token) return socket;

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  currentToken = token;
  socket = io(API_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  return socket;
}

export function closeSocket(): void {
  socket?.disconnect();
  socket = null;
  currentToken = null;
}
