// js/app/views/searchView.js - Updated with proper province data loading
import { BaseView } from './BaseView.js';
import { createViewHeader } from '../utils/viewHelpers.js';

export class SearchView extends BaseView {
    constructor(dataModule) {
        super('searchView');
        this.dataModule = dataModule;
        this.currentFilters = {
            category: '',
            location: '',
            minRating: 0,
            favoritesOnly: false,
            categoryType: ''
        };
        this.filteredContractors = [];
        this.elements = {};
        this.isApplyingFilters = false;
    }

    /**
     * Render the search view
     */
    render() {
        const mainContainer = document.getElementById('mainViewContainer');
        if (!mainContainer) return;

        // Create or reuse container
        if (!this.container) {
            this.container = document.createElement('section');
            this.container.id = this.viewId;
            this.container.className = 'search-view';
            mainContainer.appendChild(this.container);
        }

        // Clear and render fresh content
        this.container.innerHTML = '';

        // Use standardized view header
        const header = createViewHeader(
            'searchView',
            'Find Local Services',
            'Filter through our community directory',
            true
        );

        this.container.innerHTML = `
            ${header.html}

            <!-- Visible Filter Form -->
            <div class="search-filters-panel">
                <div class="filters-header">
                    <h3 class="filters-title">
                        <i class="material-icons" data-icon="filter_list">filter_list</i>
                        Filters
                    </h3>
                    <button class="btn btn-text clear-filters-btn" data-action="clear-filters">
                        <i class="material-icons" data-icon="clear_all">clear_all</i>
                        Clear All
                    </button>
                </div>

                <div class="filters-grid">
                    <!-- Location Filter -->
                    <div class="material-form-group filter-group">
                        <label for="searchLocationFilter" class="material-input-label">
                            <i class="material-icons" data-icon="location_on">location_on</i>
                            Location
                        </label>
                        <select id="searchLocationFilter" class="material-select">
                            <option value="">All Locations</option>
                            <!-- Locations will be populated dynamically -->
                        </select>
                    </div>

                    <!-- Category Filter -->
                    <div class="material-form-group filter-group">
                        <label for="searchCategoryFilter" class="material-input-label">
                            <i class="material-icons" data-icon="category">category</i>
                            Category
                        </label>
                        <select id="searchCategoryFilter" class="material-select">
                            <option value="">All Categories</option>
                            <!-- Categories will be populated dynamically -->
                        </select>
                    </div>

                    <!-- Rating Filter -->
                    <div class="material-form-group filter-group">
                        <label for="searchRatingFilter" class="material-input-label">
                            <i class="material-icons" data-icon="star">star</i>
                            Minimum Rating
                        </label>
                        <select id="searchRatingFilter" class="material-select">
                            <option value="">All Ratings</option>
                            <option value="4.5">4.5+ Stars</option>
                            <option value="4.0">4.0+ Stars</option>
                            <option value="3.5">3.5+ Stars</option>
                            <option value="3.0">3.0+ Stars</option>
                        </select>
                    </div>

                    <!-- Favorites Filter -->
                    <div class="material-form-group filter-group favorites-filter">
                        <label class="material-checkbox-label">
                            <input type="checkbox" id="searchFavoritesFilter" class="material-checkbox">
                            <span class="material-checkbox-checkmark"></span>
                            <span class="material-checkbox-text">
                                <i class="material-icons" data-icon="favorite">favorite</i>
                                Show Favorites Only
                            </span>
                        </label>
                    </div>
                </div>

                <!-- Active Filters Badge -->
                <div class="active-filters-badge hidden" id="activeFiltersBadge">
                    <span class="badge-count">0</span> active filters
                </div>

                <!-- Show Results Button -->
                <div class="search-actions">
                    <button class="btn btn-primary show-results-btn" data-action="show-results" id="showResultsBtn">
                        <i class="material-icons" data-icon="search">search</i>
                        Show Results (<span id="resultsCount">0</span>)
                    </button>
                </div>
            </div>

            <!-- NO RESULTS SECTION IN SEARCH VIEW - Results will be shown in contractors view -->
        `;

        this.cacheElements();
        this.bindEvents();

        // Populate filter dropdowns
        this.populateFilterOptions();

        // Apply current filters to update counts
        this.applyCurrentFilters();

        // Hide the view initially (BaseView uses display: none)
        this.hide();
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            // Filter elements
            locationFilter: document.getElementById('searchLocationFilter'),
            categoryFilter: document.getElementById('searchCategoryFilter'),
            ratingFilter: document.getElementById('searchRatingFilter'),
            favoritesFilter: document.getElementById('searchFavoritesFilter'),
            clearFiltersBtn: document.querySelector('.clear-filters-btn'),
            showResultsBtn: document.getElementById('showResultsBtn'),
            resultsCount: document.getElementById('resultsCount'),
            activeFiltersBadge: document.getElementById('activeFiltersBadge')
        };
    }

    /**
     * Populate filter dropdowns with data
     */
    populateFilterOptions() {
        this.populateLocationFilter();
        this.populateCategoryFilter();
    }

    /**
     * Populate location filter dropdown with provinces from data module
     */
    populateLocationFilter() {
        if (!this.elements.locationFilter) return;

        // Get provinces data from data module
        const provincesData = this.dataModule.getLocationsData();
        if (!provincesData || typeof provincesData !== 'object') {
            console.warn('⚠️ No provinces data available from data module');
            return;
        }

        console.log('📍 Populating location filter with provinces:', Object.keys(provincesData));

        // Clear existing options except the first one
        while (this.elements.locationFilter.options.length > 1) {
            this.elements.locationFilter.remove(1);
        }

        // Get province names and sort them alphabetically
        const provinceNames = Object.keys(provincesData).sort();

        // Add province options
        provinceNames.forEach(provinceName => {
            const option = document.createElement('option');
            option.value = provinceName;
            option.textContent = provinceName;
            this.elements.locationFilter.appendChild(option);
        });

        console.log(`✅ Added ${provinceNames.length} provinces to location filter`);
    }

    /**
     * Populate category filter dropdown
     */
    populateCategoryFilter() {
        if (!this.elements.categoryFilter) return;

        const categories = this.dataModule.getCategories();
        if (!categories || !Array.isArray(categories)) {
            console.warn('⚠️ No categories data available from data module');
            return;
        }

        console.log('📂 Populating category filter with categories:', categories.length);

        // Clear existing options except the first one
        while (this.elements.categoryFilter.options.length > 1) {
            this.elements.categoryFilter.remove(1);
        }

        // Add category options
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name;
            this.elements.categoryFilter.appendChild(option);
        });

        console.log(`✅ Added ${categories.length} categories to category filter`);
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Use standardized back button handler
        const backButton = document.getElementById('searchViewBackBtn');
        if (backButton) {
            backButton.addEventListener('click', () => this.handleBack());
        }

        // Filter changes - apply immediately for better UX
        ['locationFilter', 'categoryFilter', 'ratingFilter'].forEach(filterName => {
            if (this.elements[filterName]) {
                this.elements[filterName].addEventListener('change', () => {
                    this.applyCurrentFilters();
                });
            }
        });

        // Favorites checkbox
        if (this.elements.favoritesFilter) {
            this.elements.favoritesFilter.addEventListener('change', () => {
                this.applyCurrentFilters();
            });
        }

        // Clear filters button
        if (this.elements.clearFiltersBtn) {
            this.elements.clearFiltersBtn.addEventListener('click', () => {
                this.clearFilters();
            });
        }

        // Show results button
        if (this.elements.showResultsBtn) {
            this.elements.showResultsBtn.addEventListener('click', () => {
                this.showResults();
            });
        }

        // Category selection events
        document.addEventListener('categorySelected', (event) => {
            if (this.isVisible) {
                this.handleCategoryTypeFilter(event.detail.type, event.detail.categoryNames);
            }
        });
    }

    /**
     * Handle back navigation
     */
    handleBack() {
        document.dispatchEvent(new CustomEvent('navigationViewChange', {
            detail: {
                view: 'back'
            }
        }));
    }

    /**
     * Show results in contractors view
     */
    showResults() {
        console.log('🔍 SearchView: Showing results in contractors view', {
            filters: this.currentFilters,
            resultsCount: this.filteredContractors.length
        });

        // Navigate to contractors view with the filtered results
        document.dispatchEvent(new CustomEvent('navigationViewChange', {
            detail: {
                view: 'contractors',
                context: {
                    searchFilters: { ...this.currentFilters },
                    filteredContractors: this.filteredContractors
                }
            }
        }));
    }

    /**
     * Handle category type filter
     */
    handleCategoryTypeFilter(type, categoryNames) {
        this.currentFilters.categoryType = type;
        this.currentFilters.categoryTypeNames = categoryNames;
        this.applyCurrentFilters();
    }

    /**
     * Apply current filters and update UI
     */
    applyCurrentFilters() {
        // Prevent infinite recursion
        if (this.isApplyingFilters) {
            return;
        }

        this.isApplyingFilters = true;

        try {
            this.updateFiltersFromUI();
            this.filteredContractors = this.applyFiltersAndSorting();
            this.updateUIState();

            // Notify other components
            document.dispatchEvent(new CustomEvent('filtersChanged', {
                detail: {
                    filters: this.currentFilters,
                    results: this.filteredContractors
                }
            }));
        } finally {
            this.isApplyingFilters = false;
        }
    }

    /**
     * Update filters from UI elements
     */
    updateFiltersFromUI() {
        this.currentFilters = {
            category: this.elements.categoryFilter?.value || '',
            location: this.elements.locationFilter?.value || '',
            minRating: parseFloat(this.elements.ratingFilter?.value) || 0,
            favoritesOnly: this.elements.favoritesFilter?.checked || false,
            categoryType: this.currentFilters.categoryType,
            categoryTypeNames: this.currentFilters.categoryTypeNames
        };
    }

    /**
     * Apply filters and sorting to contractors
     */
    applyFiltersAndSorting() {
        let contractors = this.dataModule.getContractors();

        // Apply category filter
        if (this.currentFilters.category) {
            contractors = contractors.filter(c => c.category === this.currentFilters.category);
        }

        // Apply category type filter
        if (this.currentFilters.categoryTypeNames?.length > 0) {
            contractors = contractors.filter(c =>
                this.currentFilters.categoryTypeNames.includes(c.category)
            );
        }

        // Apply location filter
        if (this.currentFilters.location) {
            contractors = contractors.filter(c =>
                c.location && c.location.includes(this.currentFilters.location)
            );
        }

        // Apply rating filter
        if (this.currentFilters.minRating > 0) {
            contractors = contractors.filter(c =>
                parseFloat(c.rating) >= this.currentFilters.minRating
            );
        }

        // Apply favorites filter
        if (this.currentFilters.favoritesOnly) {
            contractors = contractors.filter(c => this.dataModule.isFavorite(c.id));
        }

        // Return contractors sorted by name (default)
        return contractors.sort((a, b) => a.name.localeCompare(b.name));
    }

    /**
     * Update UI state based on filter results
     */
    updateUIState() {
        this.updateResultsCount();
        this.updateFilterIndicators();
        this.updateShowResultsButton();
    }

    /**
     * Update results count in the show results button
     */
    updateResultsCount() {
        if (this.elements.resultsCount) {
            const count = this.filteredContractors.length;
            this.elements.resultsCount.textContent = count;
        }
    }

    /**
     * Update show results button state
     */
    updateShowResultsButton() {
        if (this.elements.showResultsBtn) {
            const hasResults = this.filteredContractors.length > 0;
            const hasActiveFilters = this.hasActiveFilters();

            // Enable/disable button based on whether we have results or active filters
            this.elements.showResultsBtn.disabled = !hasResults && !hasActiveFilters;

            // Update button text based on results
            if (hasResults) {
                this.elements.showResultsBtn.innerHTML = `
                    <i class="material-icons" data-icon="search">search</i>
                    Show Results (${this.filteredContractors.length})
                `;
            } else {
                this.elements.showResultsBtn.innerHTML = `
                    <i class="material-icons" data-icon="search">search</i>
                    Show Results (0)
                `;
            }
        }
    }

    /**
     * Update filter indicators and badges
     */
    updateFilterIndicators() {
        const activeCount = this.getActiveFilterCount();

        // Update active filters badge
        if (this.elements.activeFiltersBadge) {
            if (activeCount > 0) {
                this.elements.activeFiltersBadge.classList.remove('hidden');
                const badgeCount = this.elements.activeFiltersBadge.querySelector('.badge-count');
                if (badgeCount) {
                    badgeCount.textContent = activeCount;
                }
            } else {
                this.elements.activeFiltersBadge.classList.add('hidden');
            }
        }

        // Update bottom nav filter badge
        const searchNavItem = document.querySelector('[data-view="search"]');
        let badge = searchNavItem?.querySelector('.bottom-nav-badge');

        if (activeCount > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'bottom-nav-badge filter-badge';
                searchNavItem.appendChild(badge);
            }
            badge.textContent = activeCount;
            badge.classList.remove('hidden');
        } else if (badge) {
            badge.classList.add('hidden');
        }
    }

    /**
     * Check if any filters are active
     */
    hasActiveFilters() {
        return (
            this.currentFilters.category !== '' ||
            this.currentFilters.location !== '' ||
            this.currentFilters.minRating > 0 ||
            this.currentFilters.favoritesOnly ||
            this.currentFilters.categoryType !== ''
        );
    }

    /**
     * Count active filters for badge
     */
    getActiveFilterCount() {
        let count = 0;
        if (this.currentFilters.category) count++;
        if (this.currentFilters.location) count++;
        if (this.currentFilters.minRating > 0) count++;
        if (this.currentFilters.favoritesOnly) count++;
        if (this.currentFilters.categoryType) count++;
        return count;
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        console.log('🔍 SearchView: Clearing all filters');

        // Reset UI elements
        if (this.elements.categoryFilter) this.elements.categoryFilter.value = '';
        if (this.elements.locationFilter) this.elements.locationFilter.value = '';
        if (this.elements.ratingFilter) this.elements.ratingFilter.value = '';
        if (this.elements.favoritesFilter) this.elements.favoritesFilter.checked = false;

        // Reset internal state
        this.currentFilters = {
            category: '',
            location: '',
            minRating: 0,
            favoritesOnly: false,
            categoryType: '',
            categoryTypeNames: []
        };

        this.applyCurrentFilters();
    }

    /**
     * Apply favorites filter
     */
    applyFavoritesFilter() {
        this.clearFilters();
        this.currentFilters.favoritesOnly = true;
        this.applyCurrentFilters();
    }

    /**
     * Show the search view
     */
    show() {
        super.show();
        this.applyCurrentFilters(); // Refresh filters when shown
    }

    /**
     * Hide the search view
     */
    hide() {
        super.hide();
    }

    /**
     * Refresh the view
     */
    refresh() {
        // Only apply filters if not already applying them
        if (!this.isApplyingFilters) {
            this.applyCurrentFilters();
        }
    }

    /**
     * Utility function for debouncing
     */
    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
}