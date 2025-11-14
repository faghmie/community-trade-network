// js/app/filterManager.js
class FilterManager {
    constructor() {
        this.elements = {};
        this.eventHandlers = {
            onFiltersChange: null
        };
        this.currentFilters = {};
        this.isAdvancedFiltersVisible = false;
    }

    async init() {
        this.cacheElements();
        this.bindEvents();
        this.updateFilterCount();
        this.updateClearButton(); // NEW: Initialize clear button state
    }

    cacheElements() {
        this.elements = {
            searchInput: document.getElementById('searchInput'),
            categoryFilter: document.getElementById('categoryFilter'),
            locationFilter: document.getElementById('locationFilter'),
            ratingFilter: document.getElementById('ratingFilter'),
            favoritesFilter: document.getElementById('favoritesFilter'),
            sortBy: document.getElementById('sortBy'),
            toggleFiltersBtn: document.getElementById('toggleFiltersBtn'),
            advancedFilters: document.getElementById('advancedFilters'),
            activeFilterCount: document.getElementById('activeFilterCount'),
            clearFiltersBtn: document.querySelector('[data-action="clear-filters"]') // NEW
        };
    }

    bindEvents() {
        const { searchInput, toggleFiltersBtn } = this.elements;
        
        if (searchInput) {
            const debouncedSearch = utils.debounce(() => this.applyCurrentFilters(), 300);
            searchInput.addEventListener('input', debouncedSearch);
        }

        if (toggleFiltersBtn) {
            toggleFiltersBtn.addEventListener('click', () => this.toggleAdvancedFilters());
        }

        // Add event listeners for all filter changes
        this.setupFilterEventListeners();
    }

    setupFilterEventListeners() {
        const { categoryFilter, locationFilter, ratingFilter, favoritesFilter, sortBy } = this.elements;
        
        const filters = [categoryFilter, locationFilter, ratingFilter, favoritesFilter, sortBy];
        
        filters.forEach(filter => {
            if (filter) {
                filter.addEventListener('change', () => {
                    this.applyCurrentFilters();
                    this.updateFilterCount();
                    this.updateClearButton(); // NEW: Update clear button on filter changes
                });
            }
        });
    }

    onFiltersChange(callback) {
        this.eventHandlers.onFiltersChange = callback;
    }

    toggleAdvancedFilters() {
        const { advancedFilters, toggleFiltersBtn } = this.elements;
        
        if (!advancedFilters || !toggleFiltersBtn) return;

        this.isAdvancedFiltersVisible = !this.isAdvancedFiltersVisible;

        if (this.isAdvancedFiltersVisible) {
            advancedFilters.classList.remove('hidden');
            toggleFiltersBtn.innerHTML = '<i class="fas fa-sliders-h"></i> Less Filters';
            toggleFiltersBtn.classList.add('active');
        } else {
            advancedFilters.classList.add('hidden');
            toggleFiltersBtn.innerHTML = '<i class="fas fa-sliders-h"></i> More Filters';
            toggleFiltersBtn.classList.remove('active');
        }
    }

    applyCurrentFilters() {
        const { searchInput, categoryFilter, locationFilter, ratingFilter, favoritesFilter } = this.elements;
        
        this.currentFilters = {
            searchTerm: searchInput?.value || '',
            category: categoryFilter?.value || '',
            location: locationFilter?.value || '',
            rating: ratingFilter?.value || '',
            favorites: favoritesFilter?.value || ''
        };

        if (this.eventHandlers.onFiltersChange) {
            this.eventHandlers.onFiltersChange(this.currentFilters);
        }

        this.updateFilterCount();
        this.updateClearButton(); // NEW: Update clear button state
    }

    updateFilterCount() {
        const { activeFilterCount } = this.elements;
        
        if (!activeFilterCount) return;

        const activeFilters = this.getActiveFilterCount();

        // Update compact filter badge only
        if (activeFilters > 0) {
            activeFilterCount.textContent = activeFilters;
            activeFilterCount.classList.remove('hidden');
        } else {
            activeFilterCount.classList.add('hidden');
        }
    }

