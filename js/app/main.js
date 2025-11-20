// js/app/main.js - CLEANED UP WITH PROPER SEPARATION OF CONCERNS
import { showNotification } from '../modules/notifications.js';
import { CardManager } from '../modules/cardManager.js';
import { UIManager } from './uiManager.js';
import { ModalManager } from './modalManager.js';
import { FilterManager } from './filterManager.js';
import { MapManager } from '../modules/mapManager.js';
import { FeedbackModalManager } from './modals/feedbackModalManager.js'; // NEW: Import feedback modal manager

export class ContractorReviewApp {
    constructor(dataModule) {
        this.dataModule = dataModule;
        this.uiManager = null;
        this.modalManager = null;
        this.filterManager = null;
        this.mapManager = null;
        this.cardManager = null;
        this.feedbackModalManager = null; // NEW: Feedback modal manager
        
        this.currentContractor = null;
        this.filteredContractors = [];
        this.currentView = 'list';
        this.isFavoritesFilterActive = false;
    }

    async init() {
        console.log('🚀 Starting Contractor Review App initialization...');
        
        try {
            // Initialize data module first
            await this.dataModule.init();
            console.log('✅ DataModule initialized');
            
            // Create all managers with proper dependency injection
            await this.createManagers();
            
            // Set up cross-manager communication
            this.setupManagers();
            
            // Set up global event handlers for HTML compatibility
            this.setupGlobalHandlers();
            
            // Render initial state
            this.renderDashboard();
            
            console.log('✅ Contractor Review App initialized successfully!');
            console.log('📊 App status:', this.getAppStatus());
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            showNotification('App initialization failed. Please refresh the page.', 'error');
        }
    }

    async createManagers() {
        // Create card manager
        this.cardManager = new CardManager(
            this.dataModule, 
            this.dataModule.getReviewManager()
        );
        console.log('✅ CardManager created');

        // Create filter manager
        this.filterManager = new FilterManager();
        await this.filterManager.init(this.dataModule);
        console.log('✅ FilterManager created');

        // Create UI manager
        this.uiManager = new UIManager(
            this.cardManager,
            this.dataModule,
            this.dataModule.getCategoriesModule(),
            this.dataModule.getReviewManager()
        );
        await this.uiManager.init(this.filterManager);
        console.log('✅ UIManager created');

        // Create modal manager with direct callback for review submission
        this.modalManager = new ModalManager(
            this.dataModule, 
            this.dataModule.getReviewManager(), 
            this.cardManager,
            (reviewData, contractorId) => {
                // Direct callback from ReviewModalManager
                console.log('🔧 Main App: Received review submission via direct callback');
                this.handleReviewSubmit({
                    ...reviewData,
                    contractorId: contractorId || reviewData.contractorId
                });
            }
        );
        await this.modalManager.init();
        console.log('✅ ModalManager created and initialized');

        // Create map manager
        this.mapManager = new MapManager(this.dataModule);
        console.log('✅ MapManager created');

        // NEW: Create feedback modal manager
        this.feedbackModalManager = new FeedbackModalManager(this.dataModule);
        this.feedbackModalManager.init();
        console.log('✅ FeedbackModalManager created and initialized');
    }

