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

// Event delegation system for data-action attributes
function setupEventDelegation() {
    console.log('Setting up event delegation...');

    document.addEventListener('click', function (event) {
        const target = event.target.closest('[data-action]');
        if (!target || !window.app) return;

        const action = target.getAttribute('data-action');
        console.log('Action triggered:', action);

        switch (action) {
            case 'search':
                event.preventDefault();
                window.app.searchContractors();
                break;

            case 'toggle-filters':
                event.preventDefault();
                handleToggleFilters();
                break;

            case 'clear-filters':
                event.preventDefault();
                window.app.clearFilters();
                break;

            case 'show-favorites':
                event.preventDefault();
                window.app.showFavoritesOnly();
                break;

            case 'show-high-rated':
                event.preventDefault();
                window.app.showHighRated();
                break;

            case 'view-favorites':
                event.preventDefault();
                window.app.showFavoritesSection();
                break;

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
                
            // Map view toggle actions
            case 'view-map':
                event.preventDefault();
                window.app.showMapView();
                break;
                
            case 'view-list':
                event.preventDefault();
                window.app.showListView();
                break;
        }
    });

    document.addEventListener('change', function (event) {
        const target = event.target;
        if (!target.hasAttribute('data-action') || !window.app) return;

        const action = target.getAttribute('data-action');

        switch (action) {
            case 'filter':
                window.app.filterContractors();
                break;

            case 'sort':
                window.app.sortContractors();
                break;

            case 'import-favorites-file':
                if (target.files && target.files[0]) {
                    window.app.handleFavoritesImport(target.files[0]);
                    target.value = ''; // Reset file input
                }
                break;
        }
    });

    document.addEventListener('keypress', function (event) {
        const target = event.target;
        if (!target.hasAttribute('data-action') || !window.app) return;

        const action = target.getAttribute('data-action');

        if (action === 'search-keypress' && event.key === 'Enter') {
            event.preventDefault();
            window.app.searchContractors();
        }
    });

    console.log('Event delegation setup complete');
}

// Toggle filters function
function handleToggleFilters() {
    const toggleBtn = document.getElementById('toggleFiltersBtn');
    const advancedFilters = document.getElementById('advancedFilters');

    if (!toggleBtn || !advancedFilters) return;

    const isHidden = advancedFilters.classList.contains('hidden');

    if (isHidden) {
        advancedFilters.classList.remove('hidden');
        toggleBtn.innerHTML = '<i class="material-icons">filter_list</i><span>Less Filters</span>';
        toggleBtn.classList.add('active');
    } else {
        advancedFilters.classList.add('hidden');
        toggleBtn.innerHTML = '<i class="material-icons">filter_list</i><span>More Filters</span>';
        toggleBtn.classList.remove('active');
    }
}

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