// js/app/uiManager.js
// ES6 Module for UI management - Orchestrator only

import { LazyLoader } from './lazyLoader.js';
import { FavoritesManager } from './favoritesManager.js';
import { StatsManager } from './statsManager.js';
import backButtonManager from '../modules/backButtonManager.js';

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

        // FIXED: Define the method first, then bind it
        this.handleCategoriesUpdated = this.handleCategoriesUpdated.bind(this);
        this.handleFiltersChange = this.handleFiltersChange.bind(this);
        this.handleFavoritesUpdated = this.handleFavoritesUpdated.bind(this);
        this.handleModalOpened = this.handleModalOpened.bind(this);
        this.handleModalClosed = this.handleModalClosed.bind(this);
    }

    // Define the methods as class properties to ensure they exist before binding
    handleCategoriesUpdated() {
        this.filterManager?.handleCategoriesUpdated();
    }

    handleFiltersChange(filters) {
        // REMOVED: updateFilterIndicator() - now handled by FilterManager
    }

    handleFavoritesUpdated(event) {
        this.updateFavoritesBadges(event.detail?.count);
        this.updateAllFavoriteButtons();
    }

    handleModalOpened(event) {
        // Forward modal opened events to back button manager
        const { modalId, modalElement } = event.detail;
        if (modalId && modalElement) {
            backButtonManager.registerModal(modalId, modalElement);
        }
    }

    handleModalClosed(event) {
        // Forward modal closed events to back button manager
        const { modalId } = event.detail;
        if (modalId) {
            backButtonManager.unregisterModal(modalId);
        }
    }

    async init(filterManager) {
        this.filterManager = filterManager;
        this.cacheElements();
        
        // Initialize back button manager first
        backButtonManager.init();
        
        await this.setupManagers();
        this.setupCategories();
        this.setupActionHandlers();
        this.setupEventListeners();
        
        // FIXED: Update initial favorites state after everything is set up
        this.updateInitialFavoritesState();
    }

    async setupManagers() {
        // Setup LazyLoader
        try {
            this.lazyLoader = new LazyLoader({
                batchSize: 12,
                placeholderCount: 8,
                loadingDelay: 300
            });

            this.lazyLoader.setOnBatchLoad((batch, currentIndex, total) => {
                // Optional: Add minimal logging here if needed for performance monitoring
            });

            await this.lazyLoader.init(this.elements.contractorsGrid, this.cardManager);
        } catch (error) {
            console.error('Failed to initialize LazyLoader:', error);
            this.lazyLoader = null;
        }

        // Setup FavoritesManager
        try {
            this.favoritesManager = new FavoritesManager(this.dataModule, this.cardManager);
            await this.favoritesManager.init();
            
            // Listen to favorites manager events
            this.favoritesManager.onFavoritesFilterApplied((detail) => {
                this.renderContractors(detail.contractors);
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
        } catch (error) {
            console.error('Failed to initialize StatsManager:', error);
            this.statsManager = null;
        }
    }

    cacheElements() {
        this.elements = {
            contractorsGrid: document.getElementById('contractorsGrid'),
            favoritesSection: document.getElementById('favoritesSection'),
            favoritesGrid: document.getElementById('favoritesGrid'),
            favoritesNotice: document.getElementById('favoritesNotice'),
            favoritesFilter: document.getElementById('favoritesFilter'),
            actionButtons: document.querySelectorAll('[data-action]'),
            mainContent: document.querySelector('.main-content'),
            mapContainer: document.getElementById('map-container'),
            contractorList: document.getElementById('contractorList'),
            filtersPanel: document.getElementById('filtersPanel'),
            // FIXED: Ensure all badge elements are properly cached
            mobileFavBadge: document.getElementById('mobileFavBadge'),
            favoritesStat: document.querySelector('.favorites-stat .stat-number'),
            mobileFavoritesCount: document.getElementById('mobileFavoritesCount')
        };
    }

    // NEW: Update initial favorites state after initialization
    updateInitialFavoritesState() {
        const initialCount = this.dataModule.getFavoritesCount();
        this.updateFavoritesBadges(initialCount);
        this.updateAllFavoriteButtons();
    }

    setupCategories() {
        document.addEventListener('categoriesUpdated', this.handleCategoriesUpdated);
    }

    updateFavoritesBadges(favoritesCount = null) {
        const count = favoritesCount !== null ? favoritesCount : this.dataModule.getFavoritesCount();
        
        // Update mobile favorites badge
        if (this.elements.mobileFavBadge) {
            this.elements.mobileFavBadge.textContent = count;
            if (count > 0) {
                this.elements.mobileFavBadge.classList.remove('hidden');
            } else {
                this.elements.mobileFavBadge.classList.add('hidden');
            }
        }
        
        // Update stats favorites count
        if (this.elements.favoritesStat) {
            this.elements.favoritesStat.textContent = count;
        }
        
        // Update mobile favorites count
        if (this.elements.mobileFavoritesCount) {
            this.elements.mobileFavoritesCount.textContent = count;
        }
    }

    updateAllFavoriteButtons() {
        const favoriteButtons = document.querySelectorAll('.favorite-btn');
        
        favoriteButtons.forEach(button => {
            const contractorId = button.getAttribute('data-contractor-id');
            if (contractorId) {
                const isFav = this.dataModule.isFavorite(contractorId);
                const icon = button.querySelector('.material-icons');
                
                if (isFav) {
                    button.classList.add('favorited');
                    button.setAttribute('aria-pressed', 'true');
                    button.title = 'Remove from favorites';
                    if (icon) icon.textContent = 'favorite';
                } else {
                    button.classList.remove('favorited');
                    button.setAttribute('aria-pressed', 'false');
                    button.title = 'Add to favorites';
                    if (icon) icon.textContent = 'favorite_border';
                }
            }
        });
    }

    setupActionHandlers() {
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
            });
        }

        // Listen for view changes from FilterManager
        if (this.filterManager) {
            this.filterManager.onViewChange((view) => {
                // FilterManager handles its own navigation state
            });
        }

        // FIXED: Add the missing favoritesUpdated event listener
        document.addEventListener('favoritesUpdated', this.handleFavoritesUpdated);

        // NEW: Listen for modal events to forward to back button manager
        document.addEventListener('modalOpened', this.handleModalOpened);
        document.addEventListener('modalClosed', this.handleModalClosed);
    }

    handleActionButton(action, button) {
        if ([
            'show-filters', 'hide-filters', 'clear-filters', 'filter', 'sort',
            'show-all', 'show-favorites', 'show-high-rated',
            'show-home', 'view-favorites', 'show-map', 'show-filters',
            'apply-filters'
        ].includes(action)) {
            this.filterManager?.handleAction(action);
            return;
        }

        switch (action) {
            case 'show-feedback':
                if (window.app && window.app.showFeedbackForm) {
                    window.app.showFeedbackForm({
                        page: 'main',
                        feature: 'bottom-navigation'
                    });
                } else {
                    console.error('App or showFeedbackForm not available');
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
                // Silent fail for unhandled actions
        }
    }

    renderContractors = (contractorsToRender = null, targetGrid = null) => {
        if (targetGrid && targetGrid !== this.elements.contractorsGrid) {
            const contractors = contractorsToRender || this.dataModule.getContractors();
            this.cardManager.renderContractorCards(contractors, targetGrid);
            return;
        }

        const contractors = contractorsToRender || this.dataModule.getContractors();

        if (this.lazyLoader) {
            this.lazyLoader.render(contractors);
        } else {
            this.cardManager.renderContractorCards(contractors, this.elements.contractorsGrid);
        }
    }

    setLazyLoading(enabled) {
        if (this.lazyLoader) {
            this.lazyLoader.setEnabled(enabled);
        }
    }

    destroy() {
        document.removeEventListener('categoriesUpdated', this.handleCategoriesUpdated);
        document.removeEventListener('favoritesUpdated', this.handleFavoritesUpdated);
        document.removeEventListener('modalOpened', this.handleModalOpened);
        document.removeEventListener('modalClosed', this.handleModalClosed);

        // Clean up back button manager
        backButtonManager.destroy();

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