// js/app/views/CategoriesView.js - Updated with proper contractor data updates
import { BaseView } from './BaseView.js';

export class CategoriesView extends BaseView {
    constructor(dataModule) {
        super('categories-view');
        this.dataModule = dataModule;
        this.categoriesGrid = null;
        this.searchInput = null;
        this.isVisible = false;
        this.currentSearchTerm = '';
        
        // Bind methods
        this.handleContractorsUpdated = this.handleContractorsUpdated.bind(this);
    }

    /**
     * Simple render method
     */
    render() {
        const mainContainer = document.getElementById('mainViewContainer');
        if (!mainContainer) return;

        // Create or reuse container
        if (!this.container) {
            this.container = document.createElement('section');
            this.container.id = this.viewId;
            this.container.className = 'categories-view';
            mainContainer.appendChild(this.container);
        }

        // Clear container and render fresh
        this.container.innerHTML = '';

        // Render hero banner and search
        this.renderHeader();

        // Render categories list
        this.renderCategories();
        
        // Setup event listeners for data updates
        this.setupDataUpdateListeners();
    }

    /**
     * Setup event listeners for data updates
     */
    setupDataUpdateListeners() {
        // Listen for contractor data updates
        document.addEventListener('contractorsUpdated', this.handleContractorsUpdated);
        document.addEventListener('contractorCreated', this.handleContractorsUpdated);
        document.addEventListener('contractorUpdated', this.handleContractorsUpdated);
        document.addEventListener('contractorDeleted', this.handleContractorsUpdated);
    }

    /**
     * Remove event listeners when view is not active
     */
    removeDataUpdateListeners() {
        document.removeEventListener('contractorsUpdated', this.handleContractorsUpdated);
        document.removeEventListener('contractorCreated', this.handleContractorsUpdated);
        document.removeEventListener('contractorUpdated', this.handleContractorsUpdated);
        document.removeEventListener('contractorDeleted', this.handleContractorsUpdated);
    }

    /**
     * Handle contractor data updates
     */
    handleContractorsUpdated() {
        console.log('🔄 CategoriesView: Contractor data updated, refreshing categories');
        if (this.isVisible) {
            this.forceRefreshCategories();
        }
    }

    /**
     * Force refresh categories with current data
     */
    forceRefreshCategories() {
        console.log('🔄 CategoriesView: Force refreshing categories');
        this.renderCategories();
    }

    /**
     * Render hero banner and search header
     */
    renderHeader() {
        const headerHTML = `
            <!-- Combined Header with Hero and Search -->
            <header class="main-header">
                <div class="header-content">
                    <!-- Hero Content - Left Side -->
                    <div class="header-hero">
                        <h1 class="hero-title">Community Trade Network</h1>
                        <p class="hero-subtitle">Your Community's Directory of Trusted Local Services</p>
                    </div>

                    <!-- Search Bar - Right Side -->
                    <div class="header-search">
                        <div class="material-search">
                            <i class="material-icons" data-icon="search">search</i>
                            <input type="text" id="categoriesSearchInput" 
                                   placeholder="Search service providers..."
                                   class="material-search-input" 
                                   data-action="search-keypress"
                                   aria-label="Search service providers"
                                   value="${this.currentSearchTerm}">
                        </div>
                    </div>
                </div>
            </header>
        `;

        // Insert header at the beginning of the container
        this.container.innerHTML = headerHTML;

        // Setup search functionality
        this.setupSearch();
    }

