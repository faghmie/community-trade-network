// js/app/main.js
import { showNotification } from '../modules/notifications.js';
import { FavoritesManager } from '../modules/favoritesManager.js';
import { CardManager } from '../modules/cardManager.js';
import { UIManager } from './uiManager.js';
import { ModalManager } from './modalManager.js';
import { FilterManager } from './filterManager.js';
import { MapManager } from '../modules/mapManager.js';

export class ContractorReviewApp {
    constructor(dataModule) {
        this.dataModule = dataModule;
        this.uiManager = null;
        this.modalManager = null;
        this.filterManager = null;
        this.mapManager = null;
        this.favoritesManager = null;
        this.cardManager = null;
        
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
        // Wait for favorites data manager to be ready
        const favoritesDataManager = this.dataModule.getFavoritesDataManager();
        if (favoritesDataManager && !favoritesDataManager.initialized) {
            console.log('🔄 Initializing FavoritesDataManager...');
            await favoritesDataManager.init(this.dataModule.storage);
        }
        
        // Create card manager
        this.cardManager = new CardManager(this.dataModule, this.dataModule.getReviewManager());
        console.log('✅ CardManager created');

        // Create UI manager
        this.uiManager = new UIManager(
            this.cardManager,
            this.dataModule,
            this.dataModule.getCategoriesModule(),
            this.dataModule.getReviewManager()
        );
        console.log('✅ UIManager created');

        // Create modal manager
        this.modalManager = new ModalManager(this.dataModule, this.dataModule.getReviewManager(), this.cardManager);
        console.log('✅ ModalManager created');

        // Create filter manager
        this.filterManager = new FilterManager();
        console.log('✅ FilterManager created');

        // Create map manager
        this.mapManager = new MapManager(this.dataModule);
        console.log('✅ MapManager created');

        // Create favorites manager
        this.favoritesManager = new FavoritesManager();
        this.favoritesManager.init(
            favoritesDataManager,
            this.dataModule,
            this.uiManager
        );
        console.log('✅ FavoritesManager initialized');

        // Initialize all UI managers
        await this.uiManager.init(this.dataModule, this.favoritesManager);
        await this.modalManager.init(this.dataModule, this.favoritesManager);
        await this.filterManager.init(this.dataModule, this.favoritesManager);
    }

