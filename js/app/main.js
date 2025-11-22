// js/app/main.js - SIMPLIFIED: Complete with favorites fixes

import { showNotification } from '../modules/notifications.js';
import { FilterManager } from './filterManager.js';
import { MapView } from './views/mapView.js';
import { FeedbackModalManager } from './modals/feedbackModalManager.js';
import { ContractorEditModalManager } from './modals/contractorEditModalManager.js';
import { ContractorModalManager } from './modals/contractorModalManager.js';
import { ReviewModalManager } from './modals/reviewModalManager.js';
import { CategoriesView } from './views/CategoriesView.js';
import { ContractorListView } from './views/contractorListView.js';

export class ContractorReviewApp {
    constructor(dataModule) {
        this.dataModule = dataModule;
        this.views = {};
        this.currentView = 'categories';
        this.filterManager = null;
        this.filteredContractors = [];
        
        // Keep modal managers for now (they're working fine)
        this.feedbackModalManager = null;
        this.contractorEditModalManager = null;
        this.contractorModalManager = null;
        this.reviewModalManager = null;
        // No FavoritesManager needed!
    }

    async init() {
        try {
            // Initialize data first
            await this.dataModule.init();

            // Create essential managers
            await this.createEssentialManagers();

            // Setup views
            this.setupViews();

            // Setup event listeners
            this.setupEventListeners();

            // Show initial view
            this.showView('categories');

            // Update initial favorites badge
            this.updateFavoritesBadge();

            console.log('✅ App initialized successfully');

        } catch (error) {
            console.error('App initialization failed:', error);
            showNotification('App initialization failed. Please refresh the page.', 'error');
        }
    }

    async createEssentialManagers() {
        // Create filter manager
        this.filterManager = new FilterManager(this.dataModule);
        await this.filterManager.init();

        // No FavoritesManager creation needed!

        // Create modal managers
        this.contractorEditModalManager = new ContractorEditModalManager(
            this.dataModule.getContractorManager(),
            this.dataModule.getCategoriesModule(),
            this.dataModule.getLocationsData()
        );
        this.contractorEditModalManager.init();

        this.reviewModalManager = new ReviewModalManager(
            this.dataModule,
            this.dataModule.getReviewManager(),
            this.handleReviewSubmit.bind(this)
        );

        this.contractorModalManager = new ContractorModalManager(
            this.dataModule,
            this.dataModule.getReviewManager(),
            this.reviewModalManager
        );

        // Create map view
        this.mapView = new MapView(this.dataModule);

        // Create feedback modal manager
        this.feedbackModalManager = new FeedbackModalManager(this.dataModule);
        this.feedbackModalManager.init();
    }

    /**
     * Setup all views with simplified approach
     */
    setupViews() {
        this.views = {
            categories: new CategoriesView(this.dataModule),
            contractors: new ContractorListView(this.dataModule, this.dataModule.getReviewManager()),
            map: this.mapView
        };

        // Render all views (they start hidden)
        Object.values(this.views).forEach(view => view.render());
    }

    /**
     * Simplified event listeners - Direct favorites handling
     */
    setupEventListeners() {
        // Category selection
        document.addEventListener('categorySelected', (event) => {
            this.handleCategorySelected(event.detail);
        });

        // Filter changes
        document.addEventListener('filtersChanged', (event) => {
            this.filteredContractors = event.detail.results;
            this.refreshCurrentView();
        });

        // FIXED: Direct toggleFavorite handling
        document.addEventListener('toggleFavorite', async (event) => {
            await this.handleToggleFavorite(event.detail.contractorId);
        });

        // Navigation from bottom nav
        document.addEventListener('navigationViewChange', (event) => {
            this.handleNavigationViewChange(event.detail.view);
        });

        // Map marker clicks
        document.addEventListener('mapMarkerClick', (event) => {
            this.handleMapMarkerClick(event.detail.contractorId);
        });

        // Contractor creation
        document.addEventListener('contractorCreated', (event) => {
            this.handleContractorCreated(event.detail);
        });
    }

    /**
     * Handle toggle favorite - SIMPLIFIED: Direct handling
     */
    async handleToggleFavorite(contractorId) {
        try {
            // Direct data operation - no intermediate manager
            const success = await this.dataModule.toggleFavorite(contractorId);
            
            if (success) {
                // Get contractor info for notification
                const contractor = this.dataModule.getContractor(contractorId);
                const isFavorite = this.dataModule.isFavorite(contractorId);
                
                // Show notification
                const action = isFavorite ? 'added to' : 'removed from';
                showNotification(`${contractor?.name || 'Contractor'} ${action} favorites!`, 'success');
                
                // Update UI directly - no event dispatch needed
                this.updateFavoritesBadge();
                
                // Refresh favorites in current view if needed
                if (this.currentView === 'contractors') {
                    this.views.contractors.refreshFavorites();
                }
                
                return true;
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            showNotification('Error updating favorites', 'error');
        }
        return false;
    }

    /**
     * Update favorites badge on bottom navigation
     */
    updateFavoritesBadge() {
        const favoritesCount = this.dataModule.getFavoritesCount();
        const favoritesNavItem = document.querySelector('[data-view="favorites"]');
        let badge = favoritesNavItem?.querySelector('.bottom-nav-badge');

        if (favoritesCount > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'bottom-nav-badge favorites-badge';
                favoritesNavItem.appendChild(badge);
            }
            badge.textContent = favoritesCount;
            badge.classList.remove('hidden');
        } else if (badge) {
            badge.classList.add('hidden');
        }
    }

