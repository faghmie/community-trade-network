// js/script.js - SIMPLIFIED: Clean entry point
import { DataModule } from './modules/data.js';
import { ContractorReviewApp } from './app/main.js';
import { ServiceWorkerManager } from './modules/service-worker-manager.js';
import { pwaInstallManager } from './modules/pwa-install-manager.js';
import { showError } from './modules/notifications.js';

class AppInitializer {
    constructor() {
        this.serviceWorkerManager = new ServiceWorkerManager();
    }

    async initialize() {
        try {
            // Initialize core services
            await this.serviceWorkerManager.init();
            
            // Create and initialize main application
            const dataModule = new DataModule();
            const app = new ContractorReviewApp(dataModule);
            await app.init();
            
            // Store app reference
            window.app = app;
            
            // Setup update detection
            this.setupUpdateDetection();
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            showError('Error loading application. Please refresh the page.');
        }
    }

    setupUpdateDetection() {
        if (!('serviceWorker' in navigator)) return;

        navigator.serviceWorker.ready.then(registration => {
            // Listen for new service worker
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this.showUpdateNotification();
                    }
                });
            });

            // Check for waiting service worker
            if (registration.waiting) {
                this.showUpdateNotification();
            }
        });

        // Listen for controller change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            this.showUpdateCompleteNotification();
        });
    }

    showUpdateNotification() {
        if (document.querySelector('.update-notification')) return;

        const notification = document.createElement('div');
        notification.className = 'update-notification material-card';
        notification.innerHTML = `
            <div class="update-notification-content">
                <div class="update-notification-text">
                    <strong>New version available!</strong>
                    <span>Refresh to get the latest features.</span>
                </div>
                <div class="update-notification-actions">
                    <button class="material-button contained" id="reload-app">Update Now</button>
                    <button class="material-button text" id="dismiss-update">Later</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);

        // Event handlers
        notification.querySelector('#reload-app').addEventListener('click', () => {
            this.reloadApp();
            notification.remove();
        });

        notification.querySelector('#dismiss-update').addEventListener('click', () => {
            notification.remove();
        });

        // Auto-hide after 30 seconds
        setTimeout(() => notification.remove(), 30000);
    }

    showUpdateCompleteNotification() {
        const notification = document.createElement('div');
        notification.className = 'update-notification update-complete material-card';
        notification.innerHTML = `
            <div class="update-notification-content">
                <div class="update-notification-text">
                    <strong>Update complete!</strong>
                    <span>You're now using the latest version.</span>
                </div>
                <button class="material-button text" id="close-update">Close</button>
            </div>
        `;
        
        document.body.appendChild(notification);

        notification.querySelector('#close-update').addEventListener('click', () => {
            notification.remove();
        });

        // Auto-hide after 5 seconds
        setTimeout(() => notification.remove(), 5000);
    }

    reloadApp() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                if (registration.waiting) {
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
            });
        }
        window.location.reload();
    }
}

// Create and initialize app
const appInitializer = new AppInitializer();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    appInitializer.initialize();
});

// Export for potential external use
export { appInitializer };