'use client';

import { useState, useEffect } from 'react';

export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(
        typeof window !== 'undefined' ? navigator.onLine : true
    );
    const [justCameOnline, setJustCameOnline] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setJustCameOnline(true);
            // Reset the notification flag after 3 seconds
            setTimeout(() => setJustCameOnline(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setJustCameOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return { isOnline, justCameOnline };
}
