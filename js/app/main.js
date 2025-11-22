// js/app/main.js - FIXED: Ensure initial view is shown properly

import { showNotification } from '../modules/notifications.js';
import { CardManager } from '../modules/cardManager.js';
import { UIManager } from './uiManager.js';
import { FilterManager } from './filterManager.js';
import { MapView } from './views/mapView.js';
import { FeedbackModalManager } from './modals/feedbackModalManager.js';
import { ContractorEditModalManager } from './modals/contractorEditModalManager.js';
import { ContractorModalManager } from './modals/contractorModalManager.js';
import { ReviewModalManager } from './modals/reviewModalManager.js';
import { CategoriesListView } from './views/categoriesListView.js';
import { ContractorListView } from './views/contractorListView.js';

export class ContractorReviewApp {
    constructor(dataModule) {
        this.dataModule = dataModule;
        this.uiManager = null;
        this.filterManager = null;
        this.mapView = null;
        this.cardManager = null;
        this.feedbackModalManager = null;
        this.contractorEditModalManager = null;
        this.contractorModalManager = null;
        this.reviewModalManager = null;

        // View managers
        this.categoriesListView = null;
        this.contractorListView = null;

        this.currentContractor = null;
        this.filteredContractors = [];
        this.currentView = 'categories'; // Show categories by default
        this.isFavoritesFilterActive = false;
        this.isViewChanging = false; // Prevent recursive view changes
        this.isInitialized = false; // NEW: Track if app is fully initialized
    }

    async init() {
        try {
            // Initialize data module first
            await this.dataModule.init();

            // Create all managers with proper dependency injection
            await this.createManagers();

            // Set up cross-manager communication
            this.setupManagers();

            // Set up global event handlers for HTML compatibility
            this.setupGlobalHandlers();

            // Initialize views using event-driven pattern
            this.initializeViews();

            // Render initial state - Show categories by default
            this.renderDashboard();

        } catch (error) {
            console.error('App initialization failed:', error);
            showNotification('App initialization failed. Please refresh the page.', 'error');
        }
    }

    async createManagers() {
        // Create card manager
        this.cardManager = new CardManager(
            this.dataModule,
            this.dataModule.getReviewManager()
        );

        // Create filter manager
        this.filterManager = new FilterManager();
        await this.filterManager.init(this.dataModule);

        // Create UI manager
        this.uiManager = new UIManager(
            this.cardManager,
            this.dataModule,
            this.dataModule.getCategoriesModule(),
            this.dataModule.getReviewManager()
        );
        await this.uiManager.init(this.filterManager);

        // Create contractor edit modal manager
        this.contractorEditModalManager = new ContractorEditModalManager(
            this.dataModule.getContractorManager(),
            this.dataModule.getCategoriesModule(),
            this.dataModule.getLocationsData()
        );
        this.contractorEditModalManager.init();

        // Create review modal manager
        this.reviewModalManager = new ReviewModalManager(
            this.dataModule,
            this.dataModule.getReviewManager(),
            this.handleReviewSubmit.bind(this)
        );

        // Create contractor modal manager
        this.contractorModalManager = new ContractorModalManager(
            this.dataModule,
            this.dataModule.getReviewManager(),
            this.cardManager,
            this.reviewModalManager
        );

        // Create map manager
        this.mapView = new MapView(this.dataModule);

        // Create feedback modal manager
        this.feedbackModalManager = new FeedbackModalManager(this.dataModule);
        this.feedbackModalManager.init();
    }

    // Initialize view managers using EVENT-DRIVEN pattern
    initializeViews() {
        // Create categories list view - it will self-initialize via events
        this.categoriesListView = new CategoriesListView(this.dataModule);

        // Create contractor list view - it will self-initialize via events
        this.contractorListView = new ContractorListView(
            this.dataModule,
            this.dataModule.getReviewManager()
        );

        // ✅ EVENT-DRIVEN: Dispatch events for views to self-initialize
        document.dispatchEvent(new CustomEvent('initializeCategoriesView'));
        document.dispatchEvent(new CustomEvent('initializeContractorListView'));

        console.log('🎯 View initialization events dispatched');
    }

