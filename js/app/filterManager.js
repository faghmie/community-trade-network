// js/app/filterManager.js
class FilterManager {
    constructor() {
        this.elements = {};
        this.eventHandlers = {
            onFiltersChange: null,
            onViewChange: null
        };
        this.currentFilters = {};
        this.isAdvancedFiltersVisible = false;
    }

    async init() {
        this.cacheElements();
        this.bindEvents();
        this.updateFilterCount();
        this.updateClearButton();
        this.updateViewToggle();
        
        // Initialize the toggle button with correct initial state
        this.initializeToggleButton();
        
        // DEBUG: Log initial state
        console.log('FilterManager initialized. Advanced filters visible:', this.isAdvancedFiltersVisible);
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
            actionButtons: document.querySelectorAll('[data-action]'),
            expansionIcon: document.querySelector('.expansion-icon'),
            expansionHeader: document.querySelector('.expansion-header')
        };
        
        // DEBUG: Log element status
        console.log('Advanced filters element:', this.elements.advancedFilters);
        console.log('Toggle button element:', this.elements.toggleFiltersBtn);
    }

    // Initialize toggle button with correct icon
    initializeToggleButton() {
        const { toggleFiltersBtn } = this.elements;
        if (!toggleFiltersBtn) return;

        // Set initial icon to expand_more (not filter_list)
        const icon = toggleFiltersBtn.querySelector('.material-icons');
        if (icon && icon.textContent === 'filter_list') {
            icon.textContent = 'expand_more';
        }
    }

    bindEvents() {
        const { searchInput, toggleFiltersBtn, viewToggle, expansionHeader } = this.elements;
        
        // Search input with debounce
        if (searchInput) {
            const debouncedSearch = utils.debounce(() => this.applyCurrentFilters(), 300);
            searchInput.addEventListener('input', debouncedSearch);
        }

        // Toggle filters button - FIXED: Simple direct event handler
        if (toggleFiltersBtn) {
            toggleFiltersBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Toggle filters button clicked');
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

        // Action buttons event delegation - FIXED: Only handle specific actions
        document.addEventListener('click', (e) => {
            const button = e.target.closest('[data-action]');
            if (button) {
                const action = button.getAttribute('data-action');
                // Only prevent default for actions we handle
                if (action === 'show-favorites' || action === 'show-high-rated' || 
                    action === 'clear-filters' || action === 'view-favorites' ||
                    action === 'export-favorites' || action === 'import-favorites' || 
                    action === 'export-data') {
                    e.preventDefault();
                    this.handleActionButton(button);
                }
            }
        });

        // Expansion header click for advanced filters
        if (expansionHeader) {
            expansionHeader.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Expansion header clicked');
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

    handleActionButton(button) {
        const action = button.getAttribute('data-action');
        
        switch(action) {
            case 'show-favorites':
                this.showFavoritesOnly();
                break;
            case 'show-high-rated':
                this.showHighRated();
                break;
            case 'clear-filters':
                this.clearFilters();
                break;
            case 'toggle-filters':
                // This should not happen since we have a direct event listener
                console.log('Toggle filters action from button - this should use direct event listener');
                this.toggleAdvancedFilters();
                break;
            case 'view-favorites':
                this.showFavoritesOnly();
                break;
            case 'export-favorites':
            case 'import-favorites':
            case 'export-data':
                // These are handled by other managers
                break;
            default:
                break;
        }
    }

    onFiltersChange(callback) {
        this.eventHandlers.onFiltersChange = callback;
    }

    onViewChange(callback) {
        this.eventHandlers.onViewChange = callback;
    }

    // FIXED: Reliable toggle function with proper visibility handling
    toggleAdvancedFilters() {
        const { advancedFilters, toggleFiltersBtn, expansionIcon } = this.elements;
        
        if (!advancedFilters || !toggleFiltersBtn) {
            console.warn('Advanced filters elements not found');
            console.log('Advanced filters:', advancedFilters);
            console.log('Toggle button:', toggleFiltersBtn);
            return;
        }

        this.isAdvancedFiltersVisible = !this.isAdvancedFiltersVisible;
        console.log('Toggling advanced filters. New state:', this.isAdvancedFiltersVisible);

        // FIXED: Simple and reliable DOM updates
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

        if (this.isAdvancedFiltersVisible) {
            // Show advanced filters - FIXED: Use proper Material Design approach
            console.log('Showing advanced filters');
            advancedFilters.classList.remove('hidden');
            advancedFilters.style.display = 'block';
            advancedFilters.style.visibility = 'visible';
            advancedFilters.style.opacity = '1';
            
            // Update button
            if (icon) {
                console.log('Changing icon to expand_less');
                icon.textContent = 'expand_less';
            }
            if (textSpan) {
                console.log('Changing text to Less Filters');
                textSpan.textContent = 'Less Filters';
            }
            if (expansionIcon) {
                expansionIcon.textContent = 'expand_less';
            }
            
            toggleFiltersBtn.classList.add('active');
            
        } else {
            // Hide advanced filters - FIXED: Use proper Material Design approach
            console.log('Hiding advanced filters');
            advancedFilters.classList.add('hidden');
            advancedFilters.style.display = 'none';
            
            // Update button
            if (icon) {
                console.log('Changing icon to expand_more');
                icon.textContent = 'expand_more';
            }
            if (textSpan) {
                console.log('Changing text to More Filters');
                textSpan.textContent = 'More Filters';
            }
            if (expansionIcon) {
                expansionIcon.textContent = 'expand_more';
            }
            
            toggleFiltersBtn.classList.remove('active');
        }

        this.updateFilterCount();
        
        // Debug log to verify state
        console.log('Advanced filters visible after toggle:', this.isAdvancedFiltersVisible);
        console.log('Advanced filters class list:', advancedFilters.classList);
        console.log('Advanced filters display style:', advancedFilters.style.display);
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
        let contractors = dataModule.searchContractors(
            filters.searchTerm,
            filters.category,
            filters.rating,
            filters.location
        );

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

    showFavoritesOnly() {
        const { favoritesFilter } = this.elements;
        if (favoritesFilter) {
            favoritesFilter.value = 'favorites';
            this.applyCurrentFilters();
            
            if (!this.isAdvancedFiltersVisible) {
                this.toggleAdvancedFilters();
            }

            if (typeof utils !== 'undefined' && utils.showNotification) {
                utils.showNotification('Showing favorites only', 'info');
            }
        }
    }

    showHighRated() {
        const { ratingFilter } = this.elements;
        if (ratingFilter) {
            ratingFilter.value = '4.5';
            this.applyCurrentFilters();

            if (typeof utils !== 'undefined' && utils.showNotification) {
                utils.showNotification('Showing highly rated contractors', 'info');
            }
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

    refreshFilterOptions(contractors) {
        this.populateLocationFilter(contractors);
        this.populateCategoryFilter(contractors);
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
}