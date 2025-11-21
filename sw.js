// sw.js - Service Worker for Community Trade Network
const CACHE_NAME = 'community-trade-network-v1.1.3';
const API_CACHE_NAME = 'community-trade-network-api-v1';
const DYNAMIC_CACHE_NAME = 'community-trade-network-dynamic-v1.1.3';

// Configuration
const CACHE_CONFIG = {
    STATIC_MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days
    DYNAMIC_MAX_AGE: 5 * 60 * 1000, // 5 minutes
    HTML_MAX_AGE: 60 * 60 * 1000, // 1 hour
};

// Core app files to cache
const urlsToCache = [
    './',
    './index.html',
    './admin.html',
    './generate_password.html',

    // CSS Files
    'css/main.css',
    'css/admin.css',
    'css/layout.css',
    'css/base/reset.css',
    'css/base/variables.css',

    // Component CSS
    'css/components/auth.css',
    'css/components/buttons.css',
    'css/components/cards.css',
    'css/components/bottom-nav.css',
    'css/components/bottom-sheet.css',
    'css/components/contractor-details.css',
    'css/components/dashboard.css',
    'css/components/forms.css',
    'css/components/map.css',
    'css/components/material.css',
    'css/components/modals.css',
    'css/components/notifications.css',
    'css/components/ratings.css',
    'css/components/review-modal.css',
    'css/components/stats-cards.css',
    'css/components/tables.css',
    'css/components/tabs.css',
    'css/components/utilities.css',

    // JavaScript Files
    'js/script.js',
    'js/admin.js',
    'js/config/supabase-credentials.js',

    // Data Files
    'js/data/defaultData.js',
    'js/data/defaultCategories.js',
    'js/data/defaultContractors.js',
    'js/data/defaultLocations.js',
    'js/data/defaultReviews.js',

    // Core Modules
    'js/modules/data.js',
    'js/modules/storage.js',
    'js/modules/contractorManager.js',
    'js/modules/reviewManager.js',
    'js/modules/categories.js',
    'js/modules/favoritesDataManager.js',
    'js/modules/statsDataManager.js',
    'js/modules/cardManager.js',
    'js/modules/mapManager.js',
    'js/modules/auth.js',
    'js/modules/supabase.js',
    'js/modules/utilities.js',
    'js/modules/notifications.js',
    'js/modules/validation.js',
    'js/modules/uuid.js',
    'js/modules/tabs.js',

    // Admin Modules
    'js/modules/admin-auth.js',
    'js/modules/admin-contractors.js',
    'js/modules/admin-categories.js',
    'js/modules/admin-reviews.js',

    // App Modules
    'js/app/main.js',
    'js/app/uiManager.js',
    'js/app/filterManager.js',
    'js/app/lazyLoader.js',
    'js/app/favoritesManager.js',
    'js/app/statsManager.js',
    'js/app/modals/modalManager.js',
    'js/app/modals/baseModalManager.js',
    'js/app/modals/contractorModalManager.js',
    'js/app/modals/reviewModalManager.js',

    // Manifest and Icons
    'manifest.json',
    'icons/icon-72x72.png',
    'icons/icon-96x96.png',
    'icons/icon-128x128.png',
    'icons/icon-144x144.png',
    'icons/icon-152x152.png',
    'icons/icon-192x192.png',
    'icons/icon-384x384.png',
    'icons/icon-512x512.png'
];

// Install event - Cache core app files
self.addEventListener('install', (event) => {
    console.log('🛠️ Service Worker installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Caching app shell');
                return Promise.allSettled(
                    urlsToCache.map(url =>
                        cache.add(url).catch(err =>
                            console.warn(`⚠️ Failed to cache: ${url}`, err)
                        )
                    )
                );
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

// ENHANCED Fetch event with hard refresh handling
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // ONLY handle our own app resources - let CDN requests pass through to network
    if (isOurAppResource(request)) {
        // Handle our app resources with appropriate strategies
        
        // CRITICAL FIX: Detect hard refresh for HTML files and use network-first
        if (url.pathname.endsWith('.html') || url.pathname === '/') {
            // Check if this might be a hard refresh by looking at cache headers
            if (isLikelyHardRefresh(request)) {
                event.respondWith(handleHtmlWithNetworkFirst(request));
            } else {
                event.respondWith(handleHtmlWithStaleWhileRevalidate(request));
            }
        }
        else if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
            // API requests: Network first with aggressive caching
            event.respondWith(handleApiRequestWithFreshness(request));
        } else if (url.pathname.match(/\.(js|css)$/) && !url.search) {
            // Versioned static assets: Cache first with background updates
            event.respondWith(handleVersionedAssets(request));
        } else if (url.pathname.match(/\.(js|css|json)$/)) {
            // Unversioned static assets: Network first for freshness
            event.respondWith(handleStaticWithNetworkFirst(request));
        } else if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$/)) {
            // Images and fonts: Cache first with cache freshness checks
            event.respondWith(handleCachedAssetsWithFreshness(request));
        } else {
            // Default: Network first with cache fallback
            event.respondWith(handleNetworkFirstWithCache(request));
        }
    }
    // ALL CDN requests (Google Fonts, Material Icons, etc.) are let through to network
    // Service Worker does NOT intercept them when online
});