    // NEW: Update clear button visibility based on active filters
    updateClearButton() {
        const { clearFiltersBtn } = this.elements;
        
        if (!clearFiltersBtn) return;

        const hasActiveFilters = this.getActiveFilterCount() > 0;

        if (hasActiveFilters) {
            clearFiltersBtn.classList.remove('hidden');
            clearFiltersBtn.style.display = 'inline-flex'; // Ensure it's visible
        } else {
            clearFiltersBtn.classList.add('hidden');
            clearFiltersBtn.style.display = 'none'; // Ensure it's hidden
        }
    }

    getActiveFilterCount() {
        const { locationFilter, ratingFilter, categoryFilter, favoritesFilter, searchInput, sortBy } = this.elements;
        
        let count = 0;

        // Count basic filters
        if (locationFilter?.value) count++;
        if (ratingFilter?.value) count++;
        
        // Count advanced filters
        if (categoryFilter?.value) count++;
        if (favoritesFilter?.value) count++;
        
        // Count search term if not empty
        if (searchInput?.value.trim()) count++;

        // Count sort if not default (name)
        if (sortBy?.value && sortBy.value !== 'name') count++;

        return count;
    }

    applyFilters(filters) {
        let contractors = dataModule.searchContractors(
            filters.searchTerm,
            filters.category,
            filters.rating,
            filters.location
        );

        // Apply additional filters
        if (filters.favorites) {
            if (filters.favorites === 'favorites') {
                contractors = contractors.filter(contractor => 
                    dataModule.isFavorite(contractor.id)
                );
            } else if (filters.favorites === 'non-favorites') {
                contractors = contractors.filter(contractor => 
                    !dataModule.isFavorite(contractor.id)
                );
            }
        }

        return contractors;
    }

    applySorting() {
        const { sortBy } = this.elements;
        const sortValue = sortBy?.value || 'name';
        
        let contractors = this.applyFilters(this.currentFilters);
        
        contractors.sort((a, b) => {
            switch(sortValue) {
                case 'rating':
                    return parseFloat(b.rating) - parseFloat(a.rating);
                case 'reviews':
                    return b.reviews.length - a.reviews.length;
                case 'location':
                    return (a.location || '').localeCompare(b.location || '');
                case 'favorites':
                    const aFavorite = dataModule.isFavorite(a.id);
                    const bFavorite = dataModule.isFavorite(b.id);
                    if (aFavorite && !bFavorite) return -1;
                    if (!aFavorite && bFavorite) return 1;
                    return a.name.localeCompare(b.name);
                case 'name':
                default:
                    return a.name.localeCompare(b.name);
            }
        });

        return contractors;
    }

    clearFilters() {
        const { searchInput, categoryFilter, locationFilter, ratingFilter, favoritesFilter, sortBy } = this.elements;
        
        // Clear all filter values
        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = '';
        if (locationFilter) locationFilter.value = '';
        if (ratingFilter) ratingFilter.value = '';
        if (favoritesFilter) favoritesFilter.value = '';
        if (sortBy) sortBy.value = 'name';

        // Apply the cleared filters
        this.applyCurrentFilters();
        
        // Hide advanced filters if they're open
        if (this.isAdvancedFiltersVisible) {
            this.toggleAdvancedFilters();
        }

        // Update clear button (will hide it since no filters are active)
        this.updateClearButton();

        // Show notification
        if (typeof utils !== 'undefined' && utils.showNotification) {
            utils.showNotification('All filters cleared', 'success');
        }
    }

    // Quick filter methods
    showFavoritesOnly() {
        const { favoritesFilter } = this.elements;
        if (favoritesFilter) {
            favoritesFilter.value = 'favorites';
            this.applyCurrentFilters();
            
            // Ensure advanced filters are visible
            if (!this.isAdvancedFiltersVisible) {
                this.toggleAdvancedFilters();
            }
        }
    }

    showHighRated() {
        const { ratingFilter } = this.elements;
        if (ratingFilter) {
            ratingFilter.value = '4.5';
            this.applyCurrentFilters();
        }
    }

    resetToDefault() {
        this.clearFilters();
    }

    // Get current filter state for debugging
    getFilterState() {
        return {
            filters: this.currentFilters,
            activeCount: this.getActiveFilterCount(),
            isAdvancedVisible: this.isAdvancedFiltersVisible
        };
    }
}