    /**
     * Setup search input functionality
     */
    setupSearch() {
        this.searchInput = document.getElementById('categoriesSearchInput');

        if (this.searchInput) {
            // Clear any existing event listeners to prevent duplicates
            const newSearchInput = this.searchInput.cloneNode(true);
            this.searchInput.parentNode.replaceChild(newSearchInput, this.searchInput);
            this.searchInput = newSearchInput;

            // Add input event listener for real-time search
            this.searchInput.addEventListener('input', (e) => {
                this.currentSearchTerm = e.target.value;
                this.handleSearch(e.target.value);
            });

            // Add keydown listener for Enter key
            this.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.currentSearchTerm = e.target.value;
                    this.handleSearch(e.target.value);
                }
            });

            // Add focus/blur for better UX
            this.searchInput.addEventListener('focus', () => {
                this.searchInput.parentElement.classList.add('focused');
            });

            this.searchInput.addEventListener('blur', () => {
                this.searchInput.parentElement.classList.remove('focused');
            });
        }
    }

    /**
     * Handle search functionality
     */
    handleSearch(searchTerm) {
        this.currentSearchTerm = searchTerm;
        
        if (!searchTerm || searchTerm.trim() === '') {
            // If search is empty, show all categories
            this.renderCategories();
            return;
        }

        const categories = this.dataModule.getCategories();
        const searchTermLower = searchTerm.toLowerCase().trim();

        if (!categories || categories.length === 0) {
            this.showEmptyState();
            return;
        }

        // Filter categories based on search term with null safety
        const filteredCategories = categories.filter(category => {
            // Safely check each property with null/undefined protection
            const name = category?.name || '';
            const type = category?.type || '';
            const description = category?.description || '';

            return name.toLowerCase().includes(searchTermLower) ||
                type.toLowerCase().includes(searchTermLower) ||
                description.toLowerCase().includes(searchTermLower);
        });

        // Separate filtered categories by contractor availability
        const { categoriesWithContractors } = this.separateCategoriesByAvailability(filteredCategories);

        // Update categories section while preserving header
        const categoriesContent = this.container.querySelector('.categories-content') ||
            this.createCategoriesContentContainer();

        // Only show categories with contractors in search results
        categoriesContent.innerHTML = `
            ${categoriesWithContractors.length > 0 ? `
                <div class="categories-section available-services">
                    <h3 class="section-title">
                        <i class="material-icons">check_circle</i>
                        Available Services
                        <span class="section-count">${categoriesWithContractors.length}</span>
                    </h3>
                    <div class="categories-list" id="categories-with-contractors">
                        ${categoriesWithContractors.map(([type, typeData]) => this.createCategoryListItem(type, typeData, true)).join('')}
                    </div>
                </div>

                ${this.createCommunityCallToAction()}
            ` : `
                <div class="no-search-results">
                    <i class="material-icons">search_off</i>
                    <h3>No matching services found</h3>
                    <p>Try adjusting your search terms or browse all categories</p>
                    <button class="btn btn-text" id="clear-search-btn">
                        <i class="material-icons">clear</i>
                        Clear Search
                    </button>
                </div>

                ${this.createCommunityCallToAction()}
            `}
        `;

        this.setupClickHandlers();

        // Setup clear search button if it exists
        const clearSearchBtn = categoriesContent.querySelector('#clear-search-btn');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                this.clearSearch();
            });
        }
    }

    /**
     * Create categories content container
     */
    createCategoriesContentContainer() {
        const existingContent = this.container.querySelector('.categories-content');
        if (existingContent) {
            return existingContent;
        }

        const contentDiv = document.createElement('div');
        contentDiv.className = 'categories-content';

        // Find header and insert content after it
        const header = this.container.querySelector('.main-header');
        if (header) {
            header.insertAdjacentElement('afterend', contentDiv);
        } else {
            this.container.appendChild(contentDiv);
        }

        return contentDiv;
    }

    /**
     * Clear search and show all categories
     */
    clearSearch() {
        this.currentSearchTerm = '';
        if (this.searchInput) {
            this.searchInput.value = '';
        }
        this.renderCategories();
    }

    /**
     * Render categories list with enhanced UX and list-view layout
     */
    renderCategories() {
        const categories = this.dataModule.getCategories();

        // Create or get categories content container
        const categoriesContent = this.createCategoriesContentContainer();

        if (!categories || categories.length === 0) {
            this.showEmptyState();
            return;
        }

        // Separate categories into with and without contractors
        const { categoriesWithContractors } = this.separateCategoriesByAvailability(categories);

        categoriesContent.innerHTML = `
            ${categoriesWithContractors.length > 0 ? `
                <div class="categories-section available-services">
                    <h3 class="section-title">
                        <i class="material-icons">check_circle</i>
                        Available Services
                        <span class="section-count">${categoriesWithContractors.length}</span>
                    </h3>
                    <div class="categories-list" id="categories-with-contractors">
                        ${categoriesWithContractors.map(([type, typeData]) => this.createCategoryListItem(type, typeData, true)).join('')}
                    </div>
                </div>
            ` : `
                <div class="no-categories-available">
                    <i class="material-icons">category</i>
                    <h3>No services available yet</h3>
                    <p>Be the first to add suppliers to your community</p>
                </div>
            `}

            ${this.createCommunityCallToAction()}
        `;

        this.setupClickHandlers();
    }

    /**
     * Separate categories by contractor availability - ALWAYS recalculate counts
     */
    separateCategoriesByAvailability(categories) {
        const categoriesByType = this.groupCategoriesByType(categories);
        const categoriesWithContractors = [];
        const categoriesWithoutContractors = [];

        Object.entries(categoriesByType).forEach(([type, typeData]) => {
            // ALWAYS recalculate contractor count fresh from current data
            const currentContractorCount = this.calculateCurrentContractorCount(typeData.categories);
            
            if (currentContractorCount > 0) {
                categoriesWithContractors.push([type, { ...typeData, contractorCount: currentContractorCount }]);
            } else {
                categoriesWithoutContractors.push([type, { ...typeData, contractorCount: 0 }]);
            }
        });

        // Sort available categories by contractor count (most first)
        categoriesWithContractors.sort((a, b) => b[1].contractorCount - a[1].contractorCount);

        // Sort needed categories alphabetically
        categoriesWithoutContractors.sort((a, b) => a[0].localeCompare(b[0]));

        return { categoriesWithContractors, categoriesWithoutContractors };
    }

    /**
     * Calculate current contractor count for categories - FRESH calculation
     */
    calculateCurrentContractorCount(categories) {
        let totalCount = 0;
        const contractors = this.dataModule.getContractors();
        
        if (!contractors || !Array.isArray(contractors)) {
            return 0;
        }

        categories.forEach(category => {
            const count = contractors.filter(contractor => contractor.category === category.name).length;
            totalCount += count;
        });
        
        return totalCount;
    }

    /**
     * Group categories by type
     */
    groupCategoriesByType(categories) {
        const grouped = {};

        categories.forEach(category => {
            const type = category.type || 'General Services';

            if (!grouped[type]) {
                grouped[type] = {
                    categories: [],
                    contractorCount: 0 // This will be recalculated in separateCategoriesByAvailability
                };
            }

            grouped[type].categories.push(category);
        });

        return grouped;
    }

    /**
     * Create category list item HTML - Updated to remove services information
     */
    createCategoryListItem(type, typeData, hasContractors) {
        const icon = typeData.categories[0]?.icon || 'category';
        const contractorCount = typeData.contractorCount;

        return `
            <div class="category-list-item ${hasContractors ? 'available' : 'needed'}" 
                 data-category-type="${type}"
                 data-has-contractors="${hasContractors}">
                <div class="card-content">
                    <div class="category-list-icon">
                        <i class="material-icons">${icon}</i>
                    </div>
                    
                    <div class="category-content">
                        <h3 class="category-name">${type}</h3>
                        
                        <div class="category-meta">
                            <p class="category-contractor-count ${hasContractors ? 'available' : 'needed'}">
                                <i class="material-icons">${hasContractors ? 'groups' : 'person_add'}</i>
                                ${hasContractors ?
                `${contractorCount} professional${contractorCount !== 1 ? 's' : ''}` :
                'No professionals yet'
            }
                            </p>
                        </div>
                    </div>

                    <div class="contractors-badge-list ${hasContractors ? 'available' : 'needed'}">
                        ${hasContractors ?
                contractorCount :
                '<i class="material-icons">add</i>'
            }
                    </div>

                    ${!hasContractors ? `
                        <div class="category-list-action">
                            <button class="add-supplier-btn-list" data-category-type="${type}">
                                <i class="material-icons">person_add</i>
                                Add Supplier
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Create community call-to-action
     */
    createCommunityCallToAction() {
        return `
            <div class="community-cta">
                <div class="cta-content">
                    <i class="material-icons">diversity</i>
                    <h4>Help Grow Your Community</h4>
                    <p>Know a great contractor? Add them to help others find quality services</p>
                    <button class="btn btn-primary" id="add-contractor-global">
                        <i class="material-icons">add_business</i>
                        Add a Contractor
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Show empty state
     */
    showEmptyState() {
        const categoriesContent = this.createCategoriesContentContainer();
        categoriesContent.innerHTML = this.createEmptyState();
    }

    /**
     * Enhanced empty state
     */
    createEmptyState() {
        return `
            <div class="no-results">
                <i class="material-icons">category</i>
                <h3>No categories available yet</h3>
                <p>Categories will be available once the app is fully loaded</p>
                <button class="btn-primary" id="refresh-categories">
                    <i class="material-icons">refresh</i>
                    Refresh Categories
                </button>
            </div>
        `;
    }

    /**
     * Setup enhanced click handlers
     */
    setupClickHandlers() {
        // Handle category clicks (for categories with contractors)
        const availableCards = this.container.querySelectorAll('[data-has-contractors="true"]');
        availableCards.forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking the add supplier button
                if (e.target.closest('.add-supplier-btn-list')) return;

                const type = card.getAttribute('data-category-type');
                this.handleCategoryClick(type);
            });
        });

        // Handle add supplier buttons (for categories without contractors)
        const addSupplierButtons = this.container.querySelectorAll('.add-supplier-btn-list');
        addSupplierButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const type = button.getAttribute('data-category-type');
                this.handleAddSupplierClick(type);
            });
        });

        // Handle global add contractor button
        const globalAddButton = this.container.querySelector('#add-contractor-global');
        if (globalAddButton) {
            globalAddButton.addEventListener('click', () => {
                this.handleAddSupplierClick();
            });
        }
    }

    /**
     * Handle category click (for categories with contractors)
     */
    handleCategoryClick(type) {
        const categories = this.dataModule.getCategories().filter(cat => cat.type === type);
        const categoryNames = categories.map(cat => cat.name);

        document.dispatchEvent(new CustomEvent('categorySelected', {
            detail: { type, categories, categoryNames }
        }));
    }

    /**
     * Handle add supplier click (for categories without contractors)
     */
    handleAddSupplierClick(type = null) {
        // Create context data to prefill the contractor form
        const context = {
            category: type,
            source: 'categories_view',
            context: type ? `No suppliers found for ${type}` : 'Add new contractor to community'
        };

        // Dispatch navigation event to show contractor edit view
        document.dispatchEvent(new CustomEvent('navigationViewChange', {
            detail: {
                view: 'contractorEdit',
                context: context
            }
        }));
    }

    /**
     * Get contractor count for category - always fresh calculation
     */
    getContractorCount(categoryName) {
        const contractors = this.dataModule.getContractors();
        if (!contractors || !Array.isArray(contractors)) {
            return 0;
        }
        return contractors.filter(contractor => contractor.category === categoryName).length;
    }

    /**
     * Refresh categories data
     */
    refresh() {
        console.log('🔄 CategoriesView: Refresh called');
        this.renderCategories();
    }

    /**
     * Show the view - ensure data is refreshed
     */
    show() {
        super.show();
        this.isVisible = true;
        
        // Ensure search is cleared when showing categories view
        if (this.searchInput) {
            this.searchInput.value = '';
            this.currentSearchTerm = '';
        }
        
        // Force refresh to ensure contractor counts are current
        this.forceRefreshCategories();
        
        // Setup data update listeners
        this.setupDataUpdateListeners();
    }

    /**
     * Hide the view
     */
    hide() {
        super.hide();
        this.isVisible = false;
        
        // Remove data update listeners to prevent memory leaks
        this.removeDataUpdateListeners();
    }

    /**
     * Force refresh the view with current data
     */
    forceRefresh() {
        this.forceRefreshCategories();
    }
}