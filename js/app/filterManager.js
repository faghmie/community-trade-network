// js/app/filterManager.js - UPDATED: Support for view-based contractor editing

export class FilterManager {
    constructor(dataModule) {
        this.dataModule = dataModule;
        this.currentFilters = {
            search: '',
            category: '',
            location: '',
            minRating: 0,
            favoritesOnly: false,
            categoryType: '',
            sortBy: 'name'
        };
        this.lastResults = [];
    }

    async init() {
        this.cacheElements();
        this.bindEvents();
        this.applyCurrentFilters();
        return this;
    }

    cacheElements() {
        this.elements = {
            searchInput: document.getElementById('searchInput'),
            categoryFilter: document.getElementById('categoryFilter'),
            locationFilter: document.getElementById('locationFilter'),
            ratingFilter: document.getElementById('ratingFilter'),
            sortBy: document.getElementById('sortBy'),
            clearFiltersBtn: document.querySelector('[data-action="clear-filters"]'),
            applyFiltersBtn: document.querySelector('[data-action="apply-filters"]'),
            filtersPanel: document.getElementById('filtersSheet'),
            closeFiltersPanel: document.getElementById('closeFiltersPanel'),
            emptyStateContainer: this.getOrCreateEmptyState(),
            bottomNavItems: document.querySelectorAll('.bottom-nav-item')
        };
    }

    getOrCreateEmptyState() {
        let container = document.getElementById('emptyStateContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'emptyStateContainer';
            container.className = 'empty-state hidden';
            container.innerHTML = `
                <div class="empty-state-content">
                    <div class="empty-state-icon">🔍</div>
                    <h3 class="empty-state-title">No suppliers found</h3>
                    <p class="empty-state-description">We couldn't find any suppliers matching your search criteria.</p>
                    <button class="btn btn-primary add-supplier-btn" data-action="add-supplier">
                        <span class="btn-icon">➕</span>
                        Add Supplier to Directory
                    </button>
                    <p class="empty-state-hint">Help grow the community by adding a trusted supplier</p>
                </div>
            `;

            const mainContent = document.querySelector('main') || document.body;
            const contractorList = document.getElementById('contractorList');
            if (contractorList) {
                contractorList.parentNode.insertBefore(container, contractorList.nextSibling);
            } else {
                mainContent.appendChild(container);
            }
        }
        return container;
    }