    setupManagers() {
        // When filters change, update UI
        this.filterManager.onFiltersChange((filters, filteredContractors) => {
            this.filteredContractors = filteredContractors || this.filterManager.applyFilters(filters);

            // Only update contractor list if we're in list view
            if (this.currentView === 'list') {
                document.dispatchEvent(new CustomEvent('contractorsListUpdate', {
                    detail: { contractors: this.filteredContractors }
                }));
            }

            // Track if favorites filter is active
            this.isFavoritesFilterActive = filters.favorites === 'favorites';

            // Update map markers if in map view
            if (this.currentView === 'map') {
                this.mapView.updateContractors(this.filteredContractors);
            }

            // Update stats
            if (this.uiManager.statsManager) {
                this.uiManager.statsManager.updateStats(this.filteredContractors);
            }
        });

        // Handle favorites updates
        document.addEventListener('favoritesUpdated', () => {
            // Only reapply filters if favorites filter is currently active
            if (this.isFavoritesFilterActive) {
                this.filterManager.applyCurrentFilters();
            }
        });

        // Handle map marker clicks
        document.addEventListener('mapMarkerClick', (event) => {
            this.handleMapMarkerClick(event.detail.contractorId);
        });

        // Listen for view changes from filterManager
        this.filterManager.onViewChange((view) => {
            this.currentView = view;
            this.handleViewChange();
        });

        // NEW: Listen for navigation events from bottom navigation
        document.addEventListener('navigationViewChange', (event) => {
            this.handleNavigationViewChange(event.detail.view);
        });

        // Listen for data updates
        document.addEventListener('contractorsUpdated', () => {
            this.renderDashboard();
        });

        document.addEventListener('reviewsUpdated', () => {
            // Stats are handled by StatsManager via UIManager
        });

        // Listen for map initialization events
        document.addEventListener('mapInitialized', () => {
            if (this.currentView === 'map') {
                this.handleViewChange();
            }
        });

        // Listen for feedback submission events
        this.feedbackModalManager.on('onSubmit', (feedbackData) => {
            // Analytics tracking can be added here
        });

        this.feedbackModalManager.on('onClose', () => {
            // Handle feedback modal close if needed
        });

        // Listen for contractor creation events for post-creation handling
        document.addEventListener('contractorCreated', (event) => {
            this.handleContractorCreated(event.detail);
        });

        // Handle category selection to show contractors
        document.addEventListener('categorySelected', (event) => {
            this.handleCategorySelected(event.detail.category);
        });

        // Handle category type selection to show contractors
        document.addEventListener('showContractorsForCategoryType', (event) => {
            this.handleCategoryTypeSelected(event.detail.type, event.detail.categories);
        });

        // FIXED: Use different event names to prevent recursion
        // These are "command" events that trigger view changes
        document.addEventListener('requestShowCategoriesView', () => {
            if (this.currentView !== 'categories' && !this.isViewChanging) {
                this.currentView = 'categories';
                this.handleViewChange();
            }
        });

        document.addEventListener('requestShowContractorListView', () => {
            if (this.currentView !== 'list' && !this.isViewChanging) {
                this.currentView = 'list';
                this.handleViewChange();
            }
        });

        // NEW: Listen for view initialization completion to show initial view
        document.addEventListener('categoriesViewRendered', () => {
            console.log('✅ Categories view rendered successfully');
            // Show categories view after it's fully rendered
            if (!this.isInitialized) {
                this.showInitialView();
            }
        });

        document.addEventListener('contractorListViewRendered', () => {
            console.log('✅ Contractor list view rendered successfully');
        });

        // Listen for view visibility notifications (these don't trigger changes)
        document.addEventListener('categoriesListViewShown', () => {
            console.log('📢 Categories list view is now visible');
        });

        document.addEventListener('categoriesListViewHidden', () => {
            console.log('📢 Categories list view is now hidden');
        });

        document.addEventListener('contractorListViewShown', () => {
            console.log('📢 Contractor list view is now visible');
        });

        document.addEventListener('contractorListViewHidden', () => {
            console.log('📢 Contractor list view is now hidden');
        });
    }

