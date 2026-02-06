import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

// In production, this should be the URL of your backend.
// For now, we default to localhost:5000 if not set.
// If deployed, ensure VITE_API_URL is set in your build environment.
const SOCKET_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // DETECT ENVIRONMENT
        const isLocal = window.location.hostname === 'localhost';
        const defaultUrl = isLocal ? 'http://localhost:5000' : window.location.origin;
        const finalUrl = import.meta.env.VITE_API_URL || defaultUrl;

        console.log(`[Logic Link] Base URL: ${finalUrl} (Environment: ${isLocal ? 'Local' : 'Production'})`);

        // Initialize Socket Connection
        const newSocket = io(finalUrl, {
            // FIREBASE HOSTING NOTE: Firebase rewrites to Cloud Run DO NOT support WebSockets.
            // We MUST use polling as the primary transport on production.
            transports: isLocal ? ['websocket', 'polling'] : ['polling', 'websocket'],
            reconnectionAttempts: 20, // Be more persistent for Cloud Run cold starts
            reconnectionDelay: 2000,
            timeout: 30000, // 30s timeout for cold starts
            autoConnect: true
        });

        console.log(`[Logic Link] Attempting connection to: ${finalUrl}/socket.io/`);

        newSocket.on('connect', () => {
            console.log(`[Logic Link] ONLINE. Protocol: ${newSocket.io.engine.transport.name} | ID: ${newSocket.id}`);
        });

        newSocket.on('connect_error', (err) => {
            console.error(`[Logic Link] UNREACHABLE:`, err.message);
            console.log(`[Logic Link] Retrying (${newSocket.io.reconnectionAttempts} attempts left)...`);
        });

        setSocket(newSocket);

        // Cleanup on unmount
        return () => {
            console.log('[Logic Link] Terminating Connection...');
            newSocket.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
