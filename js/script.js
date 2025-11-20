// js/script.js - ES6 MODULE ENTRY POINT
import { DataModule } from './modules/data.js';
import { ContractorReviewApp } from './app/main.js';
import { ServiceWorkerManager } from './modules/service-worker-manager.js';
import { pwaInstallManager } from './modules/pwa-install-manager.js';
import { debounce } from './modules/utilities.js';
import { showError } from './modules/notifications.js';
import { generateUUID } from './modules/uuid.js';

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

    } catch (error) {
        console.error('Failed to initialize application:', error);
        showError('Error loading application. Please refresh the page.');
    }
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