// NEW: Detect hard refresh attempts
function isLikelyHardRefresh(request) {
    // Check for cache-control headers that indicate hard refresh
    const cacheControl = request.headers.get('cache-control');
    const pragma = request.headers.get('pragma');
    
    // Hard refresh typically sends no-cache headers
    const isHardRefresh = (cacheControl && cacheControl.includes('no-cache')) ||
                         (pragma && pragma.includes('no-cache')) ||
                         // Also detect when the request is for HTML and has specific headers
                         (request.mode === 'navigate' && cacheControl === null);
    
    console.log(`🔄 Hard refresh detection: ${isHardRefresh}`, {
        url: request.url,
        cacheControl,
        pragma,
        mode: request.mode
    });
    
    return isHardRefresh;
}

// NEW: Network-first strategy for HTML during hard refresh
async function handleHtmlWithNetworkFirst(request) {
    console.log('🔄 Using network-first strategy for HTML (hard refresh detected)');
    
    try {
        // Try network first with a timeout
        const networkPromise = fetch(request);
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Network timeout')), 5000)
        );
        
        const networkResponse = await Promise.race([networkPromise, timeoutPromise]);
        
        if (networkResponse && networkResponse.ok) {
            // Cache the fresh response
            const responseWithTimestamp = addCacheTimestamp(networkResponse.clone());
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, responseWithTimestamp);
            console.log('✅ Fresh HTML cached from network');
            return networkResponse;
        }
        throw new Error('Network response not ok');
    } catch (error) {
        console.log('📡 Network failed during hard refresh, falling back to cache');
        
        // Fall back to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            console.log('✅ Serving cached HTML as fallback');
            return cachedResponse;
        }
        
        // Ultimate fallback
        return new Response('Application loading...', {
            status: 503,
            headers: { 'Content-Type': 'text/html' }
        });
    }
}

// Only handle resources that belong to OUR app
function isOurAppResource(request) {
    const url = new URL(request.url);

    // Our app resources - use relative path detection instead of hostnames
    const isOurAppPath = url.pathname.includes('/community-trade-network/') ||
        url.pathname === '/community-trade-network/' ||
        url.pathname.startsWith('/community-trade-network/') ||
        // Also handle root paths for flexibility
        url.pathname === '/' ||
        url.pathname.startsWith('/css/') ||
        url.pathname.startsWith('/js/') ||
        url.pathname.startsWith('/icons/') ||
        url.pathname === '/index.html' ||
        url.pathname === '/admin.html' ||
        url.pathname === '/manifest.json';

    // External CDNs we DON'T handle (let them pass through)
    const externalCDNs = [
        'fonts.googleapis.com',
        'fonts.gstatic.com',
        'cdnjs.cloudflare.com',
        'unpkg.com',
        'cdn.jsdelivr.net',
        'tevbkmzzwoliozhkcyyb.supabase.co' // Let Supabase through directly
    ];

    const isExternalCDN = externalCDNs.some(cdn => url.hostname.includes(cdn));

    // Only handle our own resources, NOT external CDNs
    return isOurAppPath && !isExternalCDN;
}

