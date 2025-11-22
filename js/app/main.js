// js/app/main.js - FIXED: Properly initialize ContractorEditModalManager
// UPDATED: Added ContractorEditModalManager instantiation

import { showNotification } from '../modules/notifications.js';
import { CardManager } from '../modules/cardManager.js';
import { UIManager } from './uiManager.js';
import { FilterManager } from './filterManager.js';
import { MapManager } from '../modules/mapManager.js';
import { FeedbackModalManager } from './modals/feedbackModalManager.js';
import { ContractorEditModalManager } from './modals/contractorEditModalManager.js'; // NEW: Import the actual modal manager

export class ContractorReviewApp {
    constructor(dataModule) {
        this.dataModule = dataModule;
        this.uiManager = null;
        this.filterManager = null;
        this.mapManager = null;
        this.cardManager = null;
        this.feedbackModalManager = null;
        this.contractorEditModalManager = null; // NEW: Contractor edit modal manager
        
        this.currentContractor = null;
        this.filteredContractors = [];
        this.currentView = 'list';
        this.isFavoritesFilterActive = false;
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
            
            // Render initial state
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

        // NEW: Create contractor edit modal manager
        this.contractorEditModalManager = new ContractorEditModalManager(
            this.dataModule.getContractorManager(),
            this.dataModule.getCategoriesModule(),
            this.dataModule.getLocationsData() // Make sure this method exists in dataModule
        );
        this.contractorEditModalManager.init();

        // Create map manager
        this.mapManager = new MapManager(this.dataModule);

        // Create feedback modal manager
        this.feedbackModalManager = new FeedbackModalManager(this.dataModule);
        this.feedbackModalManager.init();
    }

