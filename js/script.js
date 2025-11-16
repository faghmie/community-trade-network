// js/app/script.js - ES6 MODULE ENTRY POINT
let app;

async function initializeApp() {
    try {
        console.log('🚀 Starting Contractor Reviews App...');
        
        // Wait for default data to be loaded first
        console.log('⏳ Waiting for default data to load...');
        await window.dataReady;
        
        console.log('✅ Default data loaded, initializing data module...');
        
        // Initialize data module first (this initializes all sub-managers)
        await dataModule.init();
        
        console.log('✅ Data module initialized, creating managers...');
        
        // Create card manager with proper dependency injection
        const cardManager = new CardManager(dataModule, reviewManager, favoritesManager);
        
        // Create UI manager with card manager dependency
        const uiManager = new UIManager(cardManager);
        const modalManager = new ModalManager();
        const filterManager = new FilterManager();
        const formManager = new FormManager();
        const mapManager = new MapManager();

        // Create main app with all managers
        app = new ContractorReviewApp(uiManager, modalManager, filterManager, formManager, mapManager);
        
        // Set uiManager in dataModule for favorites
        dataModule.setUIManager(uiManager);
        
        // Initialize the main app
        await app.init();
        
        // Make available globally for HTML onclick handlers
        window.app = app;
        window.cardManager = cardManager;
        
        console.log('🎉 Contractor Reviews App initialized successfully!');
        console.log('📊 App status:', app.getAppStatus());
        
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
                
            case 'view-favorites':
                event.preventDefault();
                dataModule.showFavoritesSection();
                break;
                
            case 'export-favorites':
                event.preventDefault();
                dataModule.downloadFavorites();
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
    
    document.addEventListener('change', function(event) {
        const target = event.target;
        if (!target.hasAttribute('data-action') || !window.app) return;
        
        const action = target.getAttribute('data-action');
        
        switch(action) {
            case 'filter':
                window.app.filterContractors();
                break;
                
            case 'sort':
                window.app.sortContractors();
                break;
        }
    });
    
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

// Global functions for favorites (exported for use in HTML)
window.toggleFavorite = (contractorId) => {
    const isNowFavorite = dataModule.toggleFavorite(contractorId);
    const contractor = dataModule.getContractor(contractorId);
    
    if (contractor) {
        const message = isNowFavorite ? 
            `Added ${contractor.name} to favorites! 💖` : 
            `Removed ${contractor.name} from favorites.`;
        utils.showNotification(message, isNowFavorite ? 'success' : 'info');
    }
};

window.handleFavoritesImport = async (file) => {
    const text = await file.text();
    const success = dataModule.importFavorites(text);
    
    if (success) {
        utils.showNotification('Favorites imported successfully! 🎉', 'success');
    } else {
        utils.showNotification('Failed to import favorites. Invalid file format.', 'error');
    }
};

window.showFavoritesSection = () => {
    const favoritesSection = document.getElementById('favoritesSection');
    favoritesSection.classList.remove('hidden');
    favoritesSection.scrollIntoView({ behavior: 'smooth' });
};

window.getApp = () => window.app;

// Export the main initialization function
export { initializeApp, initEventDelegation };

// Auto-initialize when module is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApp().then(() => {
        initEventDelegation();
    });
});