// js/app/views/categoriesListView.js - FIXED: Proper event handling for new event system

export class CategoriesListView {
    constructor(dataModule) {
        this.dataModule = dataModule;
        this.container = null;
        this.viewId = 'categories-view';
        this.categoriesGrid = null;
        this.isRendered = false;
        
        // Bind methods to maintain proper 'this' context
        this.render = this.render.bind(this);
        this.show = this.show.bind(this);
        this.hide = this.hide.bind(this);
        this.renderCategories = this.renderCategories.bind(this);
        this.handleInitialize = this.handleInitialize.bind(this);
        this.handleCategoryTypeClick = this.handleCategoryTypeClick.bind(this);
        this.handleShowCategoriesView = this.handleShowCategoriesView.bind(this);
        this.handleHideCategoriesView = this.handleHideCategoriesView.bind(this);
        
        this.initializeEventListeners();
    }

    /**
     * Initialize event listeners for the categories list view
     */
    initializeEventListeners() {
        // FIXED: Listen for the correct show/hide events (not the request events)
        document.addEventListener('showCategoriesView', this.handleShowCategoriesView);
        document.addEventListener('hideCategoriesView', this.handleHideCategoriesView);

        // Listen for initialization event
        document.addEventListener('initializeCategoriesView', this.handleInitialize);

        // Listen for app initialization to set up initial state
        document.addEventListener('appInitialized', () => {
            if (!this.isRendered) {
                this.render();
            }
        });

        // Listen for data updates to refresh categories
        document.addEventListener('contractorsUpdated', () => {
            if (this.container && this.isViewVisible()) {
                this.renderCategories();
            }
        });

        // Listen for category data updates
        document.addEventListener('categoriesUpdated', () => {
            if (this.container && this.isViewVisible()) {
                this.renderCategories();
            }
        });

        // Listen for data ready event
        document.addEventListener('dataReady', () => {
            if (this.container && this.isViewVisible()) {
                this.renderCategories();
            }
        });
    }

    /**
     * Handle show categories view event
     */
    handleShowCategoriesView() {
        console.log('🎯 CategoriesListView received showCategoriesView event');
        this.show();
    }

    /**
     * Handle hide categories view event
     */
    handleHideCategoriesView() {
        console.log('🎯 CategoriesListView received hideCategoriesView event');
        this.hide();
    }

    /**
     * Handle initialization event
     */
    handleInitialize() {
        console.log('🎯 CategoriesListView received initialization event');
        this.render();
    }

    /**
     * Create the categories view HTML structure
     */
    createViewHTML() {
        return `
            <section class="categories-view" id="${this.viewId}">
                <div class="categories-type-grid" id="categories-type-grid">
                    <!-- Category types will be populated dynamically -->
                </div>
            </section>
        `;
    }

    /**
     * Render the categories view
     */
    render() {
        console.log('🔄 CategoriesListView rendering...');
        
        const mainContainer = document.getElementById('mainViewContainer');
        if (!mainContainer) {
            console.error('Main view container not found');
            return;
        }

        // Only create the view if it doesn't exist
        if (!this.container) {
            // Create and insert the view HTML
            mainContainer.insertAdjacentHTML('beforeend', this.createViewHTML());
            this.container = document.getElementById(this.viewId);
            this.categoriesGrid = document.getElementById('categories-type-grid');
        }
        
        this.isRendered = true;
        
        // Initially hide the view
        this.hide();
        
        // Dispatch event that view is ready
        document.dispatchEvent(new CustomEvent('categoriesViewRendered'));
        
        console.log('✅ CategoriesListView rendered successfully');
    }

    /**
     * Render all categories grouped by unique types
     */
    renderCategories() {
        if (!this.categoriesGrid) {
            console.warn('Categories grid not found - view may not be initialized');
            return;
        }

        // Get categories and group by type
        const categories = this.dataModule.getCategories();
        if (!categories || categories.length === 0) {
            this.categoriesGrid.innerHTML = this.createEmptyState();
            return;
        }

        // Group categories by type and sort by contractor count (descending)
        const categoriesByType = this.groupCategoriesByType(categories);
        const sortedTypes = this.sortCategoryTypesByContractorCount(categoriesByType);
        
        // Render category type cards in sorted order
        this.categoriesGrid.innerHTML = sortedTypes.map(([type, typeData]) => 
            this.createCategoryTypeCard(type, typeData)
        ).join('');

        // Set up click handlers for category type cards
        this.setupCategoryTypeClickHandlers();

        // Dispatch event that categories rendering is complete
        document.dispatchEvent(new CustomEvent('categoriesListRendered', {
            detail: {
                categoryCount: categories.length,
                typeCount: sortedTypes.length,
                typesWithContractors: sortedTypes.filter(([_, data]) => data.contractorCount > 0).length,
                typesWithoutContractors: sortedTypes.filter(([_, data]) => data.contractorCount === 0).length,
                timestamp: new Date().toISOString()
            }
        }));

        console.log(`✅ Rendered ${sortedTypes.length} category types (${sortedTypes.filter(([_, data]) => data.contractorCount > 0).length} with contractors)`);
    }

