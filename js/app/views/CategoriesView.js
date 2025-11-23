// js/app/views/CategoriesView.js - Enhanced UX version
import { BaseView } from './BaseView.js';

export class CategoriesView extends BaseView {
    constructor(dataModule) {
        super('categories-view');
        this.dataModule = dataModule;
        this.categoriesGrid = null;
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

        // Render categories grid
        this.renderCategories();
    }

    /**
     * Render categories list with enhanced UX
     */
    renderCategories() {
        const categories = this.dataModule.getCategories();
        
        if (!categories || categories.length === 0) {
            this.container.innerHTML = this.createEmptyState();
            return;
        }

        // Separate categories into with and without contractors
        const { categoriesWithContractors, categoriesWithoutContractors } = this.separateCategoriesByAvailability(categories);
        
        this.container.innerHTML = `
            <div class="categories-header">
                <h2>Available Services</h2>
                <p>Browse professionals in your community</p>
            </div>

            ${categoriesWithContractors.length > 0 ? `
                <div class="categories-section available-services">
                    <h3 class="section-title">
                        <i class="material-icons">check_circle</i>
                        Available Now
                        <span class="section-count">${categoriesWithContractors.length}</span>
                    </h3>
                    <div class="categories-type-grid" id="categories-with-contractors">
                        ${categoriesWithContractors.map(([type, typeData]) => this.createCategoryCard(type, typeData, true)).join('')}
                    </div>
                </div>
            ` : ''}

            ${categoriesWithoutContractors.length > 0 ? `
                <div class="categories-section needed-services">
                    <h3 class="section-title">
                        <i class="material-icons">add_circle</i>
                        Services Needed
                        <span class="section-count">${categoriesWithoutContractors.length}</span>
                    </h3>
                    <p class="section-description">Be the first to add suppliers for these services</p>
                    <div class="categories-type-grid" id="categories-without-contractors">
                        ${categoriesWithoutContractors.map(([type, typeData]) => this.createCategoryCard(type, typeData, false)).join('')}
                    </div>
                </div>
            ` : ''}

            ${this.createCommunityCallToAction()}
        `;

        this.setupClickHandlers();
    }

    /**
     * Separate categories by contractor availability
     */
    separateCategoriesByAvailability(categories) {
        const categoriesByType = this.groupCategoriesByType(categories);
        const categoriesWithContractors = [];
        const categoriesWithoutContractors = [];

        Object.entries(categoriesByType).forEach(([type, typeData]) => {
            if (typeData.contractorCount > 0) {
                categoriesWithContractors.push([type, typeData]);
            } else {
                categoriesWithoutContractors.push([type, typeData]);
            }
        });

        // Sort available categories by contractor count (most first)
        categoriesWithContractors.sort((a, b) => b[1].contractorCount - a[1].contractorCount);
        
        // Sort needed categories alphabetically
        categoriesWithoutContractors.sort((a, b) => a[0].localeCompare(b[0]));

        return { categoriesWithContractors, categoriesWithoutContractors };
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
                    contractorCount: 0
                };
            }
            
            grouped[type].categories.push(category);
            grouped[type].contractorCount += this.getContractorCount(category.name);
        });
        
        return grouped;
    }

    /**
     * Create category card HTML with enhanced UX
     */
    createCategoryCard(type, typeData, hasContractors) {
        const icon = typeData.categories[0]?.icon || 'category';
        const contractorCount = typeData.contractorCount;
        
        return `
            <div class="card contractor-card material-card category-type-card ${hasContractors ? 'has-contractors available' : 'no-contractors needed'}" 
                 data-category-type="${type}"
                 data-has-contractors="${hasContractors}">
                <div class="card-content">
                    <div class="category-type-icon">
                        <i class="material-icons">${icon}</i>
                        ${hasContractors ? 
                            `<div class="contractors-badge available">${contractorCount}</div>` : 
                            `<div class="contractors-badge needed">
                                <i class="material-icons">add</i>
                            </div>`
                        }
                    </div>
                    
                    <h3 class="contractor-name">${type}</h3>
                    
                    <div class="contractor-meta">
                        <p class="contractor-category">
                            <i class="material-icons">category</i>
                            ${typeData.categories.length} service${typeData.categories.length !== 1 ? 's' : ''}
                        </p>
                        <p class="contractor-location ${hasContractors ? 'available' : 'needed'}">
                            <i class="material-icons">${hasContractors ? 'groups' : 'person_add'}</i>
                            ${hasContractors ? 
                                `${contractorCount} professional${contractorCount !== 1 ? 's' : ''} available` : 
                                'No professionals yet'
                            }
                        </p>
                    </div>

                    ${!hasContractors ? `
                        <div class="category-action">
                            <button class="btn-secondary add-supplier-btn" data-category-type="${type}">
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
                    <button class="btn-primary" id="add-contractor-global">
                        <i class="material-icons">add_business</i>
                        Add a Contractor
                    </button>
                </div>
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
                if (e.target.closest('.add-supplier-btn')) return;
                
                const type = card.getAttribute('data-category-type');
                this.handleCategoryClick(type);
            });
        });

        // Handle add supplier buttons (for categories without contractors)
        const addSupplierButtons = this.container.querySelectorAll('.add-supplier-btn');
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
        document.dispatchEvent(new CustomEvent('showContractorForm', {
            detail: { 
                presetCategory: type,
                source: 'categories_view',
                context: type ? `No suppliers found for ${type}` : 'Add new contractor to community'
            }
        }));
    }

    /**
     * Get contractor count for category
     */
    getContractorCount(categoryName) {
        return this.dataModule.getContractors().filter(contractor => contractor.category === categoryName).length;
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
     * Refresh categories data
     */
    refresh() {
        this.renderCategories();
    }
}