    bindEvents() {
        // Search with debounce
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input',
                this.debounce(() => this.applyCurrentFilters(), 300)
            );
        }

        // Filter changes
        ['categoryFilter', 'locationFilter', 'ratingFilter', 'sortBy'].forEach(filterName => {
            if (this.elements[filterName]) {
                this.elements[filterName].addEventListener('change', () => this.applyCurrentFilters());
            }
        });

        // Action buttons
        document.addEventListener('click', (e) => {
            const button = e.target.closest('[data-action]');
            if (button) {
                e.preventDefault();
                this.handleAction(button.getAttribute('data-action'));
            }
        });

        // Bottom navigation
        if (this.elements.bottomNavItems) {
            this.elements.bottomNavItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const view = item.getAttribute('data-view');
                    this.handleNavigation(view);
                });
            });
        }

        // Category selection events
        document.addEventListener('categorySelected', (event) => {
            this.handleCategoryTypeFilter(event.detail.type, event.detail.categoryNames);
        });
    }

    handleAction(action) {
        switch (action) {
            case 'clear-filters':
                this.clearFilters();
                break;
            case 'apply-filters':
                this.applyCurrentFilters();
                this.hideFilterPanel();
                break;
            case 'show-favorites':
                this.applyFavoritesFilter();
                break;
            case 'add-supplier':
                this.handleAddSupplier();
                break;
            default:
                // Other actions handled elsewhere
                break;
        }
    }

    // In the handleAddSupplier method in filterManager.js, add logging:
    handleAddSupplier() {
        // Get the current search input value directly to ensure we have the latest
        const currentSearchValue = this.elements.searchInput?.value || '';

        console.log('🔍 FilterManager: Add Supplier clicked, search value:', currentSearchValue);
        console.log('🔍 FilterManager: Dispatching navigationViewChange with contractorEdit');

        // UPDATED: Dispatch navigation event to show contractor edit view
        document.dispatchEvent(new CustomEvent('navigationViewChange', {
            detail: {
                view: 'contractorEdit',
                context: {
                    name: currentSearchValue,
                    location: this.currentFilters.location,
                    category: this.currentFilters.category
                }
            }
        }));
    }

    handleNavigation(view) {
        // FIX: Check if view is valid before proceeding
        if (!view) {
            console.warn('⚠️ FilterManager: Navigation called with null/undefined view');
            return;
        }

        this.updateBottomNavigationActiveState(view);

        document.dispatchEvent(new CustomEvent('navigationViewChange', {
            detail: { view }
        }));

        if (view === 'search') {
            this.showFilterPanel();
        } else {
            this.hideFilterPanel();
        }
    }

    updateBottomNavigationActiveState(activeView) {
        this.elements.bottomNavItems?.forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-view') === activeView);
        });
    }

    handleCategoryTypeFilter(type, categoryNames) {
        this.currentFilters.categoryType = type;
        this.currentFilters.categoryTypeNames = categoryNames;
        this.applyCurrentFilters();
    }

    applyCurrentFilters() {
        this.updateFiltersFromUI();
        const results = this.applyFiltersAndSorting();
        this.updateUIState(results);

        // Notify listeners
        document.dispatchEvent(new CustomEvent('filtersChanged', {
            detail: { filters: this.currentFilters, results }
        }));
    }

    updateFiltersFromUI() {
        this.currentFilters = {
            search: this.elements.searchInput?.value || '',
            category: this.elements.categoryFilter?.value || '',
            location: this.elements.locationFilter?.value || '',
            minRating: parseFloat(this.elements.ratingFilter?.value) || 0,
            favoritesOnly: this.currentFilters.favoritesOnly, // Preserve this state
            categoryType: this.currentFilters.categoryType,
            categoryTypeNames: this.currentFilters.categoryTypeNames,
            sortBy: this.elements.sortBy?.value || 'name'
        };
    }

    applyFiltersAndSorting() {
        let contractors = this.dataModule.getContractors();

        // Apply filters
        if (this.currentFilters.search) {
            const searchTerm = this.currentFilters.search.toLowerCase();
            contractors = contractors.filter(c =>
                c.name.toLowerCase().includes(searchTerm) ||
                (c.description && c.description.toLowerCase().includes(searchTerm)) ||
                (c.services && c.services.toLowerCase().includes(searchTerm))
            );
        }

        if (this.currentFilters.category) {
            contractors = contractors.filter(c => c.category === this.currentFilters.category);
        }

        if (this.currentFilters.categoryTypeNames?.length > 0) {
            contractors = contractors.filter(c =>
                this.currentFilters.categoryTypeNames.includes(c.category)
            );
        }

        if (this.currentFilters.location) {
            contractors = contractors.filter(c =>
                c.location && c.location.includes(this.currentFilters.location)
            );
        }

        if (this.currentFilters.minRating > 0) {
            contractors = contractors.filter(c =>
                parseFloat(c.rating) >= this.currentFilters.minRating
            );
        }

        if (this.currentFilters.favoritesOnly) {
            contractors = contractors.filter(c => this.dataModule.isFavorite(c.id));
        }

        // Apply sorting
        contractors = this.sortContractors(contractors);

        this.lastResults = contractors;
        return contractors;
    }

    sortContractors(contractors) {
        const sortBy = this.currentFilters.sortBy || 'name';

        return [...contractors].sort((a, b) => {
            switch (sortBy) {
                case 'rating':
                    return parseFloat(b.rating) - parseFloat(a.rating);
                case 'reviews':
                    return (b.reviews?.length || 0) - (a.reviews?.length || 0);
                case 'location':
                    return (a.location || '').localeCompare(b.location || '');
                case 'name':
                default:
                    return a.name.localeCompare(b.name);
            }
        });
    }

    updateUIState(results) {
        this.updateEmptyState(results);
        this.updateFilterIndicators();
    }

    updateEmptyState(results) {
        const hasResults = results && results.length > 0;
        const hasActiveFilters = this.hasActiveFilters();

        if (this.elements.emptyStateContainer) {
            this.elements.emptyStateContainer.classList.toggle('hidden',
                hasResults || !hasActiveFilters
            );
        }
    }

    updateFilterIndicators() {
        const activeCount = this.getActiveFilterCount();

        // Update filter badge
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

        // Update clear button
        if (this.elements.clearFiltersBtn) {
            this.elements.clearFiltersBtn.style.display = activeCount > 0 ? 'inline-flex' : 'none';
        }
    }

    hasActiveFilters() {
        return (
            this.currentFilters.search !== '' ||
            this.currentFilters.category !== '' ||
            this.currentFilters.location !== '' ||
            this.currentFilters.minRating > 0 ||
            this.currentFilters.favoritesOnly ||
            this.currentFilters.categoryType !== '' ||
            (this.currentFilters.sortBy && this.currentFilters.sortBy !== 'name')
        );
    }

    getActiveFilterCount() {
        let count = 0;
        if (this.currentFilters.search) count++;
        if (this.currentFilters.category) count++;
        if (this.currentFilters.location) count++;
        if (this.currentFilters.minRating > 0) count++;
        if (this.currentFilters.favoritesOnly) count++;
        if (this.currentFilters.categoryType) count++;
        if (this.currentFilters.sortBy && this.currentFilters.sortBy !== 'name') count++;
        return count;
    }

    clearFilters() {
        // Reset UI elements
        if (this.elements.searchInput) this.elements.searchInput.value = '';
        if (this.elements.categoryFilter) this.elements.categoryFilter.value = '';
        if (this.elements.locationFilter) this.elements.locationFilter.value = '';
        if (this.elements.ratingFilter) this.elements.ratingFilter.value = '';
        if (this.elements.sortBy) this.elements.sortBy.value = 'name';

        // Reset internal state
        this.currentFilters = {
            search: '',
            category: '',
            location: '',
            minRating: 0,
            favoritesOnly: false,
            categoryType: '',
            categoryTypeNames: [],
            sortBy: 'name'
        };

        this.applyCurrentFilters();
    }

    applyFavoritesFilter() {
        this.clearFilters();
        this.currentFilters.favoritesOnly = true;
        this.applyCurrentFilters();
    }

    showFilterPanel() {
        if (this.elements.filtersPanel) {
            this.elements.filtersPanel.classList.remove('hidden');
        }
    }

    hideFilterPanel() {
        if (this.elements.filtersPanel) {
            this.elements.filtersPanel.classList.add('hidden');
        }
    }

    // Utility function
    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
}