    // NEW: Show initial view after everything is initialized
    showInitialView() {
        console.log('🚀 Showing initial categories view');
        this.isInitialized = true;

        // FIXED: For initial view, directly set the current view and call handleViewChange
        // This ensures the categories view is shown immediately
        this.currentView = 'categories';
        this.handleViewChange();
    }

    // NEW: Handle navigation view changes from bottom navigation
    handleNavigationViewChange(view) {
        console.log(`🎯 Handling navigation view change: ${view}`);

        switch (view) {
            case 'home':
                // Home shows categories view
                this.currentView = 'categories';
                this.filterManager.clearFilters();
                break;
            case 'favorites':
                // Favorites shows contractor list with favorites filter
                this.currentView = 'list';
                this.filterManager.applyFavoritesFilter();
                break;
            case 'map':
                // Map shows map view
                this.currentView = 'map';
                break;
            case 'search':
                // Search shows filter panel but doesn't change main view
                // The main view remains whatever it was before
                // FilterManager handles the panel visibility
                break;
            default:
                console.warn('Unknown navigation view:', view);
                return;
        }

        this.handleViewChange();
    }

    setupGlobalHandlers() {
        // Make app instance and managers available globally for HTML onclick handlers
        window.contractorApp = this;
        window.app = this;
        window.cardManager = this.cardManager;
        window.dataModule = this.dataModule;
        window.mapManager = this.mapView;
        window.feedbackModalManager = this.feedbackModalManager;
        window.contractorEditModalManager = this.contractorEditModalManager;
        window.contractorModalManager = this.contractorModalManager;
        window.reviewModalManager = this.reviewModalManager;

        // Make app methods available globally for HTML onclick handlers
        window.toggleFavorite = (contractorId) => this.toggleFavorite(contractorId);
        window.showContractorDetails = (contractorId) => this.showContractorDetails(contractorId);
        window.showReviewForm = (contractorId) => this.showReviewForm(contractorId);
        window.showFeedbackForm = () => this.showFeedbackForm();
        window.searchContractors = () => this.searchContractors();
        window.filterContractors = () => this.filterContractors();
        window.sortContractors = () => this.sortContractors();
        window.clearFilters = () => this.clearFilters();
        window.showFavoritesOnly = () => this.showFavoritesOnly();
        window.showHighRated = () => this.showHighRated();
        window.resetToDefault = () => this.resetToDefault();
        window.handleSearchKeyPress = (event) => this.handleSearchKeyPress(event);
        window.exportData = () => this.exportData();
        window.closeModal = (modalId) => this.closeModal(modalId);
        window.showMapView = () => this.showMapView();
        window.showListView = () => this.showListView();
        window.refreshMap = () => this.refreshMap();
        window.addNewSupplier = () => this.addNewSupplier();

        // Navigation methods for views - use the new event names
        window.showCategories = () => {
            document.dispatchEvent(new CustomEvent('requestShowCategoriesView'));
        };
        window.showContractorList = () => {
            document.dispatchEvent(new CustomEvent('requestShowContractorListView'));
        };
    }

    // Show categories view - use the new event name
    showCategoriesView() {
        document.dispatchEvent(new CustomEvent('requestShowCategoriesView'));
    }

    // Show contractor list view - use the new event name
    showContractorListView() {
        document.dispatchEvent(new CustomEvent('requestShowContractorListView'));
    }

    // Update the handleCategoryTypeSelected method to properly switch views
    /**
     * Handle category type selection - show contractors for the selected type
     * @param {string} type - The category type name
     * @param {Category[]} categories - Array of categories within this type
     */
    handleCategoryTypeSelected(type, categories) {
        console.log(`🎯 Handling category type selection: ${type} with ${categories.length} categories`);

        // Switch to list view first (this will hide categories view)
        this.currentView = 'list';
        this.handleViewChange();

        // Get all category names for this type to use in filtering
        const categoryNames = categories.map(cat => cat.name);

        console.log(`🔍 Filtering contractors for categories:`, categoryNames);

        // Dispatch event to filter by category type
        document.dispatchEvent(new CustomEvent('filterByCategoryType', {
            detail: {
                type: type,
                categories: categories,
                categoryNames: categoryNames
            }
        }));

        // Show notification about the filter
        showNotification(`Showing contractors in ${type}`, 'info');
    }