    /**
     * Simple view management - show one view, hide others
     */
    showView(viewName) {
        // Hide all views
        Object.values(this.views).forEach(view => view.hide());
        
        // Show the requested view
        if (this.views[viewName]) {
            this.views[viewName].show();
            this.currentView = viewName;
            this.refreshCurrentView();
        }
    }

    /**
     * Refresh current view with latest data
     */
    refreshCurrentView() {
        switch (this.currentView) {
            case 'categories':
                this.views.categories.renderCategories();
                break;
            case 'contractors':
                this.views.contractors.renderContractors(this.filteredContractors);
                break;
            case 'map':
                this.views.map.updateContractors(this.filteredContractors);
                break;
        }
    }

    /**
     * Handle category selection
     */
    handleCategorySelected(detail) {
        // Switch to contractors view
        this.showView('contractors');
        
        // Apply category filter
        document.dispatchEvent(new CustomEvent('filterByCategoryType', {
            detail: detail
        }));

        showNotification(`Showing contractors in ${detail.type}`, 'info');
    }

    /**
     * Handle navigation from bottom nav
     */
    handleNavigationViewChange(view) {
        console.log(`🎯 Handling navigation: ${view}`);
        
        switch (view) {
            case 'home':
                this.showView('categories');
                this.filterManager.clearFilters();
                break;
            case 'favorites':
                this.showView('contractors');
                this.filterManager.applyFavoritesFilter();
                break;
            case 'map':
                this.showView('map');
                break;
            case 'search':
                // Filter panel handled by FilterManager
                break;
            default:
                console.warn('Unknown navigation view:', view);
        }
    }

    /**
     * Handle map marker clicks
     */
    handleMapMarkerClick(contractorId) {
        document.dispatchEvent(new CustomEvent('showContractorDetails', {
            detail: { contractorId }
        }));
    }

    /**
     * Handle contractor creation
     */
    handleContractorCreated(contractorData) {
        const { contractor, wasCreated } = contractorData;

        if (wasCreated && contractor) {
            showNotification(`Successfully added ${contractor.name} to the directory!`, 'success');

            // Clear filters and show all contractors including the new one
            this.filterManager.clearFilters();
            this.showView('contractors');

            // Auto-scroll to the new contractor
            setTimeout(() => {
                this.highlightNewContractor(contractor.id);
            }, 500);
        }
    }

    /**
     * Highlight newly added contractor
     */
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

    /**
     * Public API methods for HTML compatibility
     */
    showCategoriesView() {
        this.showView('categories');
    }

    showContractorListView() {
        this.showView('contractors');
    }

    showMapView() {
        this.showView('map');
    }

    showListView() {
        this.showView('contractors');
    }

    // Review submission
    handleReviewSubmit(reviewData) {
        const contractorId = reviewData.contractorId;
        
        if (!contractorId) {
            console.error('No contractor ID available for review submission');
            showNotification('Error: Could not submit review. Please try again.', 'error');
            return;
        }

        const review = this.dataModule.addReview(contractorId, reviewData);
        if (review) {
            document.dispatchEvent(new CustomEvent('closeReviewModal'));
            showNotification('Review submitted successfully!', 'success');
        } else {
            showNotification('Error submitting review. Please try again.', 'error');
        }
    }

    // Favorites management - now simplified direct methods
    async toggleFavorite(contractorId) {
        return this.handleToggleFavorite(contractorId);
    }

    // Filter methods
    searchContractors = () => this.filterManager.applyCurrentFilters();
    filterContractors = () => this.filterManager.applyCurrentFilters();
    clearFilters = () => this.filterManager.clearFilters();
    showFavoritesOnly = () => this.filterManager.applyFavoritesFilter();
    showHighRated = () => this.filterManager.applyHighRatedFilter();
    resetToDefault = () => this.filterManager.resetToDefault();

    sortContractors() {
        const sortedContractors = this.filterManager.applySorting();
        if (this.currentView === 'contractors') {
            this.views.contractors.renderContractors(sortedContractors);
        } else if (this.currentView === 'map') {
            this.views.map.updateContractors(sortedContractors);
        }
    }

    // Modal management
    showFeedbackForm(context = {}) {
        this.feedbackModalManager.open(context);
    }

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

    // Utility methods
    refreshMap() {
        if (this.mapView) {
            this.mapView.refreshMap();
        }
    }

    addNewSupplier(prefillData = {}) {
        document.dispatchEvent(new CustomEvent('addSupplierRequested', {
            detail: {
                prefillData: prefillData,
                source: 'globalMethod',
                timestamp: new Date().toISOString()
            }
        }));
    }

    handleSearchKeyPress = (event) => event.key === 'Enter' && this.searchContractors();

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

    /**
     * Setup global handlers for HTML compatibility
     */
    setupGlobalHandlers() {
        window.contractorApp = this;
        window.app = this;
        window.dataModule = this.dataModule;
        window.mapManager = this.mapView;
        window.feedbackModalManager = this.feedbackModalManager;
        window.contractorEditModalManager = this.contractorEditModalManager;
        window.contractorModalManager = this.contractorModalManager;
        window.reviewModalManager = this.reviewModalManager;

        // Global methods
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
        window.showCategories = () => this.showCategoriesView();
        window.showContractorList = () => this.showContractorListView();
    }
}

// Make available globally
window.ContractorReviewApp = ContractorReviewApp;