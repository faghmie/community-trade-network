// js/data/dataLoader.js
// Loader script to bridge ES6 modules to global scope for existing scripts

(function() {
    // Create a promise that resolves when data is loaded
    window.dataReady = new Promise((resolve) => {
        if (window.defaultContractors) {
            console.log('✅ Default data already available');
            resolve();
        } else {
            console.log('⏳ Waiting for default data to load...');
            window.addEventListener('defaultDataLoaded', () => {
                console.log('✅ Default data loaded successfully via ES6 modules');
                resolve();
            });
            
            // Fallback: check every 100ms for data
            const checkInterval = setInterval(() => {
                if (window.defaultContractors) {
                    clearInterval(checkInterval);
                    console.log('✅ Default data available via polling');
                    resolve();
                }
            }, 100);
            
            // Timeout after 5 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                if (!window.defaultContractors) {
                    console.warn('⚠️ Data loading timeout - some features may not work');
                }
                resolve();
            }, 5000);
        }
    });

    // Load the data
    (async function() {
        try {
            // Import the aggregated default data
            const { defaultData } = await import('./defaultData.js');
            
            // Make data available globally for existing scripts
            window.defaultCategories = defaultData.categories;
            window.defaultContractors = defaultData.contractors;
            window.defaultReviews = defaultData.reviews;
            window.southAfricanProvinces = defaultData.locations.provinces;
            window.southAfricanCityCoordinates = defaultData.locations.cityCoordinates;
            
            console.log('✅ Default data loaded successfully via ES6 modules');
            
            // Dispatch event to notify that data is ready
            window.dispatchEvent(new CustomEvent('defaultDataLoaded'));
            
        } catch (error) {
            console.error('❌ Failed to load default data:', error);
            // Still resolve the promise so the app can continue
            window.dispatchEvent(new CustomEvent('defaultDataLoaded'));
        }
    })();
})();