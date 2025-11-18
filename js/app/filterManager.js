// js/app/filterManager.js - FIXED: Proper favorites handling without breaking existing filters

export class FilterManager {
    constructor() {
        this.elements = {};
        this.eventHandlers = {
            onFiltersChange: null,
            onViewChange: null
        };
        this.currentFilters = {};
        this.isAdvancedFiltersVisible = true;
        this.isFilterPanelVisible = false;
        this.dataModule = null;
        this.categoriesModule = null;
    }

    async init(dataModule) {
        this.dataModule = dataModule;
        this.categoriesModule = this.dataModule.getCategoriesModule();
        this.cacheElements();
        this.bindEvents();
        this.updateFilterCount();
        this.updateClearButton();
        this.updateFilterIndicator();

        // Initialize filter panel as hidden
        this.hideFilterPanel();

        // Initialize all filter options
        this.refreshAllFilters();

        // Set initial filters to empty
        this.currentFilters = {
            searchTerm: '',
            category: '',
            location: '',
            rating: '',
            favorites: '', // Programmatic filter - no form element
            sortBy: 'name'
        };

        // Apply initial filters to show all contractors
        this.applyCurrentFilters();
    }
    cacheElements() {
        this.elements = {
            searchInput: document.getElementById('searchInput'),
            categoryFilter: document.getElementById('categoryFilter'),
            locationFilter: document.getElementById('locationFilter'),
            ratingFilter: document.getElementById('ratingFilter'),
            sortBy: document.getElementById('sortBy'),
            toggleFiltersBtn: document.getElementById('toggleFiltersBtn'),
            advancedFilters: document.getElementById('advancedFilters'),
            activeFilterCount: document.getElementById('activeFilterCount'),
            clearFiltersBtn: document.querySelector('[data-action="clear-filters"]'),
            viewToggle: document.getElementById('view-toggle'),
            viewToggleBtns: document.querySelectorAll('#view-toggle .btn'),
            expansionIcon: document.querySelector('.expansion-icon'),
            expansionHeader: document.querySelector('.expansion-header'),
            // FIXED: Use correct element ID 'filtersSheet' instead of 'filtersPanel'
            filtersPanel: document.getElementById('filtersSheet'),
            closeFiltersPanel: document.getElementById('closeFiltersPanel'),
            // Bottom navigation elements
            bottomNavItems: document.querySelectorAll('.bottom-nav-item'),
            // UI elements for view management
            mapContainer: document.getElementById('map-container'),
            contractorList: document.getElementById('contractorList')
        };

        // Hide toggle button and expansion header
        if (this.elements.toggleFiltersBtn) {
            this.elements.toggleFiltersBtn.style.display = 'none';
        }
        if (this.elements.expansionHeader) {
            this.elements.expansionHeader.style.display = 'none';
        }

        if (this.elements.advancedFilters) {
            this.elements.advancedFilters.classList.remove('hidden');
        }
    }

