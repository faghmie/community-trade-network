// sw.js - Service Worker for Community Trade Network
const CACHE_NAME = 'community-trade-network-v1.5.0';
const API_CACHE_NAME = 'community-trade-network-api-v1.4';

// Cache configuration
const CACHE_CONFIG = {
    STATIC_MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days
    API_MAX_AGE: 5 * 60 * 1000, // 5 minutes
    HTML_MAX_AGE: 60 * 60 * 1000, // 1 hour
};


// Core app files to cache - COMPLETE list for offline functionality
const CORE_ASSETS = [
    // HTML Files (all application entry points)
    './',
    './index.html',
    './admin.html',
    './generate_password.html',

    // Main CSS Files
    'css/main.css',
    'css/admin.css',
    'css/layout.css',
    'css/base/reset.css',
    'css/base/variables.css',

    // Component CSS (all components used in the app)
    'css/components/material.css',
    'css/components/buttons.css',
    'css/components/cards.css',
    'css/components/bottom-nav.css',
    'css/components/bottom-sheet.css',
    'css/components/contractor-details.css',
    'css/components/dashboard.css',
    'css/components/forms.css',
    'css/components/map.css',
    'css/components/modals.css',
    'css/components/notifications.css',
    'css/components/ratings.css',
    'css/components/stats-cards.css',
    'css/components/tables.css',
    'css/components/tabs.css',
    'css/components/utilities.css',
    'css/components/auth.css',
    'css/components/profile.css',
    'css/components/categories.css',
    'css/components/feedback.css',
    'css/components/search.css',

    // Core JavaScript (entry points)
    'js/script.js',
    'js/admin.js',
    'js/config/supabase-credentials.js',

    // Data Layer (essential for offline data)
    'js/data/defaultData.js',
    'js/data/defaultCategories.js',
    'js/data/defaultContractors.js',
    'js/data/defaultLocations.js',
    'js/data/defaultReviews.js',
    'js/data/types/index.js',
    'js/data/types/categoryTypes.js',
    'js/data/types/contractorTypes.js',
    'js/data/types/recommendationTypes.js',
    'js/data/types/feedbackTypes.js',
    'js/data/types/locationTypes.js',
    'js/data/types/uuidTypes.js',

    // Core Modules (all data and utility modules)
    'js/modules/data.js',
    'js/modules/storage.js',
    'js/modules/contractorManager.js',
    'js/modules/recommendationDataManager.js',
    'js/modules/categories.js',
    'js/modules/favoritesDataManager.js',
    'js/modules/statsDataManager.js',
    'js/modules/feedbackDataManager.js',
    'js/modules/supabase.js',
    'js/modules/utilities.js',
    'js/modules/notifications.js',
    'js/modules/validation.js',
    'js/modules/confirmationModal.js',
    'js/modules/tabs.js',
    'js/modules/geocodingService.js',
    'js/modules/areaAutocomplete.js',
    'js/modules/backButtonManager.js',
    'js/modules/service-worker-manager.js',
    'js/modules/pwa-install-manager.js',
    'js/modules/loadingScreen.js',

    // Admin Modules (complete admin functionality)
    'js/admin/admin-app.js',
    'js/admin/admin-dashboard.js',
    'js/admin/admin-auth.js',
    'js/admin/shared/base-modal.js',
    
    // Admin Feature Modules
    'js/admin/categories/admin-categories.js',
    'js/admin/categories/categories-table-manager.js',
    'js/admin/categories/categories-modal.js',
    
    'js/admin/contractors/admin-contractors.js',
    'js/admin/contractors/contractors-table-manager.js',
    'js/admin/contractors/contractor-modal.js',
    
    'js/admin/recommendations/admin-recommendations.js',
    'js/admin/recommendations/recommendations-table-manager.js',
    'js/admin/recommendations/recommendation-modal.js',
    
    'js/admin/feedback/admin-feedback.js',
    'js/admin/feedback/feedback-table-manager.js',
    'js/admin/feedback/feedback-modal.js',

    // App Core (main application logic)
    'js/app/main.js',
    'js/app/statsManager.js',
    'js/app/lazyLoader.js',

    // View System (all views for complete navigation)
    'js/app/views/BaseView.js',
    'js/app/views/CategoriesView.js',
    'js/app/views/ContractorListView.js',
    'js/app/views/MapView.js',
    'js/app/views/ContractorView.js',
    'js/app/views/ContractorEditView.js',
    'js/app/views/RecommendationEditView.js',
    'js/app/views/FeedbackView.js',
    'js/app/views/SearchView.js',
    'js/app/views/ProfileView.js',

    // View Utilities
    'js/app/utils/viewHelpers.js',

    // Manifest and Icons (PWA requirements)
    'manifest.json',
    'icons/icon-72x72.png',
    'icons/icon-96x96.png',
    'icons/icon-128x128.png',
    'icons/icon-144x144.png',
    'icons/icon-152x152.png',
    'js/app/views/ProfileView.js',
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
                return cache.addAll(CORE_ASSETS);
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

// Fetch event - Simplified strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Only handle our app resources
    if (!isOurAppResource(request)) return;

    // Route to appropriate strategy
    if (url.pathname.endsWith('.html') || url.pathname === '/') {
        event.respondWith(handleHtml(request));
    } else if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
        event.respondWith(handleApi(request));
    } else if (url.pathname.match(/\.(js|css|json)$/)) {
        event.respondWith(handleStaticAssets(request));
    } else if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$/)) {
        event.respondWith(handleMediaAssets(request));
    } else {
        event.respondWith(handleDefault(request));
    }
});

