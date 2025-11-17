// sw.js - Service Worker for Contractor Reviews App
const CACHE_NAME = 'contractor-reviews-v2.0.0';
const API_CACHE_NAME = 'contractor-reviews-api-v1';

// Core app files to cache
const urlsToCache = [
    '/',
    '/index.html',
    '/admin.html',
    '/generate_password.html',
    
    // CSS Files
    '/css/main.css',
    '/css/admin.css',
    '/css/layout.css',
    '/css/base/reset.css',
    '/css/base/variables.css',
    
    // Component CSS
    '/css/components/auth.css',
    '/css/components/buttons.css',
    '/css/components/cards.css',
    '/css/components/compact-filters.css',
    '/css/components/contractor-details.css',
    '/css/components/dashboard.css',
    '/css/components/forms.css',
    '/css/components/map.css',
    '/css/components/material.css',
    '/css/components/modals.css',
    '/css/components/ratings.css',
    '/css/components/stats-cards.css',
    '/css/components/tables.css',
    '/css/components/tabs.css',
    '/css/components/utilities.css',
    
    // JavaScript Files - Core
    '/js/script.js',
    '/js/admin.js',
    '/js/config/supabase-credentials.js',
    
    // Data Files
    '/js/data/dataLoader.js',
    '/js/data/defaultCategories.js',
    '/js/data/defaultContractors.js',
    '/js/data/defaultLocations.js',
    '/js/data/defaultReviews.js',
    '/js/data/defaultData.js',
    
    // Core Modules
    '/js/modules/data.js',
    '/js/modules/storage.js',
    '/js/modules/contractorManager.js',
    '/js/modules/reviewManager.js',
    '/js/modules/categories.js',
    '/js/modules/favoritesDataManager.js',
    '/js/modules/favoritesManager.js',
    '/js/modules/statsManager.js',
    '/js/modules/cardManager.js',
    '/js/modules/mapManager.js',
    '/js/modules/auth.js',
    '/js/modules/supabase.js',
    '/js/modules/utilities.js',
    '/js/modules/notifications.js',
    '/js/modules/validation.js',
    '/js/modules/uuid.js',
    
    // Admin Modules
    '/js/modules/admin-auth.js',
    '/js/modules/admin-contractors.js',
    '/js/modules/admin-categories.js',
    '/js/modules/admin-reviews.js',
    '/js/modules/tabs.js',
    
    // App Modules
    '/js/app/main.js',
    '/js/app/uiManager.js',
    '/js/app/filterManager.js',
    '/js/app/formManager.js',
    '/js/app/modalManager.js',
    '/js/app/modals/modalManager.js',
    '/js/app/modals/baseModalManager.js',
    '/js/app/modals/contractorModalManager.js',
    '/js/app/modals/reviewModalManager.js',
    
    // Manifest and Icons
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

// Install event - Cache core app files
self.addEventListener('install', (event) => {
    console.log('🛠️ Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('✅ App shell cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Cache installation failed:', error);
            })
    );
});

// Fetch event - Enhanced caching strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Handle different types of requests with appropriate strategies
    if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
        // API requests: Network first, then cache
        event.respondWith(handleApiRequest(request));
    } else if (url.pathname.endsWith('.html') || url.pathname === '/') {
        // HTML pages: Cache first, then network
        event.respondWith(handleHtmlRequest(request));
    } else if (url.pathname.match(/\.(js|css|json)$/)) {
        // Static assets: Cache first, then network
        event.respondWith(handleStaticRequest(request));
    } else if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$/)) {
        // Images and fonts: Cache first, never expire
        event.respondWith(handleImageRequest(request));
    } else {
        // Default: Network first, then cache
        event.respondWith(handleDefaultRequest(request));
    }
});

// Strategy: API requests - Network first, then cache
async function handleApiRequest(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache the successful response
            const cache = await caches.open(API_CACHE_NAME);
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
        throw new Error('Network response not ok');
    } catch (error) {
        // Fall back to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page or error
        return new Response(
            JSON.stringify({ error: 'You are offline and no cached data is available' }),
            { 
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// Strategy: HTML pages - Cache first, then network
async function handleHtmlRequest(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        // Return cached version immediately
        return cachedResponse;
    }

    try {
        // Try network
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            // Cache the new version
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        // If both cache and network fail, show offline page
        return caches.match('/index.html');
    }
}

// Strategy: Static assets - Cache first, then network
async function handleStaticRequest(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        // Return cached version but update in background
        updateCacheInBackground(request);
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        // Return error response for missing static assets
        return new Response('Resource not available offline', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Strategy: Images and fonts - Cache first, never expire
async function handleImageRequest(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        // Return a placeholder image for missing images
        if (request.url.match(/\.(png|jpg|jpeg|gif|svg)$/)) {
            return new Response(
                '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#f0f0f0"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="#666">Image</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
            );
        }
        return new Response('', { status: 404 });
    }
}

// Strategy: Default - Network first, then cache
async function handleDefaultRequest(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        return new Response('Resource not available offline', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Background cache update for static assets
async function updateCacheInBackground(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
    } catch (error) {
        // Silent fail - we already returned cached version
    }
}

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
    console.log('🔄 Service Worker activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Delete old caches that don't match current version
                    if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('✅ Service Worker activated and ready');
            return self.clients.claim();
        })
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('🔄 Background sync:', event.tag);
    
    if (event.tag === 'background-sync-reviews') {
        event.waitUntil(syncPendingReviews());
    } else if (event.tag === 'background-sync-favorites') {
        event.waitUntil(syncPendingFavorites());
    }
});

// Sync pending reviews when back online
async function syncPendingReviews() {
    // This would sync any reviews created while offline
    // Implementation depends on your data sync strategy
    console.log('Syncing pending reviews...');
}

// Sync pending favorites when back online
async function syncPendingFavorites() {
    // This would sync any favorite changes made while offline
    console.log('Syncing pending favorites...');
}

// Push notifications (optional feature)
self.addEventListener('push', (event) => {
    if (!event.data) return;
    
    const data = event.data.json();
    const options = {
        body: data.body || 'New update available',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/'
        },
        actions: [
            {
                action: 'view',
                title: 'View'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'Contractor Reviews', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow(event.notification.data.url)
        );
    }
});

// Message handling for cache updates
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'UPDATE_CACHE') {
        updateCacheWithNewData(event.data.payload);
    }
});

// Manual cache update function
async function updateCacheWithNewData(payload) {
    try {
        const cache = await caches.open(CACHE_NAME);
        // Update specific resources based on payload
        console.log('Updating cache with new data:', payload);
    } catch (error) {
        console.error('Cache update failed:', error);
    }
}

// Periodic cache cleanup (optional)
async function cleanupOldCacheEntries() {
    // This could be called periodically to remove old cache entries
    // Implementation depends on your cache management strategy
}