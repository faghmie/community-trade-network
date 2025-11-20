// js/app/uiManager.js - UPDATED to handle feedback action
// ES6 Module for UI management - Orchestrator only

import { LazyLoader } from './lazyLoader.js';
import { FavoritesManager } from './favoritesManager.js';
import { StatsManager } from './statsManager.js';

export class UIManager {
    constructor(cardManager, dataModule, categoriesModule, reviewManager) {
        this.cardManager = cardManager;
        this.dataModule = dataModule;
        this.categoriesModule = categoriesModule;
        this.reviewManager = reviewManager;
        this.elements = {};

        // Initialize specialized managers
        this.lazyLoader = null;
        this.favoritesManager = null;
        this.filterManager = null;
        this.statsManager = null;

        // Bind event handlers
        this.handleCategoriesUpdated = this.handleCategoriesUpdated.bind(this);
        this.handleFiltersChange = this.handleFiltersChange.bind(this);
    }

    async init(filterManager) {
        this.filterManager = filterManager;
        this.cacheElements();
        await this.setupManagers();
        this.setupCategories();
        this.setupActionHandlers();
        this.setupEventListeners();
        // REMOVED: setupBottomNavigation() - now handled by FilterManager
    }

    async setupManagers() {
        // Setup LazyLoader
        try {
            this.lazyLoader = new LazyLoader({
                batchSize: 12,
                placeholderCount: 8,
                loadingDelay: 300
            });

            // FIXED: Use the new callback setter method names
            this.lazyLoader.setOnBatchLoad((batch, currentIndex, total) => {
                console.log(`LazyLoader: Loaded ${batch.length} contractors (${currentIndex}/${total})`);
            });

            await this.lazyLoader.init(this.elements.contractorsGrid, this.cardManager);
            console.log('LazyLoader initialized successfully');
        } catch (error) {
            console.error('Failed to initialize LazyLoader:', error);
            this.lazyLoader = null;
        }

        // Setup FavoritesManager
        try {
            this.favoritesManager = new FavoritesManager(this.dataModule, this.cardManager);
            await this.favoritesManager.init();
            console.log('FavoritesManager initialized successfully');

            // Listen to favorites manager events
            this.favoritesManager.onFavoritesFilterApplied((detail) => {
                this.renderContractors(detail.contractors);
                // Delegate stats update to StatsManager
                this.statsManager?.updateStats(detail.contractors);
            });
        } catch (error) {
            console.error('Failed to initialize FavoritesManager:', error);
            this.favoritesManager = null;
        }

        // Setup StatsManager
        try {
            this.statsManager = new StatsManager(this.dataModule, this.reviewManager);
            await this.statsManager.init();

            console.log('StatsManager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize StatsManager:', error);
            this.statsManager = null;
        }
    }

    cacheElements() {
        this.elements = {
            contractorsGrid: document.getElementById('contractorsGrid'),
            // REMOVED: All filter elements - now handled by FilterManager
            favoritesSection: document.getElementById('favoritesSection'),
            favoritesGrid: document.getElementById('favoritesGrid'),
            favoritesNotice: document.getElementById('favoritesNotice'),
            favoritesFilter: document.getElementById('favoritesFilter'),
            actionButtons: document.querySelectorAll('[data-action]'),
            // REMOVED: Bottom navigation elements - now handled by FilterManager
            mainContent: document.querySelector('.main-content'),
            mapContainer: document.getElementById('map-container'),
            contractorList: document.getElementById('contractorList'),
            filtersPanel: document.getElementById('filtersPanel'),
            // REMOVED: favorites badge elements - now handled by FavoritesManager
        };
    }

    setupCategories() {
        // REMOVED: Direct filter setup - now handled by FilterManager

        // FIXED: Listen for category changes via DOM events instead of direct method call
        document.addEventListener('categoriesUpdated', this.handleCategoriesUpdated);
    }

    // FIXED: Handle categories updated event - delegate to FilterManager
    handleCategoriesUpdated() {
        console.log('UIManager: Categories updated, delegating to FilterManager');
        this.filterManager?.handleCategoriesUpdated();
    }

    // REMOVED: All bottom navigation methods - now handled by FilterManager
    // - setupBottomNavigation()
    // - handleBottomNavClick()
    // - updateBottomNavigationActiveState()
    // - showHomeView()
    // - showFavoritesView()
    // - showSearchView()
    // - showMapNavView()
    // - showAdminView()
    // - notifyViewChange()

    // === FILTER INDICATOR MANAGEMENT ===

