'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker for offline support.
 * This is a client-only component with no render output.
 */
export function ServiceWorkerRegistrar() {
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then((reg) => {
                    console.log('[SW] Registered:', reg.scope);
                })
                .catch((err) => {
                    console.warn('[SW] Registration failed:', err);
                });
        }
    }, []);

    return null;
}
