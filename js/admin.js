import AuthManager from './modules/auth.js';
import AdminAuthModule from './modules/admin-auth.js';
import TabsModule from './modules/tabs.js';
import { DataModule } from './modules/data.js';
import { CategoriesModule } from './modules/categories.js';
import AdminCategoriesModule from './modules/admin-categories.js';
import AdminContractorsModule from './modules/admin-contractors.js';
import AdminReviewsModule from './modules/admin-reviews.js';

// Modern Admin Dashboard with Authentication
class AdminModule {
    constructor() {
        this.authModule = null;
        this.modulesInitialized = false;
        this.adminContractorsModule = null;
        this.adminCategoriesModule = null;
        this.adminReviewsModule = null;
        this.tabsModule = null;
        this.dataModule = null;
        this.categoriesModule = null;
    }

    async init() {
        try {
            // Initialize core modules first - DataModule will handle loading screen internally
            await this.initializeCoreModules();

            // Initialize authentication module
            this.authModule = new AdminAuthModule();
            await this.authModule.init(this);

        } catch (error) {
            console.error('Error initializing admin module:', error);
        }
    }

    async initializeCoreModules() {
        // Initialize data module with admin context
        this.dataModule = new DataModule();
        await this.dataModule.init(); // DataModule handles loading screen internally

        // Initialize categories module with storage from dataModule
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

        // Initialize admin modules after authentication
        if (!this.modulesInitialized) {
            await this.initializeAdminModules();
            this.modulesInitialized = true;
        }

        this.bindEvents();
        this.renderDashboard();
    }

    async initializeAdminModules() {
        try {
            // Create instances with dependency injection
            this.adminCategoriesModule = new AdminCategoriesModule(this.dataModule);
            this.adminContractorsModule = new AdminContractorsModule(
                this.dataModule,
                this.categoriesModule,
                this.getLocationData()
            );
            this.adminReviewsModule = new AdminReviewsModule(this.dataModule);

            // Initialize tabs module
            this.tabsModule = new TabsModule();
            this.tabsModule.init();

            // Register tab change callbacks
            this.registerTabCallbacks();

            // Initialize admin modules
            this.adminCategoriesModule.init();
            this.adminContractorsModule.init();
            await this.adminReviewsModule.init();
        } catch (error) {
            console.error('Error initializing admin modules:', error);
        }
    }

    getLocationData() {
        // Use the new method from dataModule to get location data
        const locationData = this.dataModule.getLocationsData();
        
        // Fallback to window globals (for backward compatibility)
        return {
            southAfricanProvinces: locationData || window.southAfricanProvinces || {},
            southAfricanCityCoordinates: window.southAfricanCityCoordinates || {}
        };
    }

    registerTabCallbacks() {
        // Register refresh callbacks for each tab
        this.tabsModule.onTabChange('contractors-tab', () => {
            this.adminContractorsModule.renderContractorsTable();
        });

        this.tabsModule.onTabChange('categories-tab', () => {
            this.adminCategoriesModule.renderCategories();
        });

        this.tabsModule.onTabChange('reviews-tab', () => {
            this.adminReviewsModule.renderReviews();
        });
    }

