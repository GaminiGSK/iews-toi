import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

// Socket connects to window.location.origin so the Vite proxy (/socket.io → :5000) is used in dev.
// In production the origin is the Cloud Run service URL, which is also correct.
// Override with VITE_API_URL only when connecting to a separate host is explicitly required.
const SOCKET_URL = import.meta.env.VITE_API_URL || window.location.origin;

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // DETECT ENVIRONMENT
        const isLocal = window.location.hostname === 'localhost';
        // Always connect to origin so Vite's /socket.io proxy routes it to :5000 in dev,
        // and Cloud Run's own origin is used in production.
        const finalUrl = import.meta.env.VITE_API_URL || window.location.origin;

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
