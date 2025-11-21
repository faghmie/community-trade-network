// js/script.js - ES6 MODULE ENTRY POINT
import { DataModule } from './modules/data.js';
import { ContractorReviewApp } from './app/main.js';
import { ServiceWorkerManager } from './modules/service-worker-manager.js';
import { pwaInstallManager } from './modules/pwa-install-manager.js';
import { showError } from './modules/notifications.js';

// Initialize Service Worker Manager
const serviceWorkerManager = new ServiceWorkerManager();

async function initializeApp() {
    try {
        // Initialize service worker manager
        await serviceWorkerManager.init();

        // PWA Install Manager is already initialized (singleton)

        // Create data module instance
        const dataModule = new DataModule();

        // Create main app
        const app = new ContractorReviewApp(dataModule);

        // Initialize the main app
        await app.init();

        // Store app reference for global access if needed
        window.app = app;

        // Set up service worker update detection
        setupServiceWorkerUpdateDetection();

    } catch (error) {
        console.error('Failed to initialize application:', error);
        showError('Error loading application. Please refresh the page.');
    }
}

// Service Worker Update Detection
function setupServiceWorkerUpdateDetection() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            // Listen for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('🔄 New service worker found, updating...');
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New content is available, show update notification
                        console.log('✅ New version available, showing update notification');
                        showUpdateNotification();
                    }
                });
            });

            // Check if there's already a waiting service worker
            if (registration.waiting) {
                console.log('📦 Update already waiting, showing notification');
                showUpdateNotification();
            }
        });

        // Check for updates periodically (every 2 hours)
        setInterval(() => {
            navigator.serviceWorker.ready.then(registration => {
                registration.update();
            });
        }, 2 * 60 * 60 * 1000); // 2 hours

        // Listen for controller change (update applied)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('🎯 Service worker updated, page will refresh');
            // Optionally show a "Update complete" message
            showUpdateCompleteNotification();
        });
    }
}

// Function to show update notification
function showUpdateNotification() {
    // Check if notification already exists
    if (document.querySelector('.update-notification')) {
        return;
    }

    const notification = document.createElement('div');
    notification.className = 'update-notification material-card';
    notification.innerHTML = `
        <div class="update-notification-content">
            <div class="update-notification-text">
                <strong>New version available!</strong>
                <span>Refresh to get the latest features and improvements.</span>
            </div>
            <div class="update-notification-actions">
                <button id="reload-app" class="material-button contained" data-action="refresh-app">
                    Update Now
                </button>
                <button id="dismiss-update" class="material-button text">
                    Later
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);

    // Add event listeners
    document.getElementById('reload-app').addEventListener('click', () => {
        // Skip waiting and reload
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                if (registration.waiting) {
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
            });
        }
        window.location.reload();
    });

    document.getElementById('dismiss-update').addEventListener('click', () => {
        notification.remove();
    });
    
    // Auto-hide after 30 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 30000);
}

// Function to show update complete notification
function showUpdateCompleteNotification() {
    const notification = document.createElement('div');
    notification.className = 'update-notification update-complete material-card';
    notification.innerHTML = `
        <div class="update-notification-content">
            <div class="update-notification-text">
                <strong>Update complete!</strong>
                <span>You're now using the latest version.</span>
            </div>
            <button id="close-update-complete" class="material-button text">
                Close
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);

    document.getElementById('close-update-complete').addEventListener('click', () => {
        notification.remove();
    });
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Event delegation for global actions
function setupEventDelegation() {
    document.addEventListener('click', (event) => {
        const target = event.target.closest('[data-action]');
        if (!target) return;

        const action = target.getAttribute('data-action');
        
        switch (action) {
            case 'check-for-updates':
                event.preventDefault();
                serviceWorkerManager.checkForUpdates();
                break;

            case 'refresh-app':
                event.preventDefault();
                serviceWorkerManager.refreshApp();
                break;

            case 'install-pwa':
                event.preventDefault();
                pwaInstallManager.installApp();
                break;

            case 'debug-pwa':
                event.preventDefault();
                pwaInstallManager.debugShowBanner();
                break;

            case 'export-favorites':
                event.preventDefault();
                if (window.app?.favoritesManager) {
                    window.app.favoritesManager.downloadFavorites();
                }
                break;

            case 'import-favorites':
                event.preventDefault();
                document.getElementById('importFavorites')?.click();
                break;

            case 'export-data':
                event.preventDefault();
                window.app?.exportData();
                break;

            case 'clear-all-favorites':
                event.preventDefault();
                if (window.app?.favoritesManager) {
                    window.app.favoritesManager.clearFavorites();
                }
                break;

            // NEW: Handle feedback button click
            case 'show-feedback':
                event.preventDefault();
                if (window.app?.showFeedbackForm) {
                    window.app.showFeedbackForm({
                        page: 'main',
                        feature: 'bottom-navigation'
                    });
                } else {
                    console.warn('Feedback system not available');
                }
                break;
        }
    });

    document.addEventListener('change', (event) => {
        const target = event.target;
        if (!target.hasAttribute('data-action')) return;

        const action = target.getAttribute('data-action');

        if (action === 'import-favorites-file' && target.files?.[0]) {
            window.app?.handleFavoritesImport(target.files[0]);
            target.value = '';
        }
    });
}

// Initialize event delegation after app loads
function initEventDelegation() {
    setTimeout(() => {
        setupEventDelegation();
    }, 1000);
}

// Export the main initialization function
export { initializeApp, initEventDelegation, serviceWorkerManager, pwaInstallManager };

// Auto-initialize when module is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApp().then(() => {
        initEventDelegation();
    });
});