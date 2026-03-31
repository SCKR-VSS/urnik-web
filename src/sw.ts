/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

if (typeof self.__WB_MANIFEST !== 'undefined') {
    cleanupOutdatedCaches();
    precacheAndRoute(self.__WB_MANIFEST);

    registerRoute(
        ({ url }) => url.pathname.endsWith('/options'),
        new NetworkFirst({ cacheName: 'api-options', fetchOptions: { credentials: 'same-origin' } })
    );

    registerRoute(
        ({ url }) => url.pathname.includes('/timetable/'),
        new NetworkFirst({ cacheName: 'api-timetable', fetchOptions: { credentials: 'same-origin' } })
    );
}

self.addEventListener('push', (event) => {
    if (!event.data) return;
    let payload: { title?: string; body?: string; url?: string };
    try {
        payload = event.data.json();
    } catch {
        payload = { body: event.data.text() };
    }
    const title = payload.title ?? 'VSŠ Kranj Urnik';
    const options: NotificationOptions = {
        body: payload.body ?? 'Urnik se je spremenil.',
        icon: '/pwa-192x192.svg',
        badge: '/favicon.svg',
        data: { url: payload.url ?? '/' },
        tag: 'timetable-change',
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = (event.notification.data?.url as string) ?? '/';
    event.waitUntil(
        self.clients
            .matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    if ('focus' in client) {
                        (client as WindowClient).navigate(targetUrl);
                        return (client as WindowClient).focus();
                    }
                }
                if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
            })
    );
});