    setupManagers() {
        // When filters change, update UI - FIXED: Properly handle filtered contractors
        this.filterManager.onFiltersChange((filters, filteredContractors) => {
            // Use the filtered contractors provided by FilterManager, or apply filters if not provided
            this.filteredContractors = filteredContractors || this.filterManager.applyFilters(filters);
            
            // Render the filtered contractors
            this.uiManager.renderContractors(this.filteredContractors);
            
            // Track if favorites filter is active
            this.isFavoritesFilterActive = filters.favorites === 'favorites';
            
            // Update map markers if in map view
            if (this.currentView === 'map') {
                this.mapManager.updateContractors(this.filteredContractors);
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
            // You could add analytics tracking here
        });

        this.feedbackModalManager.on('onClose', () => {
            // Handle feedback modal close if needed
        });

        // Listen for contractor creation events for post-creation handling
        document.addEventListener('contractorCreated', (event) => {
            this.handleContractorCreated(event.detail);
        });

        // NEW: Verify contractor edit modal manager is listening
        console.log('🔧 ContractorEditModalManager initialized:', !!this.contractorEditModalManager);
        
        // Test event dispatch to ensure it's working
        setTimeout(() => {
            console.log('🔧 Testing event system...');
            document.dispatchEvent(new CustomEvent('testEvent', {
                detail: { message: 'Test event working' }
            }));
        }, 1000);
    }

    setupGlobalHandlers() {
        // Make app instance and managers available globally for HTML onclick handlers
        window.contractorApp = this;
        window.app = this;
        window.cardManager = this.cardManager;
        window.dataModule = this.dataModule;
        window.mapManager = this.mapManager;
        window.feedbackModalManager = this.feedbackModalManager;
        window.contractorEditModalManager = this.contractorEditModalManager; // NEW: Make available globally

        // Make app methods available globally for HTML onclick handlers
        window.toggleFavorite = (contractorId) => this.toggleFavorite(contractorId);
        window.showContractorDetails = (contractorId) => this.showContractorDetails(contractorId);
        window.showReviewForm = (contractorId) => this.showReviewForm(contractorId);
        window.showFeedbackForm = () => this.showFeedbackForm();
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
        window.addNewSupplier = () => this.addNewSupplier();

        // NEW: Direct test method for debugging
        window.testAddSupplier = (prefillData = { name: 'Test Supplier', category: 'Plumbing', location: 'Johannesburg' }) => {
            console.log('🧪 Testing add supplier with:', prefillData);
            document.dispatchEvent(new CustomEvent('addSupplierRequested', {
                detail: {
                    prefillData: prefillData,
                    source: 'test',
                    timestamp: new Date().toISOString()
                }
            }));
        };
    }

    // Handle contractor creation success (post-creation handling only)
    handleContractorCreated(contractorData) {
        const { contractor, wasCreated } = contractorData;
        
        if (wasCreated && contractor) {
            // Show success notification
            showNotification(`Successfully added ${contractor.name} to the directory!`, 'success');
            
            // Clear filters to show all contractors including the new one
            this.filterManager.clearFilters();
            
            // Optional: Auto-scroll to the new contractor in the list
            setTimeout(() => {
                this.highlightNewContractor(contractor.id);
            }, 500);
            
            // Track successful addition
            this.trackContractorAddition(contractor);
        }
    }

    // Highlight newly added contractor in the list
    highlightNewContractor(contractorId) {
        const contractorCard = document.querySelector(`[data-contractor-id="${contractorId}"]`);
        if (contractorCard) {
            // Add highlight animation
            contractorCard.classList.add('new-contractor-highlight');
            
            // Scroll into view
            contractorCard.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            // Remove highlight after animation
            setTimeout(() => {
                contractorCard.classList.remove('new-contractor-highlight');
            }, 3000);
        }
    }

    // Track successful contractor addition
    trackContractorAddition(contractor) {
        console.log('Tracking contractor addition:', {
            contractorId: contractor.id,
            contractorName: contractor.name,
            category: contractor.category,
            location: contractor.location,
            timestamp: new Date().toISOString()
        });
        
        // Example: Dispatch event for analytics integration
        document.dispatchEvent(new CustomEvent('contractorAddedSuccessfully', {
            detail: contractor
        }));
    }

    // Public method for adding new suppliers (can be called from anywhere)
    addNewSupplier(prefillData = {}) {
        console.log('🎯 addNewSupplier called with:', prefillData);
        
        // Dispatch event instead of direct method call
        document.dispatchEvent(new CustomEvent('addSupplierRequested', {
            detail: {
                prefillData: prefillData,
                source: 'globalMethod',
                timestamp: new Date().toISOString()
            }
        }));

        // NEW: Fallback - if event doesn't work, try direct method
        setTimeout(() => {
            if (this.contractorEditModalManager && typeof this.contractorEditModalManager.openWithPrefill === 'function') {
                console.log('🔄 Using fallback direct method');
                this.contractorEditModalManager.openWithPrefill(prefillData);
            }
        }, 100);
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
        // Dispatch event for contractor modal to handle
        document.dispatchEvent(new CustomEvent('showContractorDetails', {
            detail: { contractorId }
        }));
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
            // Dispatch event for review modal to close itself
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

    // Public API for HTML onclick handlers - UPDATED to use events
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

    // HTML COMPATIBILITY METHODS - UPDATED to use events
    closeModal(modalId) {
        // Dispatch events for individual modal managers to handle
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
            feedbackModalManagerInitialized: !!this.feedbackModalManager,
            contractorEditModalManagerInitialized: !!this.contractorEditModalManager, // NEW: Track this
            favoritesManagerAvailable: !!this.uiManager?.favoritesManager,
            lazyLoaderAvailable: !!this.uiManager?.lazyLoader,
            statsManagerAvailable: !!this.uiManager?.statsManager,
            isFavoritesFilterActive: this.isFavoritesFilterActive,
            addSupplierEnabled: true,
            eventDrivenArchitecture: true
        };
    }
}

// Make app available globally for HTML onclick handlers
window.ContractorReviewApp = ContractorReviewApp;