    handleFiltersChange(filters) {
        // REMOVED: updateFilterIndicator() - now handled by FilterManager
        // FilterManager now handles its own filter indicator updates
    }

    // REMOVED: updateFilterIndicator() - now handled by FilterManager

    setupActionHandlers() {
        // Handle action buttons - delegate ALL actions to appropriate managers
        document.addEventListener('click', (e) => {
            const button = e.target.closest('[data-action]');
            if (button) {
                const action = button.getAttribute('data-action');
                e.preventDefault();
                this.handleActionButton(action, button);
            }
        });
    }

    setupEventListeners() {
        // Listen for filter changes from FilterManager
        if (this.filterManager) {
            this.filterManager.onFiltersChange((filters) => {
                const contractors = this.filterManager.applyFilters(filters);
                this.renderContractors(contractors);
                if (this.statsManager) {
                    this.statsManager.updateStats(contractors);
                }
                // REMOVED: Filter indicator update - now handled by FilterManager
            });
        }

        // Listen for view changes from FilterManager (for map/list toggle buttons)
        if (this.filterManager) {
            this.filterManager.onViewChange((view) => {
                // REMOVED: Bottom navigation state update - now handled by FilterManager
                // FilterManager now handles its own navigation state
            });
        }

        // REMOVED: favoritesUpdated event listener - now handled by FavoritesManager
    }

    handleActionButton(action, button) {
        console.log('UIManager: Handling action:', action);

        // Delegate ALL filter-related actions to FilterManager
        if ([
            'show-filters', 'hide-filters', 'clear-filters', 'filter', 'sort',
            'show-all', 'show-favorites', 'show-high-rated',
            // NEW: Bottom navigation actions
            'show-home', 'view-favorites', 'show-map', 'show-filters',
            // FIXED: Add 'apply-filters' to delegate the Show Results button
            'apply-filters'
        ].includes(action)) {
            this.filterManager?.handleAction(action);
            return;
        }

        // Handle app-level actions
        switch (action) {
            case 'show-feedback':
                console.log('🔧 UIManager: Opening feedback modal');
                if (window.app && window.app.showFeedbackForm) {
                    window.app.showFeedbackForm({
                        page: 'main',
                        feature: 'bottom-navigation'
                    });
                } else {
                    console.error('🔧 UIManager: App or showFeedbackForm not available');
                }
                break;

            case 'show-favorites':
            case 'view-favorites':
                if (this.favoritesManager) {
                    this.favoritesManager.showFavoritesOnly();
                }
                break;
            case 'show-high-rated':
                if (this.favoritesManager) {
                    this.favoritesManager.showHighRated();
                }
                break;
            default:
                console.log('UIManager: Unhandled action:', action);
        }
    }

    // REMOVED: All filter-related UI methods - now handled by FilterManager

    // === CONTRACTOR RENDERING ===

    renderContractors = (contractorsToRender = null, targetGrid = null) => {
        // For favorites grid or other specific grids, use normal rendering
        if (targetGrid && targetGrid !== this.elements.contractorsGrid) {
            const contractors = contractorsToRender || this.dataModule.getContractors();
            this.cardManager.renderContractorCards(contractors, targetGrid);
            return;
        }

        // For main contractors grid, use lazy loading if available
        const contractors = contractorsToRender || this.dataModule.getContractors();

        console.log('UIManager: renderContractors called -', {
            contractorsCount: contractors.length,
            targetGrid: targetGrid ? targetGrid.id : 'main',
            lazyLoaderAvailable: !!this.lazyLoader
        });

        if (this.lazyLoader) {
            // Use lazy loader for main grid
            this.lazyLoader.render(contractors);
        } else {
            // Fallback: render all at once
            this.cardManager.renderContractorCards(contractors, this.elements.contractorsGrid);
        }
    }

    // REMOVED: Legacy modal methods - now handled by independent modal managers

    // === LAZY LOADING CONTROL ===

    setLazyLoading(enabled) {
        if (this.lazyLoader) {
            this.lazyLoader.setEnabled(enabled);
        }
    }

    // === CLEANUP ===

    destroy() {
        // Remove event listeners
        document.removeEventListener('categoriesUpdated', this.handleCategoriesUpdated);

        // Clean up managers
        if (this.lazyLoader) {
            this.lazyLoader.destroy();
        }
        if (this.favoritesManager) {
            this.favoritesManager.destroy();
        }
        if (this.statsManager) {
            this.statsManager.destroy();
        }
    }
}