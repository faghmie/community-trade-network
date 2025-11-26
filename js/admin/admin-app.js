/**
 * Admin Portal Main Application
 * Pure module coordinator - handles authentication and module initialization
 */

import AdminAuthModule from './admin-auth.js';
import AdminDashboard from './admin-dashboard.js';
import { DataModule } from '../modules/data.js';
import { CategoriesModule } from '../modules/categories.js';
import AdminCategoriesModule from './categories/admin-categories.js';
import AdminContractorsModule from './contractors/admin-contractors.js';
import AdminRecommendationsModule from './recommendations/admin-recommendations.js';
import AdminFeedbackModule from './feedback/admin-feedback.js'; // FIX: Updated import name
import { showNotification, showError } from '../modules/notifications.js';

class AdminModule {
    constructor() {
        this.authModule = null;
        this.dashboard = null;
        this.modulesInitialized = false;
        this.adminContractorsModule = null;
        this.adminCategoriesModule = null;
        this.adminRecommendationsModule = null;
        this.adminFeedbackModule = null; // FIX: Updated variable name
        this.dataModule = null;
        this.categoriesModule = null;
    }

    async init() {
        try {
            // Initialize core modules first
            await this.initializeCoreModules();

            // Initialize authentication module
            this.authModule = new AdminAuthModule();
            await this.authModule.init(this);

        } catch (error) {
            console.error('Error initializing admin module:', error);
            showError('Failed to initialize admin portal');
            throw error;
        }
    }

    async initializeCoreModules() {
        this.dataModule = new DataModule();
        await this.dataModule.init();

        this.categoriesModule = new CategoriesModule(this.dataModule);
        const storage = this.dataModule.getStorage();
        await this.categoriesModule.init(storage, this.dataModule);
    }

    async showAdminContent() {
        const loginSection = document.getElementById('loginSection');
        const adminContent = document.getElementById('adminContent');
        
        if (loginSection) loginSection.style.display = 'none';
        if (adminContent) adminContent.style.display = 'block';

        this.authModule.updateUserInfo();

        if (!this.modulesInitialized) {
            await this.initializeAdminModules();
            this.modulesInitialized = true;
        }

        this.bindGlobalEvents();
        this.dashboard.show();
    }

    async initializeAdminModules() {
        try {
            // Create module instances with dependency injection
            this.adminCategoriesModule = new AdminCategoriesModule(this.dataModule);
            this.adminContractorsModule = new AdminContractorsModule(
                this.dataModule,
                this.categoriesModule,
                this.getLocationData()
            );
            this.adminRecommendationsModule = new AdminRecommendationsModule(this.dataModule);
            
            // FIX: Pass dataModule like other modules, not feedbackDataManager
            this.adminFeedbackModule = new AdminFeedbackModule(this.dataModule);

            // Initialize dashboard with all modules
            this.dashboard = new AdminDashboard(this.dataModule);
            await this.dashboard.init({
                contractors: this.adminContractorsModule,
                categories: this.adminCategoriesModule,
                recommendations: this.adminRecommendationsModule,
                feedback: this.adminFeedbackModule // FIX: Updated variable name
            });

            // Initialize all admin modules
            await Promise.all([
                this.adminCategoriesModule.init(),
                this.adminContractorsModule.init(),
                this.adminRecommendationsModule.init(),
                this.adminFeedbackModule.init() // FIX: Updated variable name
            ]);

        } catch (error) {
            console.error('Error initializing admin modules:', error);
            showError('Failed to initialize admin modules');
            throw error;
        }
    }

    getLocationData() {
        const locationData = this.dataModule.getLocationsData();
        
        return {
            southAfricanProvinces: locationData || {},
            southAfricanCityCoordinates: window.southAfricanCityCoordinates || {}
        };
    }

    bindGlobalEvents() {
        this.bindTabEvents();
    }

    bindTabEvents() {
        // Listen for tab changes to trigger module refreshes
        document.addEventListener('adminTabChanged', (event) => {
            const { tab } = event.detail;
            
            switch (tab) {
                case 'contractors':
                    this.adminContractorsModule?.refresh();
                    break;
                case 'categories':
                    this.adminCategoriesModule?.refresh();
                    break;
                case 'recommendations':
                    this.adminRecommendationsModule?.refresh();
                    break;
                case 'feedback':
                    this.adminFeedbackModule?.refresh(); // FIX: Updated variable name
                    break;
            }
        });
    }

    // Global method to refresh dashboard stats
    refreshDashboard() {
        if (this.dashboard) {
            this.dashboard.refreshStats();
        }
    }

    // New method to handle data refresh across all modules
    async refreshAllData() {
        try {
            await this.dataModule.refresh();
            
            // Refresh all modules
            if (this.adminContractorsModule) this.adminContractorsModule.refresh();
            if (this.adminCategoriesModule) this.adminCategoriesModule.refresh();
            if (this.adminRecommendationsModule) this.adminRecommendationsModule.refresh();
            if (this.adminFeedbackModule) this.adminFeedbackModule.refresh(); // FIX: Updated variable name
            
            if (this.dashboard) this.dashboard.refreshStats();
            
            showNotification('All data refreshed successfully', 'success');
        } catch (error) {
            console.error('Error refreshing all data:', error);
            showError('Error refreshing data');
        }
    }

    // Method to check if all modules are initialized
    areModulesInitialized() {
        return this.modulesInitialized;
    }

    // Method to get module references (for debugging and advanced usage)
    getModule(moduleName) {
        const modules = {
            contractors: this.adminContractorsModule,
            categories: this.adminCategoriesModule,
            recommendations: this.adminRecommendationsModule,
            feedback: this.adminFeedbackModule, // FIX: Updated variable name
            auth: this.authModule,
            dashboard: this.dashboard
        };
        
        return modules[moduleName] || null;
    }
}

// Create and initialize admin module
document.addEventListener('DOMContentLoaded', async function () {
    const adminModule = new AdminModule();
    
    try {
        await adminModule.init();
        
        // Store reference for debugging only (not for HTML onclick handlers)
        // Use a simple check for development mode instead of process.env
        const isDevelopment = window.location.hostname === 'localhost' || 
                            window.location.hostname === '127.0.0.1' ||
                            window.location.protocol === 'file:';
        
        if (isDevelopment) {
            window.__adminModule = adminModule;
            console.log('🔧 Admin module available for debugging: window.__adminModule');
        }
    } catch (error) {
        console.error('Failed to initialize admin module:', error);
        showError('Failed to initialize admin portal. Please refresh the page.');
    }
});

export default AdminModule;