    bindEvents() {
        // Modal close events - REMOVED problematic global modal close handler
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            }
        });

        // REMOVED: Problematic global modal close handler that was closing modals immediately
        // window.addEventListener('click', (e) => {
        //     if (e.target.classList.contains('modal')) {
        //         e.target.style.display = 'none';
        //     }
        // });

        // Add Contractor Button
        const addContractorBtn = document.getElementById('addContractorBtn');
        if (addContractorBtn) {
            addContractorBtn.addEventListener('click', () => {
                this.adminContractorsModule.showContractorForm();
            });
        }

        // Add Category Button
        const addCategoryBtn = document.getElementById('addCategoryBtn');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', () => {
                this.adminCategoriesModule.showAddCategoryForm();
            });
        }

        // Global search functionality for contractors tab
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.adminContractorsModule.filterContractors(e.target.value);
            });
        }

        // Category search
        const categorySearch = document.getElementById('categorySearch');
        if (categorySearch) {
            categorySearch.addEventListener('input', (e) => {
                this.adminCategoriesModule.filterCategories(e.target.value);
            });
        }

        // Review search and filters
        const reviewSearch = document.getElementById('reviewSearch');
        if (reviewSearch) {
            reviewSearch.addEventListener('input', () => {
                this.adminReviewsModule.filterReviews();
            });
        }

        const reviewContractorFilter = document.getElementById('reviewContractorFilter');
        if (reviewContractorFilter) {
            reviewContractorFilter.addEventListener('change', () => {
                this.adminReviewsModule.filterReviews();
            });
        }

        const reviewStatusFilter = document.getElementById('reviewStatusFilter');
        if (reviewStatusFilter) {
            reviewStatusFilter.addEventListener('change', () => {
                this.adminReviewsModule.filterReviews();
            });
        }

        // Listen for data updates to refresh stats
        document.addEventListener('adminDataUpdated', () => {
            this.refreshDashboard();
        });
    }

    renderDashboard() {
        this.renderStats();

        // Render current tab content
        const currentTab = this.tabsModule.getCurrentTab();
        
        switch (currentTab) {
            case 'contractors-tab':
                this.adminContractorsModule.renderContractorsTable();
                break;
            case 'categories-tab':
                this.adminCategoriesModule.renderCategories();
                break;
            case 'reviews-tab':
                this.adminReviewsModule.renderReviews();
                break;
        }
    }

    renderStats() {
        const contractors = this.dataModule.getContractors();

        const totalReviews = contractors ? contractors.reduce((total, contractor) => {
            const reviews = this.dataModule.getReviewsForContractor(contractor.id) || [];
            return total + reviews.length;
        }, 0) : 0;

        const averageRating = contractors && contractors.length > 0 ?
            contractors.reduce((total, contractor) => {
                const rating = parseFloat(contractor.overallRating) || 0;
                return total + rating;
            }, 0) / contractors.length : 0;

        const categories = this.dataModule.getCategories();
        const totalCategories = categories ? categories.length : 0;

        const reviewStats = this.dataModule.getReviewStats();
        const pendingReviews = reviewStats ? reviewStats.pendingReviews : 0;

        // Update stats elements
        this.updateElementText('totalContractors', contractors ? contractors.length : 0);
        this.updateElementText('totalReviews', totalReviews);
        this.updateElementText('averageRating', averageRating.toFixed(1));
        this.updateElementText('totalCategories', totalCategories);
        this.updateElementText('pendingReviews', pendingReviews);
    }

    updateElementText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Global method to refresh dashboard stats
    refreshDashboard() {
        this.renderStats();
    }

    // Global method wrappers for HTML onclick handlers
    showContractorForm(contractor = null) {
        this.adminContractorsModule.showContractorForm(contractor);
    }

    viewContractor(id) {
        this.adminContractorsModule.viewContractor(id);
    }

    editContractor(id) {
        this.adminContractorsModule.editContractor(id);
    }

    deleteContractor(id) {
        this.adminContractorsModule.deleteContractor(id);
    }

    showCategoryForm(category = null) {
        this.adminCategoriesModule.showAddCategoryForm(category);
    }

    editCategory(categoryName) {
        this.adminCategoriesModule.editCategory(categoryName);
    }

    deleteCategory(categoryName) {
        this.adminCategoriesModule.deleteCategory(categoryName);
    }

    approveReview(reviewId) {
        this.adminReviewsModule.approveReview(reviewId);
    }

    rejectReview(reviewId) {
        this.adminReviewsModule.rejectReview(reviewId);
    }

    deleteReview(reviewId) {
        this.adminReviewsModule.deleteReview(reviewId);
    }

    viewReview(contractorId, reviewId) {
        this.adminReviewsModule.viewReview(contractorId, reviewId);
    }

    filterContractors(searchTerm) {
        this.adminContractorsModule.filterContractors(searchTerm);
    }

    filterCategories(searchTerm) {
        this.adminCategoriesModule.filterCategories(searchTerm);
    }

    filterReviews() {
        this.adminReviewsModule.filterReviews();
    }
}

// Create and initialize global instance
const adminModule = new AdminModule();

// Make adminModule available globally for HTML onclick handlers
window.adminModule = adminModule;

// Initialize admin when page loads
document.addEventListener('DOMContentLoaded', function () {
    adminModule.init();
});

export default AdminModule;