// Resource classification
function isOurAppResource(request) {
    const url = new URL(request.url);

    // Our app resources
    const isOurAppPath = url.pathname.includes('/community-trade-network/') ||
        url.pathname === '/community-trade-network/' ||
        url.pathname.startsWith('/community-trade-network/') ||
        url.pathname === '/' ||
        url.pathname.startsWith('/css/') ||
        url.pathname.startsWith('/js/') ||
        url.pathname.startsWith('/icons/') ||
        url.pathname === '/index.html' ||
        url.pathname === '/admin.html' ||
        url.pathname === '/manifest.json';

    // External CDNs we don't handle
    const externalCDNs = [
        'fonts.googleapis.com',
        'fonts.gstatic.com',
        'cdnjs.cloudflare.com',
        'unpkg.com',
        'cdn.jsdelivr.net',
        'tevbkmzzwoliozhkcyyb.supabase.co'
    ];

    const isExternalCDN = externalCDNs.some(cdn => url.hostname.includes(cdn));

    return isOurAppPath && !isExternalCDN;
}

// Strategy: Cache First for HTML (fast loading)
async function handleHtml(request) {
    const cached = await caches.match(request);
    
    if (cached) {
        // Update cache in background if stale
        if (!(await isCachedResponseFresh(cached, CACHE_CONFIG.HTML_MAX_AGE))) {
            updateCacheInBackground(request);
        }
        return cached;
    }

    // Not in cache - get from network
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        return new Response('Offline - Please check your connection', {
            status: 503,
            headers: { 'Content-Type': 'text/html' }
        });
    }
}

// Strategy: Network First for API calls
async function handleApi(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            // Cache successful API responses
            const cache = await caches.open(API_CACHE_NAME);
            await cache.put(request, addCacheTimestamp(networkResponse.clone()));
            return networkResponse;
        }
        throw new Error('Network response not ok');
    } catch (error) {
        // Fall back to cache
        const cached = await caches.match(request);
        if (cached) {
            const isFresh = await isCachedResponseFresh(cached, CACHE_CONFIG.API_MAX_AGE);
            if (isFresh) return cached;
        }
        
        // No fresh cached data
        return new Response(
            JSON.stringify({ error: 'Offline - No cached data available' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

// Strategy: Cache First for static assets
async function handleStaticAssets(request) {
    const cached = await caches.match(request);
    
    if (cached) {
        // Update in background
        updateCacheInBackground(request);
        return cached;
    }

    // Not in cache - get from network
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        return new Response('Resource not available', { status: 404 });
    }
}

// Strategy: Cache First for media assets
async function handleMediaAssets(request) {
    const cached = await caches.match(request);
    
    if (cached) {
        const isFresh = await isCachedResponseFresh(cached, CACHE_CONFIG.STATIC_MAX_AGE);
        if (!isFresh) {
            updateCacheInBackground(request);
        }
        return cached;
    }

    // Not in cache - get from network
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, addCacheTimestamp(networkResponse.clone()));
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

// Default strategy: Network First
async function handleDefault(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) return cached;
        
        return new Response('Resource not available offline', { status: 503 });
    }
}

// Cache freshness utilities
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
    if (!timestampHeader) return false;

    const cacheTime = parseInt(timestampHeader);
    const age = Date.now() - cacheTime;

    return age < maxAge;
}

// Background cache updates
async function updateCacheInBackground(request) {
    if (!self.navigator.onLine) return;

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, addCacheTimestamp(networkResponse.clone()));
        }
    } catch (error) {
        // Silent fail
    }
}

// Activate event - Cleanup old caches
self.addEventListener('activate', (event) => {
    console.log('🔄 Service Worker activating...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheName.startsWith('community-trade-network')) {
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

// Message handling for client communication
self.addEventListener('message', (event) => {
    const { data } = event;

    switch (data.type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
        case 'CLEAR_CACHE':
            clearCache(data.cacheName);
            break;
        case 'GET_CACHE_INFO':
            sendCacheInfo(event);
            break;
    }
});

async function clearCache(cacheName) {
    const deleted = await caches.delete(cacheName);
    console.log(`🗑️ Cache ${cacheName} deleted: ${deleted}`);
}

async function sendCacheInfo(event) {
    const cacheNames = await caches.keys();
    const cacheInfo = {};

    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        cacheInfo[cacheName] = requests.length;
    }

    event.ports[0].postMessage(cacheInfo);
}

// Push notifications (simplified)
self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'Community Trade Network', {
            body: data.body || 'New update available',
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            data: { url: data.url || '/' }
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'view' || !event.action) {
        event.waitUntil(
            clients.openWindow(event.notification.data.url)
        );
    }
});