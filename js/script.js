// js/script.js - ENTRY POINT
let app;

async function initializeApp() {
    try {
        // Create managers
        const uiManager = new UIManager();
        const modalManager = new ModalManager();
        const filterManager = new FilterManager();
        const formManager = new FormManager();

        // Create main app
        app = new ContractorReviewApp(uiManager, modalManager, filterManager, formManager);
        
        // Initialize
        await app.init();
        
        // Make available globally for HTML onclick handlers
        window.app = app;
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        
        // Fallback: try again after DOM is loaded
        document.addEventListener('DOMContentLoaded', initializeApp);
    }
}

// Start the app
if (typeof dataModule !== 'undefined') {
    initializeApp();
} else {
    document.addEventListener('DOMContentLoaded', initializeApp);
}