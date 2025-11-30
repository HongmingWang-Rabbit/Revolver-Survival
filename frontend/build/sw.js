// Service Worker placeholder
// This file prevents 404 errors for browsers that look for a service worker
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
