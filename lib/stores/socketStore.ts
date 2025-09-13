'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { io, Socket } from 'socket.io-client';
import { SocketStore } from '../types/game';

interface SocketStoreState extends SocketStore {
  socket: Socket | null;
}

export const useSocketStore = create<SocketStoreState>()(
  devtools(
    (set, get) => ({
      socket: null,
      isConnected: false,
      connectionError: null,
      lastReconnectAttempt: null,

      connect: (gameId: string) => {
        const { socket } = get();
        
        // Disconnect existing socket
        if (socket) {
          socket.disconnect();
        }

        // Create new socket connection
        const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
          query: { gameId },
          transports: ['websocket'],
          upgrade: true,
        });

        // Connection event handlers
        newSocket.on('connect', () => {
          console.log('Socket connected:', newSocket.id);
          set({ 
            isConnected: true, 
            connectionError: null,
            socket: newSocket,
          });
        });

        newSocket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          set({ 
            isConnected: false,
            connectionError: `Disconnected: ${reason}`,
          });
        });

        newSocket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          set({ 
            isConnected: false,
            connectionError: error.message,
            lastReconnectAttempt: new Date(),
          });
        });

        newSocket.on('reconnect_attempt', () => {
          set({ lastReconnectAttempt: new Date() });
        });

        // Game event handlers would be set up here
        // These will be handled by the components that use the socket
        
        set({ socket: newSocket });
      },

      disconnect: () => {
        const { socket } = get();
        if (socket) {
          socket.disconnect();
          set({ 
            socket: null,
            isConnected: false,
            connectionError: null,
          });
        }
      },

      setConnectionStatus: (connected: boolean, error?: string) => {
        set({ 
          isConnected: connected,
          connectionError: error || null,
        });
      },
    }),
    { name: 'sus-socket-store' }
  )
);