// Enhanced API Handler: Network First with Smart Caching
async function handleApiRequestWithFreshness(request) {
    const url = new URL(request.url);
    const cacheKey = request.url;

    try {
        // Always try network first for API calls
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            // Cache the successful response with timestamp
            const responseWithTimestamp = addCacheTimestamp(networkResponse.clone());
            const cache = await caches.open(API_CACHE_NAME);
            await cache.put(cacheKey, responseWithTimestamp);

            console.log(`✅ Fresh API data cached: ${url.pathname}`);
            return networkResponse;
        }
        throw new Error('Network response not ok');
    } catch (error) {
        console.log(`📡 Network failed, trying cache: ${url.pathname}`);

        // Fall back to cache, but check freshness
        const cachedResponse = await caches.match(cacheKey);
        if (cachedResponse) {
            const isFresh = await isCachedResponseFresh(cachedResponse, CACHE_CONFIG.DYNAMIC_MAX_AGE);
            if (isFresh) {
                console.log(`✅ Using fresh cached API data: ${url.pathname}`);
                return cachedResponse;
            } else {
                console.log(`⚠️ Cached API data is stale: ${url.pathname}`);
                // We'll return stale data but refresh in background
                refreshCacheInBackground(request);
            }
        }

        if (cachedResponse) {
            return cachedResponse; // Return stale data as fallback
        }

        // No cached data available
        return new Response(
            JSON.stringify({
                error: 'You are offline and no cached data is available',
                timestamp: new Date().toISOString()
            }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// HTML Handler: Stale-While-Revalidate for best UX (for normal navigation)
async function handleHtmlWithStaleWhileRevalidate(request) {
    const cachedResponse = await caches.match(request);

    // Always return cached version immediately for fast loading
    if (cachedResponse) {
        // Check if cached HTML is fresh
        const isFresh = await isCachedResponseFresh(cachedResponse, CACHE_CONFIG.HTML_MAX_AGE);

        if (!isFresh) {
            // Update cache in background if stale
            console.log('🔄 HTML is stale, updating in background');
            updateCacheInBackground(request);
        }

        return cachedResponse;
    }

    // No cache? Get from network
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const responseWithTimestamp = addCacheTimestamp(networkResponse.clone());
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, responseWithTimestamp);
        }
        return networkResponse;
    } catch (error) {
        return new Response('Offline - Please check your connection', {
            status: 503,
            headers: { 'Content-Type': 'text/html' }
        });
    }
}

// Versioned Assets: Cache First with Background Updates
async function handleVersionedAssets(request) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
        // Versioned assets can be cached long-term, but still check for updates
        updateCacheInBackground(request);
        return cachedResponse;
    }

    // Not in cache? Get from network
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const responseWithTimestamp = addCacheTimestamp(networkResponse.clone());
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, responseWithTimestamp);
        }
        return networkResponse;
    } catch (error) {
        return new Response('Resource not available', { status: 404 });
    }
}

// Static Assets: Network First for Freshness
async function handleStaticWithNetworkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            // Cache the fresh response
            const responseWithTimestamp = addCacheTimestamp(networkResponse.clone());
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            await cache.put(request, responseWithTimestamp);
            return networkResponse;
        }
        throw new Error('Network failed');
    } catch (error) {
        // Fallback to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        return new Response('Resource not available offline', { status: 503 });
    }
}

// Cached Assets with Freshness Check
async function handleCachedAssetsWithFreshness(request) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
        const isFresh = await isCachedResponseFresh(cachedResponse, CACHE_CONFIG.STATIC_MAX_AGE);

        if (!isFresh) {
            // Update in background if stale
            updateCacheInBackground(request);
        }

        return cachedResponse;
    }

    // Not in cache - get from network
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const responseWithTimestamp = addCacheTimestamp(networkResponse.clone());
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, responseWithTimestamp);
        }
        return networkResponse;
    } catch (error) {
        // Return placeholder for images
        if (request.url.match(/\.(png|jpg|jpeg|gif|svg)$/)) {
            return new Response(
                '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#f0f0f0"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="#666">Image</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
            );
        }
        return new Response('', { status: 404 });
    }
}

// Network First with Cache Fallback
async function handleNetworkFirstWithCache(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const responseWithTimestamp = addCacheTimestamp(networkResponse.clone());
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            await cache.put(request, responseWithTimestamp);
            return networkResponse;
        }
        throw new Error('Network failed');
    } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        return new Response('Resource not available offline', { status: 503 });
    }
}

// Cache Freshness Utilities
function addCacheTimestamp(response) {
    const timestamp = Date.now();
    const headers = new Headers(response.headers);
    headers.set('sw-cache-timestamp', timestamp.toString());

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
    });
}

async function isCachedResponseFresh(cachedResponse, maxAge) {
    const timestampHeader = cachedResponse.headers.get('sw-cache-timestamp');
    if (!timestampHeader) return false; // No timestamp, consider stale

    const cacheTime = parseInt(timestampHeader);
    const age = Date.now() - cacheTime;

    return age < maxAge;
}

// Enhanced Background Cache Updates
async function updateCacheInBackground(request) {
    if (!self.navigator.onLine) return;

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const responseWithTimestamp = addCacheTimestamp(networkResponse.clone());
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, responseWithTimestamp);
            console.log(`🔄 Background cache updated: ${request.url}`);
        }
    } catch (error) {
        // Silent fail - we'll try again later
    }
}

async function refreshCacheInBackground(request) {
    if (!self.navigator.onLine) return;

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const responseWithTimestamp = addCacheTimestamp(networkResponse.clone());
            const cache = await caches.open(API_CACHE_NAME);
            await cache.put(request.url, responseWithTimestamp);
            console.log(`🔄 API cache refreshed: ${request.url}`);
        }
    } catch (error) {
        // Silent fail
    }
}

