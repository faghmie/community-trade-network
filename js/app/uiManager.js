// js/app/uiManager.js
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
    }

    async init(filterManager) {
        this.filterManager = filterManager;
        this.cacheElements();
        await this.setupManagers();
        this.setupCategories();
        this.setupContractorModal();
        this.setupActionHandlers();
        this.setupEventListeners();
    }

    async setupManagers() {
        // Setup LazyLoader
        try {
            this.lazyLoader = new LazyLoader({
                batchSize: 12,
                placeholderCount: 8,
                loadingDelay: 300
            });
            
            this.lazyLoader.onBatchLoad((batch, currentIndex, total) => {
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
                this.statsManager.updateStats(detail.contractors);
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
            categoryFilter: document.getElementById('categoryFilter'),
            locationFilter: document.getElementById('locationFilter'),
            ratingFilter: document.getElementById('ratingFilter'),
            searchInput: document.getElementById('searchInput'),
            sortBy: document.getElementById('sortBy'),
            favoritesFilter: document.getElementById('favoritesFilter'),
            contractorModal: document.getElementById('contractorModal'),
            contractorDetailsContent: document.getElementById('contractorDetails'),
            closeContractorModal: document.querySelector('.close-contractor-modal'),
            actionButtons: document.querySelectorAll('[data-action]')
        };
    }

    setupCategories() {
        this.refreshCategoryFilter();
        
        this.categoriesModule.onCategoriesChanged(() => {
            this.refreshCategoryFilter();
        });
    }

    setupContractorModal() {
        const { contractorModal, closeContractorModal } = this.elements;
        
        closeContractorModal.addEventListener('click', () => {
            this.hideContractorModal();
        });

        contractorModal.addEventListener('click', (e) => {
            if (e.target === contractorModal) {
                this.hideContractorModal();
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
    }

    handleActionButton(action, button) {
        console.log('UIManager: Handling action:', action);
        
        switch (action) {
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
            case 'clear-filters':
                if (this.filterManager) {
                    this.filterManager.clearFilters();
                }
                break;
            case 'export-favorites':
            case 'import-favorites':
                if (this.favoritesManager) {
                    this.favoritesManager.handleActionButton(action);
                }
                break;
            case 'export-data':
                console.log('Export data action');
                break;
            default:
                console.log('UIManager: Unhandled action:', action);
        }
    }

    // === UI RENDERING METHODS ===

    refreshFilters() {
        this.refreshCategoryFilter();
        this.refreshLocationFilter();
    }

    refreshCategoryFilter() {
        const { categoryFilter } = this.elements;
        const currentValue = categoryFilter?.value;
        
        const categories = this.categoriesModule.getCategories();
        
        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="">All Categories</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.name;
                option.textContent = category.name;
                categoryFilter.appendChild(option);
            });
            
            if (categories.some(cat => cat.name === currentValue)) {
                categoryFilter.value = currentValue;
            }
        }
    }

    refreshLocationFilter() {
        const { locationFilter } = this.elements;
        const currentValue = locationFilter?.value;
        const contractors = this.dataModule.getContractors();
        const locations = this.getUniqueLocations(contractors);
        
        if (locationFilter) {
            locationFilter.innerHTML = '<option value="">All Locations</option>';
            locations.forEach(location => {
                const option = document.createElement('option');
                option.value = location;
                option.textContent = location;
                locationFilter.appendChild(option);
            });
            
            if (locations.includes(currentValue)) {
                locationFilter.value = currentValue;
            }
        }
    }

    populateLocationFilter(contractors) {
        const { locationFilter } = this.elements;
        if (!locationFilter) return;

        const locations = [...new Set(contractors.map(c => c.location).filter(Boolean))].sort();

        while (locationFilter.options.length > 1) {
            locationFilter.remove(1);
        }

        locations.forEach(location => {
            const option = document.createElement('option');
            option.value = location;
            option.textContent = `📍 ${location}`;
            locationFilter.appendChild(option);
        });
    }

    populateCategoryFilter(contractors) {
        const { categoryFilter } = this.elements;
        if (!categoryFilter) return;

        const categories = [...new Set(contractors.map(c => c.category).filter(Boolean))].sort();

        while (categoryFilter.options.length > 1) {
            categoryFilter.remove(1);
        }

        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }

    refreshFilterOptions(contractors) {
        this.populateLocationFilter(contractors);
        this.populateCategoryFilter(contractors);
    }

    getUniqueLocations = (contractors) => [...new Set(contractors
        .map(contractor => contractor.location)
        .filter(location => location && location.trim() !== '')
    )].sort();

    // === CONTRACTOR RENDERING ===

    renderContractors = (contractorsToRender = null, targetGrid = null) => {
        if (targetGrid && targetGrid !== this.elements.contractorsGrid) {
            const contractors = contractorsToRender || this.dataModule.getContractors();
            this.cardManager.renderContractorCards(contractors, targetGrid);
            return;
        }

        const contractors = contractorsToRender || this.dataModule.getContractors();
        
        console.log('UIManager: renderContractors -', {
            contractorsCount: contractors.length,
            lazyLoaderAvailable: !!this.lazyLoader
        });

        if (this.lazyLoader) {
            this.lazyLoader.render(contractors);
        } else {
            this.cardManager.renderContractorCards(contractors, this.elements.contractorsGrid);
        }
    }

    // === MODAL METHODS ===

    showContractorModal = () => this.elements.contractorModal.style.display = 'flex';
    hideContractorModal = () => this.elements.contractorModal.style.display = 'none';

    updateContractorDetails(contractorId) {
        const contractor = this.dataModule.getContractor(contractorId);
        if (contractor) {
            console.log('Updating contractor details for:', contractor.name);
        }
    }

    // === LAZY LOADING CONTROL ===

    setLazyLoading(enabled) {
        if (this.lazyLoader) {
            this.lazyLoader.setEnabled(enabled);
        }
    }
}