    setupManagers() {
        // When filters change, update UI - FIXED: Properly handle filtered contractors
        this.filterManager.onFiltersChange((filters, filteredContractors) => {
            console.log('🔧 Main App: Filters changed, filtered contractors:', filteredContractors?.length);
            
            // Use the filtered contractors provided by FilterManager, or apply filters if not provided
            this.filteredContractors = filteredContractors || this.filterManager.applyFilters(filters);
            
            console.log('🔧 Main App: Rendering', this.filteredContractors.length, 'contractors');
            
            // Render the filtered contractors
            this.uiManager.renderContractors(this.filteredContractors);
            
            // Track if favorites filter is active
            this.isFavoritesFilterActive = filters.favorites === 'favorites';
            
            // Update map markers if in map view
            if (this.currentView === 'map') {
                console.log('🔧 Main App: Updating map with filtered contractors');
                this.mapManager.updateContractors(this.filteredContractors);
            }
            
            // Update stats
            if (this.uiManager.statsManager) {
                this.uiManager.statsManager.updateStats(this.filteredContractors);
            }
        });

        // Handle favorites updates
        document.addEventListener('favoritesUpdated', () => {
            console.log('🔧 Main App: Favorites updated event received');
            // Only reapply filters if favorites filter is currently active
            if (this.isFavoritesFilterActive) {
                console.log('Favorites updated and favorites filter is active - refreshing filters');
                this.filterManager.applyCurrentFilters();
            } else {
                console.log('Favorites updated but favorites filter not active - UI will update automatically');
            }
        });

        // Handle map marker clicks
        document.addEventListener('mapMarkerClick', (event) => {
            this.handleMapMarkerClick(event.detail.contractorId);
        });

        // Listen for view changes from filterManager
        this.filterManager.onViewChange((view) => {
            console.log('🔧 Main App: View changed to:', view);
            this.currentView = view;
            this.handleViewChange();
        });

        // Listen for data updates
        document.addEventListener('contractorsUpdated', () => {
            console.log('🔧 Main App: Contractors updated, refreshing dashboard');
            this.renderDashboard();
        });

        document.addEventListener('reviewsUpdated', () => {
            console.log('🔧 Main App: Reviews updated');
            // Stats are handled by StatsManager via UIManager
        });

        // Listen for map initialization events
        document.addEventListener('mapInitialized', () => {
            console.log('🔧 Main App: Map initialized event received');
            if (this.currentView === 'map') {
                this.handleViewChange();
            }
        });

        // NEW: Listen for feedback submission events
        this.feedbackModalManager.on('onSubmit', (feedbackData) => {
            console.log('🔧 Main App: Feedback submitted successfully:', feedbackData);
            // You could add analytics tracking here
        });

        this.feedbackModalManager.on('onClose', () => {
            console.log('🔧 Main App: Feedback modal closed');
        });
    }

    setupGlobalHandlers() {
        // Make app instance and managers available globally for HTML onclick handlers
        window.contractorApp = this;
        window.app = this;
        window.cardManager = this.cardManager;
        window.dataModule = this.dataModule;
        window.modalManager = this.modalManager;
        window.mapManager = this.mapManager;
        window.feedbackModalManager = this.feedbackModalManager; // NEW: Make feedback manager available

        // Make app methods available globally for HTML onclick handlers
        window.toggleFavorite = (contractorId) => this.toggleFavorite(contractorId);
        window.showContractorDetails = (contractorId) => this.showContractorDetails(contractorId);
        window.showReviewForm = (contractorId) => this.showReviewForm(contractorId);
        window.showFeedbackForm = () => this.showFeedbackForm(); // NEW: Feedback method
        window.searchContractors = () => this.searchContractors();
        window.filterContractors = () => this.filterContractors();
        window.sortContractors = () => this.sortContractors();
        window.toggleAdvancedFilters = () => this.toggleAdvancedFilters();
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
    }

    handleViewChange() {
        const mapContainer = document.getElementById('map-container');
        const contractorList = document.getElementById('contractorList');
        const favoritesSection = document.getElementById('favoritesSection');

        if (this.currentView === 'map') {
            // Show map, hide list and favorites
            if (mapContainer) mapContainer.classList.remove('hidden');
            if (contractorList) contractorList.classList.add('hidden');
            if (favoritesSection) {
                favoritesSection.classList.add('hidden');
            }
            
            // Update map with current filtered contractors
            const contractorsToShow = this.filteredContractors.length > 0 ? 
                this.filteredContractors : 
                this.dataModule.getContractors();
                
            this.mapManager.updateContractors(contractorsToShow);
            
            // Ensure map is properly sized after showing
            setTimeout(() => {
                if (this.mapManager.map) {
                    this.mapManager.map.invalidateSize();
                }
            }, 300);
            
        } else {
            // Show list, hide map
            if (mapContainer) mapContainer.classList.add('hidden');
            if (contractorList) contractorList.classList.remove('hidden');
            
            // The favorites section is always hidden in the new design
            if (favoritesSection) {
                favoritesSection.classList.add('hidden');
            }
        }
    }

