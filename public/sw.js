/*
* OurGlass Service Worker
* Supports Push Notifications and basic caching
*/

self.addEventListener('install', () => {
    console.log('[Service Worker] Install');
    self.skipWaiting();
});

self.addEventListener('activate', () => {
    console.log('[Service Worker] Activate');
});

self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'OurGlass Notification';
    const options = {
        body: data.body || 'You have a new update in OurGlass.',
        icon: '/icon.png',
        badge: '/icon.png',
        data: data.url || '/',
        vibrate: [100, 50, 100],
        actions: [
            { action: 'open', title: 'Open App' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data)
    );
});