    // Handle contractor creation success
    handleContractorCreated(contractorData) {
        const { contractor, wasCreated } = contractorData;

        if (wasCreated && contractor) {
            showNotification(`Successfully added ${contractor.name} to the directory!`, 'success');

            // Clear filters to show all contractors including the new one
            this.filterManager.clearFilters();

            // Switch to contractor list view to show the new contractor
            this.showContractorListView();

            // Auto-scroll to the new contractor in the list
            setTimeout(() => {
                this.highlightNewContractor(contractor.id);
            }, 500);
        }
    }

    // Highlight newly added contractor in the list
    highlightNewContractor(contractorId) {
        const contractorCard = document.querySelector(`[data-contractor-id="${contractorId}"]`);
        if (contractorCard) {
            contractorCard.classList.add('new-contractor-highlight');
            contractorCard.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });

            setTimeout(() => {
                contractorCard.classList.remove('new-contractor-highlight');
            }, 3000);
        }
    }

    // Public method for adding new suppliers
    addNewSupplier(prefillData = {}) {
        document.dispatchEvent(new CustomEvent('addSupplierRequested', {
            detail: {
                prefillData: prefillData,
                source: 'globalMethod',
                timestamp: new Date().toISOString()
            }
        }));
    }

    // FIXED: Proper event-driven view change without recursion
    handleViewChange() {
        // Prevent recursive view changes
        if (this.isViewChanging) {
            console.log('⏸️ View change already in progress, skipping...');
            return;
        }

        this.isViewChanging = true;

        const mapContainer = document.getElementById('map-container');

        console.log(`🔄 Switching to view: ${this.currentView}`);

        // FIXED: Use command events instead of direct DOM manipulation
        // First, hide all views to ensure clean state
        document.dispatchEvent(new CustomEvent('hideCategoriesView'));
        document.dispatchEvent(new CustomEvent('hideContractorListView'));
        document.dispatchEvent(new CustomEvent('hideMapView'));

        // Then, show only the current view
        if (this.currentView === 'map') {
            // Show map view only
            document.dispatchEvent(new CustomEvent('showMapView'));

            // Update map with current filtered contractors
            const contractorsToShow = this.filteredContractors.length > 0 ?
                this.filteredContractors :
                this.dataModule.getContractors();
            this.mapView.updateContractors(contractorsToShow);

        } else if (this.currentView === 'list') {
            // Show contractor list view only
            document.dispatchEvent(new CustomEvent('showContractorListView'));

            // Update contractor list with current filtered contractors
            document.dispatchEvent(new CustomEvent('contractorsListUpdate', {
                detail: { contractors: this.filteredContractors }
            }));

        } else if (this.currentView === 'categories') {
            // Show categories view only
            document.dispatchEvent(new CustomEvent('showCategoriesView'));
        }

        console.log(`✅ View switched to: ${this.currentView}`);

        // Reset the flag after the view change is complete
        setTimeout(() => {
            this.isViewChanging = false;
        }, 50);
    }

    handleMapMarkerClick(contractorId) {
        document.dispatchEvent(new CustomEvent('showContractorDetails', {
            detail: { contractorId }
        }));
    }

    renderDashboard() {
        this.filterManager.refreshAllFilters();

        // Initialize map data but don't show it unless in map view
        const contractors = this.dataModule.getContractors();
        this.mapView.updateContractors(contractors);

        // Dispatch app initialized event for views
        document.dispatchEvent(new CustomEvent('appInitialized'));

        // NOTE: We don't call showCategoriesView() here anymore
        // It will be called automatically when categories view is rendered
        console.log('📊 Dashboard rendered - waiting for view initialization...');
    }

    // Handle review submission via events
    handleReviewSubmit(reviewData) {
        const contractorId = reviewData.contractorId || this.currentContractor;

        if (!contractorId) {
            console.error('No contractor ID available for review submission');
            showNotification('Error: Could not submit review. Please try again.', 'error');
            return;
        }

        const review = this.dataModule.addReview(contractorId, reviewData);
        if (review) {
            document.dispatchEvent(new CustomEvent('closeReviewModal'));
            this.renderDashboard();
            showNotification('Review submitted successfully!', 'success');
        } else {
            showNotification('Error submitting review. Please try again.', 'error');
        }
    }

    // Show feedback form
    showFeedbackForm(context = {}) {
        if (!this.feedbackModalManager) {
            console.error('FeedbackModalManager not initialized');
            showNotification('Feedback system not available. Please refresh the page.', 'error');
            return;
        }

        this.feedbackModalManager.open(context);
    }

    // Favorites management
    async toggleFavorite(contractorId) {
        if (!this.dataModule || !this.uiManager?.favoritesManager) {
            console.error('DataModule or FavoritesManager not initialized');
            return false;
        }

        return await this.uiManager.favoritesManager.toggleFavorite(contractorId);
    }

    // Map view management
    showMapView() {
        this.currentView = 'map';
        this.handleViewChange();
    }

    showListView() {
        this.currentView = 'list';
        this.handleViewChange();
    }

    refreshMap() {
        if (this.mapView) {
            this.mapView.refreshMap();
        }
    }

    // Public API for HTML onclick handlers
    showContractorDetails = (contractorId) => {
        document.dispatchEvent(new CustomEvent('showContractorDetails', {
            detail: { contractorId }
        }));
    };

    showReviewForm = (contractorId) => {
        document.dispatchEvent(new CustomEvent('showReviewForm', {
            detail: { contractorId }
        }));
    };

    searchContractors = () => this.filterManager.applyCurrentFilters();
    filterContractors = () => this.filterManager.applyCurrentFilters();

    sortContractors() {
        const sortedContractors = this.filterManager.applySorting();
        document.dispatchEvent(new CustomEvent('contractorsListUpdate', {
            detail: { contractors: sortedContractors }
        }));

        if (this.currentView === 'map') {
            this.mapView.updateContractors(sortedContractors);
        }
    }

    // Filter methods
    clearFilters = () => this.filterManager.clearFilters();
    showFavoritesOnly = () => {
        this.isFavoritesFilterActive = true;
        if (this.uiManager.favoritesManager) {
            this.uiManager.favoritesManager.showFavoritesOnly();
        }
    };
    showHighRated = () => {
        this.isFavoritesFilterActive = false;
        if (this.uiManager.favoritesManager) {
            this.uiManager.favoritesManager.showHighRated();
        }
    };
    resetToDefault = () => {
        this.isFavoritesFilterActive = false;
        this.filterManager.resetToDefault();
    };

    // HTML compatibility methods
    closeModal(modalId) {
        switch (modalId) {
            case 'reviewModal':
                document.dispatchEvent(new CustomEvent('closeReviewModal'));
                break;
            case 'contractorModal':
                document.dispatchEvent(new CustomEvent('closeContractorModal'));
                break;
            case 'feedbackModal':
                this.feedbackModalManager.close();
                break;
            case 'contractorEditModal':
                document.dispatchEvent(new CustomEvent('closeContractorEditModal'));
                break;
        }
    }

    handleSearchKeyPress = (event) => event.key === 'Enter' && this.searchContractors();

    // Export data functionality
    exportData() {
        const contractors = this.dataModule.getContractors();
        const reviews = this.dataModule.getAllReviews();
        const favoritesCount = this.dataModule.getFavoritesCount();

        const exportData = {
            contractors: contractors,
            reviews: reviews,
            favoritesCount: favoritesCount,
            exportDate: new Date().toISOString(),
            totalContractors: contractors.length,
            totalReviews: reviews.length
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contractor-reviews-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        showNotification('Data exported successfully!', 'success');
    }
}

// Make app available globally for HTML onclick handlers
window.ContractorReviewApp = ContractorReviewApp;