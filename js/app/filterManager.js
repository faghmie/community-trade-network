// js/app/filterManager.js
class FilterManager {
    constructor() {
        this.elements = {};
        this.eventHandlers = {
            onFiltersChange: null
        };
        this.currentFilters = {};
    }

    async init() {
        this.cacheElements();
        this.bindEvents();
    }

    cacheElements() {
        this.elements = {
            searchInput: document.getElementById('searchInput'),
            categoryFilter: document.getElementById('categoryFilter'),
            locationFilter: document.getElementById('locationFilter'),
            ratingFilter: document.getElementById('ratingFilter'),
            sortBy: document.getElementById('sortBy')
        };
    }

    bindEvents() {
        const { searchInput } = this.elements;
        
        if (searchInput) {
            const debouncedSearch = utils.debounce(() => this.applyCurrentFilters(), 300);
            searchInput.addEventListener('input', debouncedSearch);
        }
    }

    onFiltersChange(callback) {
        this.eventHandlers.onFiltersChange = callback;
    }

    applyCurrentFilters() {
        const { searchInput, categoryFilter, locationFilter, ratingFilter } = this.elements;
        
        this.currentFilters = {
            searchTerm: searchInput?.value || '',
            category: categoryFilter?.value || '',
            location: locationFilter?.value || '',
            rating: ratingFilter?.value || ''
        };

        if (this.eventHandlers.onFiltersChange) {
            this.eventHandlers.onFiltersChange(this.currentFilters);
        }
    }

    applyFilters(filters) {
        return dataModule.searchContractors(
            filters.searchTerm,
            filters.category,
            filters.rating,
            filters.location
        );
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
                case 'name':
                default:
                    return a.name.localeCompare(b.name);
            }
        });

        return contractors;
    }
}