import AuthManager from './modules/auth.js';
import AdminAuthModule from './modules/admin-auth.js';
import TabsModule from './modules/tabs.js';

// Modern Admin Dashboard with Authentication
class AdminModule {
    constructor() {
        this.authModule = null;
        this.modulesInitialized = false;
        this.adminContractorsModule = null;
        this.adminCategoriesModule = null;
        this.adminReviewsModule = null;
        this.tabsModule = null;
    }

    async init() {
        // Wait for data to be loaded before initializing authentication
        await window.dataReady;
        
        // Initialize authentication module
        this.authModule = new AdminAuthModule();
        await this.authModule.init(this);
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
            // Ensure dataModule is fully initialized first
            await dataModule.init();
            
            console.log('✅ dataModule fully initialized, creating admin modules');

            // Get location data for contractors module
            const locationData = {
                southAfricanCityCoordinates: window.southAfricanCityCoordinates,
                southAfricanProvinces: window.southAfricanProvinces
            };

            // Create instances with dependency injection
            this.adminCategoriesModule = new AdminCategoriesModule(dataModule);
            this.adminContractorsModule = new AdminContractors(dataModule, categoriesModule, utils, locationData);
            this.adminReviewsModule = new AdminReviewsModule(dataModule);
            
            // Initialize tabs module
            this.tabsModule = new TabsModule();
            this.tabsModule.init();
            
            // Register tab change callbacks
            this.registerTabCallbacks();
            
            // Initialize admin modules
            this.adminCategoriesModule.init();
            this.adminContractorsModule.init();
            this.adminReviewsModule.init();
            
            console.log('✅ All admin modules initialized successfully');
        } catch (error) {
            console.error('Error initializing admin modules:', error);
        }
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
        console.log('Binding admin events...');
        
        // Modal close events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            }
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

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

        console.log('Admin events bound successfully');
    }

    renderDashboard() {
        this.renderStats();
        
        // Render current tab content
        const currentTab = this.tabsModule.getCurrentTab();
        switch(currentTab) {
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
        const contractors = dataModule.getContractors();
        
        const totalReviews = contractors ? contractors.reduce((total, contractor) => {
            const reviews = contractor.reviews || [];
            return total + reviews.length;
        }, 0) : 0;

        const averageRating = contractors && contractors.length > 0 ? 
            contractors.reduce((total, contractor) => {
                const rating = parseFloat(contractor.rating) || 0;
                return total + rating;
            }, 0) / contractors.length : 0;

        const categories = dataModule.getCategories();
        const totalCategories = categories ? categories.length : 0;
        
        const reviewStats = dataModule.getReviewStats();
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

    approveReview(contractorId, reviewId) {
        this.adminReviewsModule.approveReview(contractorId, reviewId);
    }

    rejectReview(contractorId, reviewId) {
        this.adminReviewsModule.rejectReview(contractorId, reviewId);
    }

    deleteReview(contractorId, reviewId) {
        this.adminReviewsModule.deleteReview(contractorId, reviewId);
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
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Admin page loaded - initializing authentication...');
    adminModule.init();
});

export default AdminModule;