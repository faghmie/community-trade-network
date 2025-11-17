// js/app/filterManager.js
// ES6 Module for pure filter management (no UI rendering)

export class FilterManager {
    constructor() {
        this.elements = {};
        this.eventHandlers = {
            onFiltersChange: null,
            onViewChange: null
        };
        this.currentFilters = {};
        this.isAdvancedFiltersVisible = false;
        this.dataModule = null;
    }

    async init(dataModule) {
        this.dataModule = dataModule;
        this.cacheElements();
        this.bindEvents();
        this.updateFilterCount();
        this.updateClearButton();
        this.updateViewToggle();

        // Initialize the toggle button with correct initial state
        this.initializeToggleButton();

        // Set initial filters to empty
        this.currentFilters = {
            searchTerm: '',
            category: '',
            location: '',
            rating: '',
            favorites: '',
            sortBy: 'name'
        };
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
            clearFiltersBtn: document.querySelector('[data-action="clear-filters"]'),
            viewToggle: document.getElementById('view-toggle'),
            viewToggleBtns: document.querySelectorAll('#view-toggle .btn'),
            expansionIcon: document.querySelector('.expansion-icon'),
            expansionHeader: document.querySelector('.expansion-header')
        };
    }

    // Initialize toggle button with correct icon
    initializeToggleButton() {
        const { toggleFiltersBtn, advancedFilters } = this.elements;
        if (!toggleFiltersBtn || !advancedFilters) return;

        // Set initial state - advanced filters should be hidden by default
        this.isAdvancedFiltersVisible = false;
        
        const icon = toggleFiltersBtn.querySelector('.material-icons');
        const textSpans = toggleFiltersBtn.querySelectorAll('span');

        // Find the text span (not the badge)
        let textSpan = null;
        for (let span of textSpans) {
            if (!span.classList.contains('filter-badge') && !span.classList.contains('material-badge')) {
                textSpan = span;
                break;
            }
        }

        // Update button to reflect initial hidden state
        if (icon) icon.textContent = 'expand_more';
        if (textSpan) textSpan.textContent = 'More Filters';
        toggleFiltersBtn.classList.remove('active');
    }

    bindEvents() {
        const { searchInput, toggleFiltersBtn, viewToggle, expansionHeader } = this.elements;

        // Search input with debounce
        if (searchInput) {
            const debouncedSearch = utils.debounce(() => this.applyCurrentFilters(), 300);
            searchInput.addEventListener('input', debouncedSearch);
        }

        // Toggle filters button - FIXED: Handle click properly
        if (toggleFiltersBtn) {
            toggleFiltersBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleAdvancedFilters();
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

        // Expansion header click for advanced filters
        if (expansionHeader) {
            expansionHeader.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleAdvancedFilters();
            });
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
                    this.updateClearButton();
                });
            }
        });
    }

    handleViewToggle(button) {
        const { viewToggleBtns } = this.elements;
        const view = button.getAttribute('data-view');

        if (!view) return;

        viewToggleBtns.forEach(btn => {
            btn.classList.remove('active');
        });

        button.classList.add('active');

        if (this.eventHandlers.onViewChange) {
            this.eventHandlers.onViewChange(view);
        }

        if (typeof utils !== 'undefined' && utils.showNotification) {
            const viewName = view === 'list' ? 'List View' : 'Map View';
            utils.showNotification(`Switched to ${viewName}`, 'info', 2000);
        }
    }

    onFiltersChange(callback) {
        this.eventHandlers.onFiltersChange = callback;
    }

    onViewChange(callback) {
        this.eventHandlers.onViewChange = callback;
    }

    // FIXED: Improved toggle function that works with CSS transitions
    toggleAdvancedFilters() {
        const { advancedFilters, toggleFiltersBtn, expansionIcon } = this.elements;

        if (!advancedFilters || !toggleFiltersBtn) {
            console.warn('Advanced filters elements not found');
            return;
        }

        this.isAdvancedFiltersVisible = !this.isAdvancedFiltersVisible;

        // FIXED: Use a more reliable approach that works with CSS transitions
        if (this.isAdvancedFiltersVisible) {
            // Show advanced filters
            advancedFilters.classList.remove('hidden');
            
            // Force a reflow to ensure the transition works
            void advancedFilters.offsetHeight;
            
            // Update button and icon
            this.updateToggleButtonState('expand_less', 'Less Filters', true);
            
        } else {
            // Hide advanced filters
            advancedFilters.classList.add('hidden');
            
            // Update button and icon
            this.updateToggleButtonState('expand_more', 'More Filters', false);
        }

        // Update expansion icon if exists
        if (expansionIcon) {
            expansionIcon.textContent = this.isAdvancedFiltersVisible ? 'expand_less' : 'expand_more';
        }

        this.updateFilterCount();
    }

    // Helper method to update toggle button state
    updateToggleButtonState(iconName, text, isActive) {
        const { toggleFiltersBtn } = this.elements;
        if (!toggleFiltersBtn) return;

        const icon = toggleFiltersBtn.querySelector('.material-icons');
        const textSpans = toggleFiltersBtn.querySelectorAll('span');

        // Find the text span (not the badge)
        let textSpan = null;
        for (let span of textSpans) {
            if (!span.classList.contains('filter-badge') && !span.classList.contains('material-badge')) {
                textSpan = span;
                break;
            }
        }

        if (icon) icon.textContent = iconName;
        if (textSpan) textSpan.textContent = text;

        if (isActive) {
            toggleFiltersBtn.classList.add('active');
        } else {
            toggleFiltersBtn.classList.remove('active');
        }
    }

    applyCurrentFilters() {
        const { searchInput, categoryFilter, locationFilter, ratingFilter, favoritesFilter, sortBy } = this.elements;

        this.currentFilters = {
            searchTerm: searchInput?.value || '',
            category: categoryFilter?.value || '',
            location: locationFilter?.value || '',
            rating: ratingFilter?.value || '',
            favorites: favoritesFilter?.value || '',
            sortBy: sortBy?.value || 'name'
        };

        console.log('🔍 DEBUG - Current filter values:', this.currentFilters);

        if (this.eventHandlers.onFiltersChange) {
            this.eventHandlers.onFiltersChange(this.currentFilters);
        }

        this.updateFilterCount();
        this.updateClearButton();
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

    updateViewToggle() {
        const { viewToggleBtns } = this.elements;

        if (!viewToggleBtns) return;

        const listViewBtn = document.querySelector('[data-view="list"]');
        if (listViewBtn && !document.querySelector('#view-toggle .btn.active')) {
            listViewBtn.classList.add('active');

            const mapViewBtn = document.querySelector('[data-view="map"]');
            if (mapViewBtn) {
                mapViewBtn.classList.remove('active');
            }
        }
    }

    getActiveFilterCount() {
        const { locationFilter, ratingFilter, categoryFilter, favoritesFilter, searchInput, sortBy } = this.elements;

        let count = 0;

        if (locationFilter?.value) count++;
        if (ratingFilter?.value) count++;
        if (categoryFilter?.value) count++;
        if (favoritesFilter?.value) count++;
        if (searchInput?.value.trim()) count++;
        if (sortBy?.value && sortBy.value !== 'name') count++;

        return count;
    }

    applyFilters(filters) {
        if (!this.dataModule) {
            console.error('DataModule not available for filtering');
            return [];
        }

        console.log('🔍 DEBUG - applyFilters called with:', filters);

        // Get all contractors first to see the baseline
        const allContractors = this.dataModule.getContractors();
        console.log('🔍 DEBUG - Total contractors available:', allContractors.length);

        let contractors = this.dataModule.searchContractors(
            filters.searchTerm,
            filters.category,
            filters.rating,
            filters.location
        );

        console.log('🔍 DEBUG - Contractors after search filters:', contractors.length);

        // Check if favorites filter is being applied
        if (filters.favorites) {
            console.log('🔍 DEBUG - Favorites filter IS being applied:', filters.favorites);
            if (filters.favorites === 'favorites') {
                const beforeCount = contractors.length;
                contractors = contractors.filter(contractor =>
                    this.dataModule.isFavorite(contractor.id)
                );
                console.log('🔍 DEBUG - After favorites filter:', beforeCount, '->', contractors.length);
            } else if (filters.favorites === 'non-favorites') {
                const beforeCount = contractors.length;
                contractors = contractors.filter(contractor =>
                    !this.dataModule.isFavorite(contractor.id)
                );
                console.log('🔍 DEBUG - After non-favorites filter:', beforeCount, '->', contractors.length);
            }
        } else {
            console.log('🔍 DEBUG - No favorites filter being applied');
        }

        console.log('🔍 DEBUG - Final contractors count:', contractors.length);
        return contractors;
    }

    applySorting() {
        const { sortBy } = this.elements;
        const sortValue = sortBy?.value || 'name';

        let contractors = this.applyFilters(this.currentFilters);

        contractors.sort((a, b) => {
            switch (sortValue) {
                case 'rating':
                    return parseFloat(b.rating) - parseFloat(a.rating);
                case 'reviews':
                    return b.reviews.length - a.reviews.length;
                case 'location':
                    return (a.location || '').localeCompare(b.location || '');
                case 'favorites':
                    const aFavorite = this.dataModule.isFavorite(a.id);
                    const bFavorite = this.dataModule.isFavorite(b.id);
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

        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = '';
        if (locationFilter) locationFilter.value = '';
        if (ratingFilter) ratingFilter.value = '';
        if (favoritesFilter) favoritesFilter.value = '';
        if (sortBy) sortBy.value = 'name';

        this.applyCurrentFilters();

        if (this.isAdvancedFiltersVisible) {
            this.toggleAdvancedFilters();
        }

        this.updateClearButton();

        if (typeof utils !== 'undefined' && utils.showNotification) {
            utils.showNotification('All filters cleared', 'success');
        }
    }

    resetToDefault() {
        this.clearFilters();
    }

    setCurrentView(view) {
        const { viewToggleBtns } = this.elements;

        if (!viewToggleBtns) return;

        viewToggleBtns.forEach(btn => {
            const btnView = btn.getAttribute('data-view');
            if (btnView === view) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    getFilterState() {
        return {
            filters: this.currentFilters,
            activeCount: this.getActiveFilterCount(),
            isAdvancedVisible: this.isAdvancedFiltersVisible,
            currentView: this.getCurrentView()
        };
    }

    getCurrentView() {
        const { viewToggleBtns } = this.elements;

        if (!viewToggleBtns) return 'list';

        const activeBtn = Array.from(viewToggleBtns).find(btn =>
            btn.classList.contains('active')
        );

        return activeBtn ? activeBtn.getAttribute('data-view') : 'list';
    }
}