// Client Notification System
async function notifyClientsAboutUpdate(updatedUrl) {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        client.postMessage({
            type: 'CACHE_UPDATED',
            url: updatedUrl,
            timestamp: new Date().toISOString()
        });
    });
}

// Enhanced Activate Event with Cache Cleanup
self.addEventListener('activate', (event) => {
    console.log('🔄 Service Worker activating...');

    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME &&
                            cacheName !== API_CACHE_NAME &&
                            cacheName !== DYNAMIC_CACHE_NAME) {
                            console.log('🗑️ Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),

            // Clean up stale dynamic cache entries
            cleanupStaleCacheEntries()
        ]).then(() => {
            console.log('✅ Service Worker activated and ready');
            return self.clients.claim();
        })
    );
});

// Clean up stale cache entries
async function cleanupStaleCacheEntries() {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const requests = await cache.keys();

    const cleanupPromises = requests.map(async (request) => {
        const response = await cache.match(request);
        if (response) {
            const isFresh = await isCachedResponseFresh(response, CACHE_CONFIG.DYNAMIC_MAX_AGE);
            if (!isFresh) {
                await cache.delete(request);
                console.log(`🧹 Cleaned stale cache: ${request.url}`);
            }
        }
    });

    await Promise.all(cleanupPromises);
}

// Periodic Cache Maintenance
async function performCacheMaintenance() {
    console.log('🔧 Performing cache maintenance...');
    await cleanupStaleCacheEntries();

    // Check for app updates
    checkForAppUpdates();
}

// Check for app updates
async function checkForAppUpdates() {
    try {
        const response = await fetch('./index.html', { cache: 'no-cache' }); // Changed to relative path
        if (response.ok) {
            // Compare with cached version
            const cache = await caches.open(CACHE_NAME);
            const cachedResponse = await cache.match('./index.html'); // Changed to relative path

            if (cachedResponse) {
                const newContent = await response.text();
                const oldContent = await cachedResponse.text();

                if (newContent !== oldContent) {
                    console.log('🔄 App update detected!');
                    notifyClientsAboutAppUpdate();
                }
            }
        }
    } catch (error) {
        // Silent fail
    }
}

function notifyClientsAboutAppUpdate() {
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({
                type: 'APP_UPDATE_AVAILABLE',
                message: 'A new version of the app is available!',
                timestamp: new Date().toISOString()
            });
        });
    });
}

// Enhanced Message Handling
self.addEventListener('message', (event) => {
    const { data } = event;

    switch (data.type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;

        case 'UPDATE_CACHE':
            updateCacheWithNewData(data.payload);
            break;

        case 'CLEAR_CACHE':
            clearSpecificCache(data.cacheName);
            break;

        case 'CHECK_FOR_UPDATES':
            checkForAppUpdates();
            break;

        case 'GET_CACHE_INFO':
            sendCacheInfo(event);
            break;
    }
});

async function sendCacheInfo(event) {
    const cacheNames = await caches.keys();
    const cacheInfo = {};

    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        cacheInfo[cacheName] = {
            size: requests.length,
            urls: requests.map(req => req.url)
        };
    }

    event.ports[0].postMessage(cacheInfo);
}

async function clearSpecificCache(cacheName) {
    const deleted = await caches.delete(cacheName);
    console.log(`🗑️ Cache ${cacheName} deleted: ${deleted}`);
}

// Enhanced Background Sync
self.addEventListener('sync', (event) => {
    console.log('🔄 Background sync:', event.tag);

    switch (event.tag) {
        case 'background-sync-reviews':
            event.waitUntil(syncPendingReviews());
            break;
        case 'background-sync-favorites':
            event.waitUntil(syncPendingFavorites());
            break;
        case 'cache-maintenance':
            event.waitUntil(performCacheMaintenance());
            break;
    }
});

// Enhanced Sync Functions
async function syncPendingReviews() {
    console.log('Syncing pending reviews...');
    // Implementation would sync offline reviews
}

async function syncPendingFavorites() {
    console.log('Syncing pending favorites...');
    // Implementation would sync offline favorites
}

// Push notifications
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
        self.registration.showNotification(data.title || 'Service Provider Reviews', options)
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

// Periodic maintenance (every 24 hours)
setInterval(() => {
    performCacheMaintenance();
}, 24 * 60 * 60 * 1000);

// Manual cache update function
async function updateCacheWithNewData(payload) {
    try {
        const cache = await caches.open(CACHE_NAME);
        console.log('Updating cache with new data:', payload);
    } catch (error) {
        console.error('Cache update failed:', error);
    }
}