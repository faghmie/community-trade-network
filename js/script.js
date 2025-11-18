// js/script.js - ES6 MODULE ENTRY POINT (CLEAN ENTRY POINT)
import { DataModule } from './modules/data.js';
import { ContractorReviewApp } from './app/main.js';

// Import utility modules
import { debounce } from './modules/utilities.js';
import { showNotification } from './modules/notifications.js';
import { generateUUID } from './modules/uuid.js';

// Create a utils object with the imported functions for compatibility
const utils = {
    debounce,
    showNotification,
    generateId: generateUUID,
    showSuccess: (message) => showNotification(message, 'success'),
    showError: (message) => showNotification(message, 'error'),
    showWarning: (message) => showNotification(message, 'warning'),
    showInfo: (message) => showNotification(message, 'info')
};

// Make utils globally available for legacy code
window.utils = utils;

async function initializeApp() {
    try {
        console.log('🚀 Starting Contractor Reviews App...');

        console.log('✅ Creating data module...');

        // Create data module instance - it now handles all data loading internally
        const dataModule = new DataModule();

        console.log('✅ Data module created, creating main app...');

        // Create main app - it handles all manager creation internally
        const app = new ContractorReviewApp(dataModule);

        // Initialize the main app
        await app.init();

        console.log('🎉 Contractor Reviews App initialized successfully!');

    } catch (error) {
        console.error('❌ Failed to initialize application:', error);

        // Show user-friendly error message
        if (utils && utils.showNotification) {
            utils.showNotification('Error loading application. Please refresh the page.', 'error');
        }
    }
}

// SIMPLIFIED event delegation - only handle actions not managed by FilterManager
function setupEventDelegation() {
    console.log('Setting up minimal event delegation...');

    document.addEventListener('click', function (event) {
        const target = event.target.closest('[data-action]');
        if (!target || !window.app) return;

        const action = target.getAttribute('data-action');
        
        // Only log actions that we're actually handling in this delegation
        const handledActions = ['export-favorites', 'import-favorites', 'export-data', 'clear-all-favorites'];
        if (handledActions.includes(action)) {
            console.log('Global action triggered:', action);
        }

        // Only handle actions that aren't managed by FilterManager
        switch (action) {
            case 'export-favorites':
                event.preventDefault();
                if (window.app.favoritesManager) {
                    window.app.favoritesManager.downloadFavorites();
                }
                break;

            case 'import-favorites':
                event.preventDefault();
                document.getElementById('importFavorites').click();
                break;

            case 'export-data':
                event.preventDefault();
                window.app.exportData();
                break;

            case 'clear-all-favorites':
                event.preventDefault();
                if (window.app.favoritesManager) {
                    window.app.favoritesManager.clearFavorites();
                }
                break;
                
            // All other actions are handled by FilterManager and UIManager
            default:
                // Let the managers handle it - don't log here
                break;
        }
    });

    document.addEventListener('change', function (event) {
        const target = event.target;
        if (!target.hasAttribute('data-action') || !window.app) return;

        const action = target.getAttribute('data-action');

        switch (action) {
            case 'import-favorites-file':
                if (target.files && target.files[0]) {
                    window.app.handleFavoritesImport(target.files[0]);
                    target.value = ''; // Reset file input
                }
                break;
            // All other change actions are handled by FilterManager
            default:
                // Let FilterManager handle it
                break;
        }
    });

    console.log('Minimal event delegation setup complete');
}

// REMOVED: handleToggleFilters function - now handled by FilterManager

// Initialize event delegation after app loads
function initEventDelegation() {
    setTimeout(() => {
        setupEventDelegation();
    }, 1000);
}

// Export the main initialization function
export { initializeApp, initEventDelegation };

// Auto-initialize when module is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApp().then(() => {
        initEventDelegation();
    });
});