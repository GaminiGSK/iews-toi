import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

// In production, this should be the URL of your backend.
// For now, we default to localhost:5000 if not set.
// If deployed, ensure VITE_API_URL is set in your build environment.
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Initialize Socket Connection
        // withCredentials: true might be needed if using cookies, 
        // but for JWT auth via headers or just open socket, this is fine.
        const newSocket = io(SOCKET_URL, {
            transports: ['websocket'], // force websocket
            reconnectionAttempts: 5,
        });

        console.log(`[Neural Link] Connecting to ${SOCKET_URL}...`);

        newSocket.on('connect', () => {
            console.log(`[Neural Link] Connected. ID: ${newSocket.id}`);
        });

        newSocket.on('connect_error', (err) => {
            console.error(`[Neural Link] Connection Error:`, err);
        });

        setSocket(newSocket);

        // Cleanup on unmount
        return () => {
            console.log('[Neural Link] Disconnecting...');
            newSocket.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
