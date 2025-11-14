// js/script.js - ENTRY POINT
let app;

async function initializeApp() {
    try {
        console.log('Starting app initialization...');
        
        // Check if required modules are available
        if (typeof UIManager === 'undefined' || typeof ModalManager === 'undefined' || 
            typeof FilterManager === 'undefined' || typeof FormManager === 'undefined' || 
            typeof MapManager === 'undefined' || typeof ContractorReviewApp === 'undefined') {
            console.warn('Some modules not loaded yet, waiting...');
            setTimeout(initializeApp, 100);
            return;
        }

        console.log('All modules loaded, creating managers...');
        
        // Create managers
        const uiManager = new UIManager();
        const modalManager = new ModalManager();
        const filterManager = new FilterManager();
        const formManager = new FormManager();
        const mapManager = new MapManager();

        // Create main app with map manager
        app = new ContractorReviewApp(uiManager, modalManager, filterManager, formManager, mapManager);
        
        // Initialize
        await app.init();
        
        // Make available globally for HTML onclick handlers
        window.app = app;
        
        console.log('Contractor Reviews App initialized successfully with map integration!');
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        
        // Show user-friendly error message
        if (typeof utils !== 'undefined' && utils.showNotification) {
            utils.showNotification('Error loading application. Some features may not work properly.', 'error');
        }
        
        // Fallback: try basic initialization without map
        try {
            console.log('Attempting fallback initialization without map...');
            const uiManager = new UIManager();
            const modalManager = new ModalManager();
            const filterManager = new FilterManager();
            const formManager = new FormManager();
            
            app = new ContractorReviewApp(uiManager, modalManager, filterManager, formManager);
            await app.init();
            window.app = app;
            
            console.log('Fallback initialization successful');
        } catch (fallbackError) {
            console.error('Fallback initialization also failed:', fallbackError);
        }
    }
}

// Simple initialization that waits for everything to load
function startApp() {
    console.log('Starting app initialization process...');
    
    // Wait a bit for all scripts to load, then initialize
    setTimeout(() => {
        if (typeof dataModule !== 'undefined' && 
            typeof UIManager !== 'undefined' && 
            typeof ModalManager !== 'undefined' && 
            typeof FilterManager !== 'undefined' && 
            typeof FormManager !== 'undefined' && 
            typeof MapManager !== 'undefined' && 
            typeof ContractorReviewApp !== 'undefined') {
            
            console.log('All dependencies loaded, initializing app...');
            initializeApp();
        } else {
            console.log('Waiting for dependencies...');
            // Try again in 100ms
            setTimeout(startApp, 100);
        }
    }, 100);
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}

// Global error handler for better user experience
window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    
    // Don't show error notifications for Leaflet loading issues
    if (event.error && event.error.message && event.error.message.includes('Leaflet')) {
        console.warn('Leaflet loading issue detected, continuing without map...');
        return;
    }
    
    if (typeof utils !== 'undefined' && utils.showNotification) {
        utils.showNotification('An unexpected error occurred. Please refresh the page.', 'error');
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Suppress Leaflet-related promise rejections
    if (event.reason && event.reason.toString().includes('Leaflet')) {
        event.preventDefault();
        return;
    }
});

// Make app available globally once initialized
window.getApp = function() {
    return window.app;
};