    /**
     * Set up click handlers for category type cards
     */
    setupCategoryTypeClickHandlers() {
        const categoryTypeCards = document.querySelectorAll('[data-category-type]');
        categoryTypeCards.forEach(card => {
            // Remove existing listeners to prevent duplicates
            card.removeEventListener('click', this.handleCategoryTypeClick);
            card.addEventListener('click', this.handleCategoryTypeClick);
        });
    }

    /**
     * Handle category type click
     */
    handleCategoryTypeClick(event) {
        const card = event.currentTarget;
        const categoryType = card.getAttribute('data-category-type');
        const hasContractors = card.getAttribute('data-has-contractors') === 'true';

        console.log(`🎯 Category type clicked: ${categoryType}, has contractors: ${hasContractors}`);

        if (!hasContractors) {
            console.log('ℹ️ No contractors available for this category type');
            // Optionally show a message or prevent navigation
            return;
        }

        // Dispatch event to show contractors for this category type
        document.dispatchEvent(new CustomEvent('showContractorsForCategoryType', {
            detail: { 
                type: categoryType,
                categories: this.getCategoriesByType(categoryType),
                timestamp: new Date().toISOString()
            }
        }));

        // Add visual feedback
        card.classList.add('category-card-active');
        setTimeout(() => {
            card.classList.remove('category-card-active');
        }, 200);
    }

    /**
     * Get all categories for a specific type
     */
    getCategoriesByType(type) {
        const categories = this.dataModule.getCategories();
        return categories.filter(category => category.type === type);
    }

    /**
     * Group categories by their type
     */
    groupCategoriesByType(categories) {
        const grouped = {};
        
        categories.forEach(category => {
            const type = category.type || 'General Services';
            
            if (!grouped[type]) {
                grouped[type] = {
                    categories: [],
                    contractorCount: 0,
                    subtypes: new Set(),
                    representativeCategory: category
                };
            }
            
            grouped[type].categories.push(category);
            
            // Count contractors for this category
            const categoryContractorCount = this.getContractorCountByCategory(category.name);
            grouped[type].contractorCount += categoryContractorCount;
            
            // Collect unique subtypes
            if (category.subtype) {
                grouped[type].subtypes.add(category.subtype);
            }
            
            // Update representative category if this one has better data
            if (!grouped[type].representativeCategory.icon && category.icon) {
                grouped[type].representativeCategory = category;
            }
        });
        
        // Convert subtypes Set to Array
        Object.keys(grouped).forEach(type => {
            grouped[type].subtypes = Array.from(grouped[type].subtypes);
        });
        
        return grouped;
    }

    /**
     * Sort category types by contractor count (descending)
     */
    sortCategoryTypesByContractorCount(categoriesByType) {
        return Object.entries(categoriesByType).sort((a, b) => {
            const [, typeDataA] = a;
            const [, typeDataB] = b;
            
            // Types with contractors come first
            if (typeDataA.contractorCount > 0 && typeDataB.contractorCount === 0) {
                return -1;
            }
            if (typeDataA.contractorCount === 0 && typeDataB.contractorCount > 0) {
                return 1;
            }
            
            // If both have contractors or both have no contractors, sort by contractor count (descending)
            if (typeDataA.contractorCount !== typeDataB.contractorCount) {
                return typeDataB.contractorCount - typeDataA.contractorCount;
            }
            
            // If same contractor count, sort alphabetically by type name
            const [typeA] = a;
            const [typeB] = b;
            return typeA.localeCompare(typeB);
        });
    }

