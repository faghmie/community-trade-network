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
        // FIXED: Changed === 'undefined' to !== 'undefined' for ContractorReviewApp
        if (typeof dataModule !== 'undefined' && 
            typeof UIManager !== 'undefined' && 
            typeof ModalManager !== 'undefined' && 
            typeof FilterManager !== 'undefined' && 
            typeof FormManager !== 'undefined' && 
            typeof MapManager !== 'undefined' && 
            typeof ContractorReviewApp !== 'undefined') { // FIXED THIS LINE
            
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

// NEW: Event delegation system for data-action attributes
function setupEventDelegation() {
    console.log('Setting up event delegation...');
    
    // Handle click events
    document.addEventListener('click', function(event) {
        const target = event.target.closest('[data-action]');
        if (!target || !window.app) return;
        
        const action = target.getAttribute('data-action');
        console.log('Action triggered:', action);
        
        switch(action) {
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
                
            case 'reset-default':
                event.preventDefault();
                window.app.resetToDefault();
                break;
                
            case 'view-favorites':
                event.preventDefault();
                if (typeof dataModule !== 'undefined') {
                    dataModule.showFavoritesSection();
                }
                break;
                
            case 'export-favorites':
                event.preventDefault();
                if (typeof dataModule !== 'undefined') {
                    dataModule.downloadFavorites();
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
        }
    });
    
    // Handle change events for filters and sort
    document.addEventListener('change', function(event) {
        const target = event.target;
        if (!target.hasAttribute('data-action') || !window.app) return;
        
        const action = target.getAttribute('data-action');
        console.log('Change action triggered:', action);
        
        switch(action) {
            case 'filter':
                window.app.filterContractors();
                break;
                
            case 'sort':
                window.app.sortContractors();
                break;
        }
    });
    
    // Handle keypress events for search
    document.addEventListener('keypress', function(event) {
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

// NEW: Single, reliable toggle function
function handleToggleFilters() {
    const toggleBtn = document.getElementById('toggleFiltersBtn');
    const advancedFilters = document.getElementById('advancedFilters');
    
    if (!toggleBtn || !advancedFilters) {
        console.error('Toggle elements not found');
        return;
    }
    
    const isHidden = advancedFilters.classList.contains('hidden');
    console.log('Toggling filters. Currently hidden:', isHidden);
    
    if (isHidden) {
        // Show advanced filters
        advancedFilters.classList.remove('hidden');
        toggleBtn.innerHTML = '<i class="fas fa-sliders-h"></i> Less Filters';
        toggleBtn.classList.add('active');
        console.log('Advanced filters shown');
    } else {
        // Hide advanced filters
        advancedFilters.classList.add('hidden');
        toggleBtn.innerHTML = '<i class="fas fa-sliders-h"></i> More Filters';
        toggleBtn.classList.remove('active');
        console.log('Advanced filters hidden');
    }
}

// Compact filters debug and initialization
function initializeCompactFilters() {
    console.log('Initializing compact filters...');
    
    const toggleBtn = document.getElementById('toggleFiltersBtn');
    const advancedFilters = document.getElementById('advancedFilters');
    
    if (!toggleBtn) {
        console.error('Toggle button not found!');
        return;
    }
    
    if (!advancedFilters) {
        console.error('Advanced filters container not found!');
        return;
    }
    
    console.log('Compact filter elements found successfully');
    
    // Remove any existing event listeners to prevent duplicates
    const newToggleBtn = toggleBtn.cloneNode(true);
    toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
    
    console.log('Toggle button reset to prevent duplicate listeners');
}

// Initialize compact filters after app loads
setTimeout(() => {
    if (document.readyState === 'complete') {
        initializeCompactFilters();
        setupEventDelegation();
    } else {
        document.addEventListener('DOMContentLoaded', function() {
            initializeCompactFilters();
            setupEventDelegation();
        });
    }
}, 1000);

// Debug function to check current state
window.debugFilters = function() {
    console.log('=== FILTERS DEBUG ===');
    
    const elements = {
        toggleBtn: document.getElementById('toggleFiltersBtn'),
        advancedFilters: document.getElementById('advancedFilters'),
        compactBar: document.querySelector('.compact-filter-bar'),
        searchInput: document.getElementById('searchInput'),
        clearBtn: document.querySelector('[data-action="clear-filters"]')
    };
    
    Object.entries(elements).forEach(([name, element]) => {
        console.log(`${name}:`, element ? 'FOUND' : 'NOT FOUND');
        if (element) {
            console.log(`  - classes:`, element.className);
            console.log(`  - hidden:`, element.classList.contains('hidden'));
            console.log(`  - styles:`, {
                display: window.getComputedStyle(element).display,
                visibility: window.getComputedStyle(element).visibility
            });
        }
    });
    
    // Check if app methods are available
    console.log('App methods:', {
        toggleAdvancedFilters: typeof app?.toggleAdvancedFilters,
        clearFilters: typeof app?.clearFilters,
        filterManager: typeof app?.filterManager
    });
};

// Run debug after page loads
setTimeout(() => {
    debugFilters();
    console.log('Compact filters debug completed');
}, 2000);