    setupManagers() {
        // When filters change, update UI
        this.filterManager.onFiltersChange((filters) => {
            this.filteredContractors = this.filterManager.applyFilters(filters);
            this.uiManager.renderContractors(this.filteredContractors);
            this.uiManager.updateStats(this.filteredContractors);
            
            // Track if favorites filter is active
            this.isFavoritesFilterActive = filters.favoritesOnly || false;
            
            // Update map markers if in map view
            if (this.currentView === 'map') {
                this.mapManager.updateContractors(this.filteredContractors);
            }
        });

        // When modal actions occur
        this.modalManager.onReviewRequest((contractorId) => {
            this.currentContractor = contractorId;
            this.modalManager.openReviewModal(contractorId);
        });

        // When review form is submitted
        this.modalManager.onReviewSubmit((reviewData) => {
            this.handleReviewSubmit(reviewData);
        });

        // Handle favorites updates
        document.addEventListener('favoritesUpdated', () => {
            this.uiManager.updateStats(this.filteredContractors);
            
            // Only reapply filters if favorites filter is currently active
            if (this.isFavoritesFilterActive) {
                console.log('Favorites updated and favorites filter is active - refreshing filters');
                this.filterManager.applyCurrentFilters();
            } else {
                console.log('Favorites updated but favorites filter not active - updating UI only');
                this.updateFavoriteButtons();
            }
        });

        // Handle map marker clicks
        document.addEventListener('mapMarkerClick', (event) => {
            this.handleMapMarkerClick(event.detail.contractorId);
        });

        // Listen for view changes from mapManager
        document.addEventListener('viewToggle', (event) => {
            this.currentView = event.detail.view;
            this.handleViewChange();
        });

        // Listen for data updates
        document.addEventListener('contractorsUpdated', () => {
            this.renderDashboard();
        });

        document.addEventListener('reviewsUpdated', () => {
            this.uiManager.updateStats(this.filteredContractors);
        });

        // Listen for storage initialization events
        document.addEventListener('storageReady', () => {
            console.log('Storage ready event received - refreshing favorites');
            this.refreshFavoritesData();
        });

        // Listen for map initialization events
        document.addEventListener('mapInitialized', () => {
            console.log('Map initialized event received');
            if (this.currentView === 'map') {
                this.handleViewChange();
            }
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
        window.favoritesManager = this.favoritesManager;

        // Make app methods available globally for HTML onclick handlers
        window.toggleFavorite = (contractorId) => this.toggleFavorite(contractorId);
        window.showContractorDetails = (contractorId) => this.showContractorDetails(contractorId);
        window.showReviewForm = (contractorId) => this.showReviewForm(contractorId);
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
        window.showFavoritesSection = () => this.showFavoritesSection();
        window.handleFavoritesImport = (file) => this.handleFavoritesImport(file);
        window.showMapView = () => this.showMapView();
        window.showListView = () => this.showListView();
        window.refreshMap = () => this.refreshMap();
    }

    // Helper method to refresh favorites data
    async refreshFavoritesData() {
        if (this.favoritesManager && this.favoritesManager.dataManager) {
            try {
                await this.favoritesManager.dataManager.refresh();
                console.log('Favorites data refreshed from storage');
                
                // Update UI to reflect current favorites state
                this.updateFavoriteButtons();
                this.favoritesManager.showFavoritesSection();
                
            } catch (error) {
                console.error('Error refreshing favorites data:', error);
            }
        }
    }

    // Helper method to update favorite buttons without reapplying filters
    updateFavoriteButtons() {
        if (this.favoritesManager) {
            this.favoritesManager.updateFavoriteButtons();
        }
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
            
            // Show favorites section only if there are favorites
            if (favoritesSection && this.favoritesManager) {
                const hasFavorites = this.favoritesManager.getFavoritesCount() > 0;
                favoritesSection.classList.toggle('hidden', !hasFavorites);
            }
        }
    }

    handleMapMarkerClick(contractorId) {
        this.modalManager.openContractorModal(contractorId);
    }

    renderDashboard() {
        this.uiManager.refreshFilters();
        this.uiManager.renderStats();
        this.uiManager.renderContractors();
        
        // Initialize map data but don't show it unless in map view
        const contractors = this.dataModule.getContractors();
        this.mapManager.updateContractors(contractors);
        
        // Ensure correct view is displayed
        this.handleViewChange();
        
        // Update favorites section
        if (this.favoritesManager) {
            this.favoritesManager.showFavoritesSection();
        }
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

    // Favorites management
    async toggleFavorite(contractorId) {
        if (!this.favoritesManager) {
            console.error('FavoritesManager not initialized');
            return false;
        }
        return await this.favoritesManager.toggleFavorite(contractorId);
    }

    showFavoritesSection() {
        if (this.favoritesManager) {
            this.favoritesManager.showFavoritesSection();
        }
    }

    handleFavoritesImport(file) {
        if (this.favoritesManager && file) {
            this.favoritesManager.handleFavoritesImport(file);
        }
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
    toggleAdvancedFilters = () => this.filterManager.toggleAdvancedFilters();
    clearFilters = () => this.filterManager.clearFilters();
    showFavoritesOnly = () => {
        this.isFavoritesFilterActive = true;
        this.filterManager.showFavoritesOnly();
    };
    showHighRated = () => {
        this.isFavoritesFilterActive = false;
        this.filterManager.showHighRated();
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
        }
    }

    handleSearchKeyPress = (event) => event.key === 'Enter' && this.searchContractors();

    // Export data functionality
    exportData() {
        const contractors = this.dataModule.getContractors();
        const reviews = this.dataModule.getAllReviews();
        const favorites = this.favoritesManager ? this.favoritesManager.exportFavorites() : 'No favorites';
        
        const exportData = {
            contractors: contractors,
            reviews: reviews,
            favorites: favorites,
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
        const favoritesDataManager = this.dataModule.getFavoritesDataManager();
        return {
            contractors: this.dataModule.getContractors().length,
            reviews: this.dataModule.getAllReviews().length,
            favorites: this.favoritesManager ? this.favoritesManager.getFavoritesCount() : 0,
            filteredContractors: this.filteredContractors.length,
            currentContractor: this.currentContractor,
            currentView: this.currentView,
            mapInitialized: this.mapManager ? this.mapManager.isReady() : false,
            dataModuleInitialized: this.dataModule.initialized,
            favoritesManagerInitialized: !!this.favoritesManager,
            favoritesDataManagerInitialized: favoritesDataManager ? favoritesDataManager.initialized : false,
            isFavoritesFilterActive: this.isFavoritesFilterActive
        };
    }
}

// Make app available globally for HTML onclick handlers
window.ContractorReviewApp = ContractorReviewApp;