    /**
     * Create category type card HTML
     */
    createCategoryTypeCard(type, typeData) {
        // Use data from representative category or fallback to defaults
        const representativeCategory = typeData.representativeCategory;
        const icon = representativeCategory?.icon || 'category';
        const description = this.generateCategoryTypeDescription(type, typeData);
        const totalContractors = typeData.contractorCount;
        const categoryCount = typeData.categories.length;
        const subtypes = typeData.subtypes.slice(0, 3);
        
        // Determine card styling based on contractor count
        const hasContractors = totalContractors > 0;
        const cardClass = hasContractors ? 'category-type-card has-contractors' : 'category-type-card no-contractors';
        
        return `
            <div class="card contractor-card material-card ${cardClass}" 
                 data-category-type="${type}"
                 data-has-contractors="${hasContractors}">
                <div class="card-content">
                    <div class="category-type-icon">
                        <i class="material-icons">${icon}</i>
                        ${!hasContractors ? '<div class="no-contractors-badge" title="No contractors available yet">0</div>' : ''}
                    </div>
                    
                    <h3 class="contractor-name">${type}</h3>
                    
                    <div class="contractor-meta">
                        <p class="contractor-category">
                            <i class="material-icons">category</i>
                            ${categoryCount} service categor${categoryCount !== 1 ? 'ies' : 'y'}
                        </p>
                        <p class="contractor-location ${hasContractors ? 'has-contractors' : 'no-contractors'}">
                            <i class="material-icons">groups</i>
                            ${hasContractors ? 
                                `${totalContractors} professional${totalContractors !== 1 ? 's' : ''} available` : 
                                'No contractors yet'
                            }
                        </p>
                    </div>
                    
                    <div class="rating-display ${hasContractors ? 'has-contractors' : 'no-contractors'}">
                        <div class="rating-icon">
                            <i class="material-icons">${hasContractors ? 'layers' : 'layers_clear'}</i>
                        </div>
                        <span class="rating-value">${categoryCount}</span>
                        <span class="review-count">${hasContractors ? 'Categories' : 'Empty'}</span>
                    </div>

                    <div class="contractor-details">
                        <p class="service-areas">
                            <i class="material-icons">${hasContractors ? 'arrow_forward' : 'info'}</i>
                            ${description}
                        </p>
                        
                        ${subtypes.length > 0 ? `
                        <div class="category-subtypes ${hasContractors ? 'has-contractors' : 'no-contractors'}">
                            <strong>Includes:</strong> ${subtypes.join(', ')}${typeData.subtypes.length > 3 ? '...' : ''}
                        </div>
                        ` : ''}
                        
                        ${!hasContractors ? `
                        <div class="empty-category-notice">
                            <i class="material-icons">lightbulb</i>
                            <span>Be the first to add a contractor in this category!</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate description for category type using actual category data
     */
    generateCategoryTypeDescription(type, typeData) {
        const categoryCount = typeData.categories.length;
        const hasContractors = typeData.contractorCount > 0;
        
        // Try to get description from representative category
        const representativeCategory = typeData.representativeCategory;
        if (representativeCategory?.description) {
            return representativeCategory.description;
        }
        
        // Fallback to generic description based on data
        if (hasContractors) {
            return `Browse ${categoryCount} service categor${categoryCount !== 1 ? 'ies' : 'y'} with available professionals.`;
        } else {
            return `${categoryCount} service categor${categoryCount !== 1 ? 'ies' : 'y'} waiting for contractors.`;
        }
    }

    /**
     * Get contractor count for a specific category
     */
    getContractorCountByCategory(categoryName) {
        const contractors = this.dataModule.getContractors();
        return contractors.filter(contractor => contractor.category === categoryName).length;
    }

    /**
     * Create empty state for no categories
     */
    createEmptyState() {
        return `
            <div class="no-results">
                <i class="material-icons">category</i>
                <h3>No categories available</h3>
                <p>Categories will be available once the app is fully loaded</p>
            </div>
        `;
    }

    /**
     * Show the categories list view
     */
    show() {
        console.log('🔄 CategoriesListView showing...');
        
        if (!this.isRendered) {
            console.log('📦 CategoriesListView not rendered, rendering first...');
            this.render();
        }
        
        if (this.container) {
            this.container.style.display = 'block';
            console.log('✅ CategoriesListView display set to block');
            
            // Refresh categories data when showing to ensure we have latest data
            this.renderCategories();
        } else {
            console.error('❌ CategoriesListView container not found');
        }
        
        // Dispatch event that view is now visible
        document.dispatchEvent(new CustomEvent('categoriesListViewShown'));
        
        console.log('✅ CategoriesListView shown successfully');
    }

    /**
     * Hide the categories list view
     */
    hide() {
        console.log('🔄 CategoriesListView hiding...');
        
        if (this.container) {
            this.container.style.display = 'none';
            console.log('✅ CategoriesListView display set to none');
        } else {
            console.warn('⚠️ CategoriesListView container not found for hiding');
        }
        
        // Dispatch event that view is now hidden
        document.dispatchEvent(new CustomEvent('categoriesListViewHidden'));
        
        console.log('✅ CategoriesListView hidden successfully');
    }

    /**
     * Refresh categories data
     */
    refresh() {
        this.renderCategories();
    }

    /**
     * Get visibility state
     */
    isViewVisible() {
        return this.container && this.container.style.display !== 'none';
    }

    /**
     * Clean up the view
     */
    destroy() {
        // Remove event listeners
        document.removeEventListener('showCategoriesView', this.handleShowCategoriesView);
        document.removeEventListener('hideCategoriesView', this.handleHideCategoriesView);
        document.removeEventListener('initializeCategoriesView', this.handleInitialize);
        
        // Remove click handlers from category type cards
        const categoryTypeCards = document.querySelectorAll('[data-category-type]');
        categoryTypeCards.forEach(card => {
            card.removeEventListener('click', this.handleCategoryTypeClick);
        });
        
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
        this.categoriesGrid = null;
        this.isRendered = false;
        
        console.log('🧹 CategoriesListView destroyed');
    }
}