    handleMapMarkerClick(contractorId) {
        this.modalManager.openContractorModal(contractorId);
    }

    renderDashboard() {
        // FIXED: Call refreshAllFilters on FilterManager instead of refreshFilters on UIManager
        this.filterManager.refreshAllFilters();
        this.uiManager.renderContractors();
        
        // Initialize map data but don't show it unless in map view
        const contractors = this.dataModule.getContractors();
        this.mapManager.updateContractors(contractors);
        
        // Ensure correct view is displayed
        this.handleViewChange();
    }

    handleReviewSubmit(reviewData) {
        // Use the contractor ID from the review data or fall back to currentContractor
        const contractorId = reviewData.contractorId || this.currentContractor;
        
        if (!contractorId) {
            console.error('No contractor ID available for review submission');
            showNotification('Error: Could not submit review. Please try again.', 'error');
            return;
        }

        const review = this.dataModule.addReview(contractorId, reviewData);
        if (review) {
            this.modalManager.closeReviewModal();
            this.renderDashboard();
            showNotification('Review submitted successfully!', 'success');
        } else {
            showNotification('Error submitting review. Please try again.', 'error');
        }
    }

    // NEW: Show feedback form
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
        
        // Use FavoritesManager to handle the toggle with proper UI updates
        const success = await this.uiManager.favoritesManager.toggleFavorite(contractorId);
        return success;
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
        if (this.mapManager) {
            this.mapManager.forceRefresh();
        }
    }

    // Public API for HTML onclick handlers
    showContractorDetails = (contractorId) => this.modalManager.openContractorModal(contractorId);
    showReviewForm = (contractorId) => this.modalManager.openReviewModal(contractorId);
    searchContractors = () => this.filterManager.applyCurrentFilters();
    filterContractors = () => this.filterManager.applyCurrentFilters();

    sortContractors() {
        const sortedContractors = this.filterManager.applySorting();
        this.uiManager.renderContractors(sortedContractors);
        
        // Update map if in map view
        if (this.currentView === 'map') {
            this.mapManager.updateContractors(sortedContractors);
        }
    }

    // COMPACT FILTER METHODS
    toggleAdvancedFilters = () => {
        // REMOVED: This method is no longer needed since advanced filters are always visible
        console.log('toggleAdvancedFilters called but advanced filters are now always visible');
    };
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

    // HTML COMPATIBILITY METHODS
    closeModal(modalId) {
        if (modalId === 'reviewModal') {
            this.modalManager.closeReviewModal();
        } else if (modalId === 'contractorModal') {
            this.modalManager.closeContractorModal();
        } else if (modalId === 'feedbackModal') {
            this.feedbackModalManager.close();
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

    // Get app status for debugging
    getAppStatus() {
        return {
            contractors: this.dataModule.getContractors().length,
            reviews: this.dataModule.getAllReviews().length,
            favorites: this.dataModule.getFavoritesCount(),
            filteredContractors: this.filteredContractors.length,
            currentContractor: this.currentContractor,
            currentView: this.currentView,
            mapInitialized: this.mapManager ? this.mapManager.isReady() : false,
            dataModuleInitialized: this.dataModule.initialized,
            uiManagerInitialized: !!this.uiManager,
            filterManagerInitialized: !!this.filterManager,
            feedbackModalManagerInitialized: !!this.feedbackModalManager, // NEW: Feedback status
            favoritesManagerAvailable: !!this.uiManager?.favoritesManager,
            lazyLoaderAvailable: !!this.uiManager?.lazyLoader,
            statsManagerAvailable: !!this.uiManager?.statsManager,
            isFavoritesFilterActive: this.isFavoritesFilterActive
        };
    }
}

// Make app available globally for HTML onclick handlers
window.ContractorReviewApp = ContractorReviewApp;