    bindEvents() {
        const { searchInput, viewToggle, closeFiltersPanel, quickFilterChips, bottomNavItems } = this.elements;

        // Search input with debounce
        if (searchInput) {
            const debouncedSearch = this.debounce(() => this.applyCurrentFilters(), 300);
            searchInput.addEventListener('input', debouncedSearch);
        }

        // Close filters panel button
        if (closeFiltersPanel) {
            closeFiltersPanel.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideFilterPanel();
            });
        }

        // Bottom navigation items
        if (bottomNavItems) {
            bottomNavItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const view = item.getAttribute('data-view');
                    this.handleBottomNavigation(view, item);
                });
            });
        }

        // View toggle event delegation
        if (viewToggle) {
            viewToggle.addEventListener('click', (e) => {
                const button = e.target.closest('.btn');
                if (button && button.hasAttribute('data-view')) {
                    e.preventDefault();
                    this.handleViewToggle(button);
                }
            });
        }

        // Add event listeners for all filter changes
        this.setupFilterEventListeners();
    }

    debounce(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    setupFilterEventListeners() {
        const { categoryFilter, locationFilter, ratingFilter, sortBy } = this.elements;

        // REMOVED: favoritesFilter from event listeners - it doesn't exist
        const filters = [categoryFilter, locationFilter, ratingFilter, sortBy];

        filters.forEach(filter => {
            if (filter) {
                filter.addEventListener('change', () => {
                    this.applyCurrentFilters();
                    this.updateFilterCount();
                    this.updateClearButton();
                    this.updateFilterIndicator();
                });
            }
        });
    }

    // Handle bottom navigation
    handleBottomNavigation(view, item) {
        console.log('FilterManager: Handling bottom navigation:', view);

        // Update active state
        this.updateBottomNavigationActiveState(view);

        switch (view) {
            case 'home':
                this.showHomeView();
                break;
            case 'favorites':
                this.showFavoritesView();
                break;
            case 'search':
                this.showSearchView(); // This should show the filter panel
                break;
            case 'map':
                this.showMapView();
                break;
            case 'admin':
                this.showAdminView();
                break;
            default:
                console.warn('FilterManager: Unknown bottom nav view:', view);
        }
    }

    // Update bottom navigation active state
    updateBottomNavigationActiveState(activeView) {
        const { bottomNavItems } = this.elements;

        if (!bottomNavItems) return;

        // Remove active class from all items
        bottomNavItems.forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to current item
        const activeItem = document.querySelector(`[data-view="${activeView}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    // Bottom navigation view methods
    showHomeView() {
        console.log('FilterManager: Switching to Home view');
        this.hideFilterPanel();
        this.clearFilters();
        this.notifyViewChange('list');
        this.updateViewState('list');
    }

    showFavoritesView() {
        console.log('FilterManager: Switching to Favorites view');
        this.hideFilterPanel();
        this.applyFavoritesFilter();
        this.notifyViewChange('list');
        this.updateViewState('list');
    }

    showSearchView() {
        console.log('FilterManager: Switching to Search view');
        this.showFilterPanel();
        // REMOVED: this.notifyViewChange('list'); - Don't switch to list view
        // REMOVED: this.updateViewState('list'); - Keep current view state

        // Focus on search input
        setTimeout(() => {
            if (this.elements.searchInput) {
                this.elements.searchInput.focus();
            }
        }, 300);
    }

    showMapView() {
        console.log('FilterManager: Switching to Map view');
        this.hideFilterPanel();
        this.notifyViewChange('map');
        this.updateViewState('map');
    }

    showAdminView() {
        console.log('FilterManager: Switching to Admin view');
        window.location.href = 'admin.html';
    }

    // Update UI view state
    updateViewState(view) {
        const { mapContainer, contractorList, filtersPanel } = this.elements;

        if (view === 'map') {
            // Show map, hide list
            if (mapContainer) mapContainer.classList.remove('hidden');
            if (contractorList) contractorList.classList.add('hidden');
            if (filtersPanel) filtersPanel.classList.add('hidden');
        } else {
            // Show list, hide map
            if (mapContainer) mapContainer.classList.add('hidden');
            if (contractorList) contractorList.classList.remove('hidden');
        }
    }

    // Apply favorites filter - FIXED: Programmatic approach
    applyFavoritesFilter() {
        console.log('FilterManager: Applying favorites filter');

        // Clear other filters first to ensure favorites filter works properly
        this.clearOtherFiltersForFavorites();

        // FIXED: Set favorites filter programmatically (no form element)
        this.currentFilters.favorites = 'favorites';
        console.log('🔍 FilterManager: Set programmatic favorites filter to:', this.currentFilters.favorites);

        // Apply the filters
        this.applyCurrentFilters();
    }

    // Apply high rated filter
    applyHighRatedFilter() {
        console.log('FilterManager: Applying high rated filter');

        // Clear favorites filter when switching to high rated
        this.currentFilters.favorites = '';

        if (this.elements.ratingFilter) {
            this.elements.ratingFilter.value = '4.0';
        }

        this.applyCurrentFilters();
    }

    // Clear other filters when applying favorites to avoid conflicts
    clearOtherFiltersForFavorites() {
        console.log('FilterManager: Clearing other filters for favorites');
        if (this.elements.searchInput) this.elements.searchInput.value = '';
        if (this.elements.categoryFilter) this.elements.categoryFilter.value = '';
        if (this.elements.locationFilter) this.elements.locationFilter.value = '';
        if (this.elements.ratingFilter) this.elements.ratingFilter.value = '';
        if (this.elements.sortBy) this.elements.sortBy.value = 'name';

    }
    // Notify view change
    notifyViewChange(view) {
        if (this.eventHandlers.onViewChange) {
            this.eventHandlers.onViewChange(view);
        }
    }

    handleViewToggle(button) {
        const { viewToggleBtns } = this.elements;
        const view = button.getAttribute('data-view');

        if (!view) return;

        viewToggleBtns.forEach(btn => {
            btn.classList.remove('active');
        });

        button.classList.add('active');

        this.notifyViewChange(view);
        this.updateViewState(view);
    }

    onFiltersChange(callback) {
        this.eventHandlers.onFiltersChange = callback;
    }

    onViewChange(callback) {
        this.eventHandlers.onViewChange = callback;
    }

    applyCurrentFilters() {
        const { searchInput, categoryFilter, locationFilter, ratingFilter, sortBy } = this.elements;

        // FIXED: Create new filters object but preserve programmatic favorites
        const newFilters = {
            searchTerm: searchInput?.value || '',
            category: categoryFilter?.value || '',
            location: locationFilter?.value || '',
            rating: ratingFilter?.value || '',
            sortBy: sortBy?.value || 'name',
            favorites: this.currentFilters.favorites || '' // Preserve programmatic value
        };

        this.currentFilters = newFilters;

        console.log('🔍 FilterManager: Applying current filters:', this.currentFilters);

        // Apply sorting and get filtered contractors
        const filteredContractors = this.applySorting();

        console.log('🔍 FilterManager: Filtered contractors count:', filteredContractors.length);

        // Notify about filter change with the actual filtered contractors
        if (this.eventHandlers.onFiltersChange) {
            this.eventHandlers.onFiltersChange(this.currentFilters, filteredContractors);
        }

        this.updateFilterCount();
        this.updateClearButton();
        this.updateFilterIndicator();
    }

    updateFilterCount() {
        const { activeFilterCount } = this.elements;

        if (!activeFilterCount) return;

        const activeFilters = this.getActiveFilterCount();

        if (activeFilters > 0) {
            activeFilterCount.textContent = activeFilters;
            activeFilterCount.style.display = 'flex';
        } else {
            activeFilterCount.style.display = 'none';
        }
    }

    updateClearButton() {
        const { clearFiltersBtn } = this.elements;

        if (!clearFiltersBtn) return;

        const hasActiveFilters = this.getActiveFilterCount() > 0;

        if (hasActiveFilters) {
            clearFiltersBtn.style.display = 'inline-flex';
            clearFiltersBtn.classList.remove('hidden');
        } else {
            clearFiltersBtn.style.display = 'none';
            clearFiltersBtn.classList.add('hidden');
        }
    }

    // Update filter indicator badge on search navigation button
    updateFilterIndicator() {
        const activeFilterCount = this.getActiveFilterCount();
        console.log('FilterManager: Updating filter indicator to:', activeFilterCount);

        const searchNavItem = document.querySelector('[data-view="search"]');
        let filterBadge = searchNavItem?.querySelector('.bottom-nav-badge');

        if (activeFilterCount > 0) {
            if (!filterBadge) {
                filterBadge = document.createElement('span');
                filterBadge.className = 'bottom-nav-badge filter-badge';
                searchNavItem.appendChild(filterBadge);
            }
            filterBadge.textContent = activeFilterCount;
            filterBadge.classList.remove('hidden');
        } else if (filterBadge) {
            filterBadge.classList.add('hidden');
        }
    }

    getActiveFilterCount() {
        const { locationFilter, ratingFilter, categoryFilter, searchInput, sortBy } = this.elements;

        let count = 0;

        if (locationFilter?.value) count++;
        if (ratingFilter?.value) count++;
        if (categoryFilter?.value) count++;
        if (searchInput?.value.trim()) count++;
        if (sortBy?.value && sortBy.value !== 'name') count++;

        // FIXED: Include programmatic favorites filter in count
        if (this.currentFilters.favorites === 'favorites') count++;

        return count;
    }

    applyFilters(filters) {
        if (!this.dataModule) {
            console.error('DataModule not available for filtering');
            return [];
        }

        console.log('🔍 FilterManager: applyFilters called with:', filters);

        // Get all contractors first for debugging
        const allContractors = this.dataModule.getContractors();
        console.log('🔍 FilterManager: Total contractors available:', allContractors.length);

        // Apply search and basic filters first
        let contractors = this.dataModule.searchContractors(
            filters.searchTerm,
            filters.category,
            filters.rating,
            filters.location
        );

        console.log('🔍 FilterManager: Contractors after search filters:', contractors.length);

        // Apply favorites filter if specified
        if (filters.favorites === 'favorites') {
            console.log('🔍 FilterManager: Applying favorites filter - showing ONLY favorites');
            const beforeCount = contractors.length;

            contractors = contractors.filter(contractor => {
                const isFavorite = this.dataModule.isFavorite(contractor.id);
                return isFavorite;
            });

            console.log('🔍 FilterManager: After favorites filter:', beforeCount, '->', contractors.length);
        }

        console.log('🔍 FilterManager: Final contractors count:', contractors.length);
        return contractors;
    }

    applySorting() {
        const { sortBy } = this.elements;
        const sortValue = sortBy?.value || 'name';

        // Apply filters first, then sort
        let contractors = this.applyFilters(this.currentFilters);

        console.log('🔍 FilterManager: Sorting', contractors.length, 'contractors by:', sortValue);

        contractors.sort((a, b) => {
            let result = 0;

            switch (sortValue) {
                case 'rating':
                    result = parseFloat(b.rating) - parseFloat(a.rating);
                    break;
                case 'reviews':
                    result = b.reviews.length - a.reviews.length;
                    break;
                case 'location':
                    result = (a.location || '').localeCompare(b.location || '');
                    break;
                case 'favorites':
                    const aFavorite = this.dataModule.isFavorite(a.id);
                    const bFavorite = this.dataModule.isFavorite(b.id);
                    if (aFavorite && !bFavorite) result = -1;
                    else if (!aFavorite && bFavorite) result = 1;
                    else result = a.name.localeCompare(b.name);
                    break;
                case 'name':
                default:
                    result = a.name.localeCompare(b.name);
                    break;
            }

            // If primary sort is equal, use name as secondary sort for stability
            if (result === 0) {
                result = a.name.localeCompare(b.name);
            }

            return result;
        });

        return contractors;
    }

    clearFilters() {
        const { searchInput, categoryFilter, locationFilter, ratingFilter, sortBy, quickFilterChips } = this.elements;

        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = '';
        if (locationFilter) locationFilter.value = '';
        if (ratingFilter) ratingFilter.value = '';
        if (sortBy) sortBy.value = 'name';

        // FIXED: Clear programmatic favorites filter
        this.currentFilters.favorites = '';

        this.applyCurrentFilters();
    }

    resetToDefault() {
        this.clearFilters();
    }

    // Show filter panel
    showFilterPanel() {
        const { filtersPanel } = this.elements;
        if (filtersPanel) {
            filtersPanel.classList.remove('hidden');
            this.isFilterPanelVisible = true;
            console.log('🔍 FilterManager: Filter panel shown');

            setTimeout(() => {
                if (this.elements.searchInput) {
                    this.elements.searchInput.focus();
                }
            }, 100);
        } else {
            console.error('❌ FilterManager: filtersPanel element not found!');
        }
    }

    // Hide filter panel
    hideFilterPanel() {
        const { filtersPanel } = this.elements;
        if (filtersPanel) {
            filtersPanel.classList.add('hidden');
            this.isFilterPanelVisible = false;
        }
    }

    // Toggle filter panel visibility
    toggleFilterPanel() {
        if (this.isFilterPanelVisible) {
            this.hideFilterPanel();
        } else {
            this.showFilterPanel();
        }
    }

    // Refresh all filter options
    refreshAllFilters() {
        this.refreshCategoryFilter();
        this.refreshLocationFilter();
        // Apply current filters after refresh
        this.applyCurrentFilters();
    }

    // Refresh category filter
    refreshCategoryFilter() {
        const { categoryFilter } = this.elements;
        const currentValue = categoryFilter?.value;

        if (!this.categoriesModule) {
            console.warn('CategoriesModule not available for filter refresh');
            return;
        }

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

    // Refresh location filter
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

    // Handle external actions
    handleAction(action) {
        console.log('FilterManager: Handling action:', action);

        switch (action) {
            case 'show-filters':
            case 'search':
                this.toggleFilterPanel();
                break;
            case 'hide-filters':
                this.hideFilterPanel();
                break;
            case 'clear-filters':
                this.clearFilters();
                break;
            case 'filter':
            case 'sort':
                this.applyCurrentFilters();
                break;
            case 'apply-filters': // NEW: Handle the Show Results button
                this.applyCurrentFilters();
                this.hideFilterPanel(); // Close the filter panel after applying
                break;
            case 'show-all':
                this.clearFilters();
                break;
            case 'show-favorites':
                this.applyFavoritesFilter();
                break;
            case 'show-high-rated':
                this.applyHighRatedFilter();
                break;
            default:
                console.log('FilterManager: Unhandled action:', action);
        }
    }

    // Update categories when they change
    handleCategoriesUpdated() {
        console.log('FilterManager: Categories updated, refreshing filters');
        this.refreshCategoryFilter();
    }

    // Get unique locations
    getUniqueLocations = (contractors) => [...new Set(contractors
        .map(contractor => contractor.location)
        .filter(location => location && location.trim() !== '')
    )].sort();
}