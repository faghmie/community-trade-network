// js/app/views/CategoriesView.js - Simplified (replaces the complex one)
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
     * Render categories list
     */
    renderCategories() {
        const categories = this.dataModule.getCategories();
        
        if (!categories || categories.length === 0) {
            this.container.innerHTML = this.createEmptyState();
            return;
        }

        // Group by type
        const categoriesByType = this.groupCategoriesByType(categories);
        const sortedTypes = this.sortCategoryTypes(categoriesByType);
        
        this.container.innerHTML = `
            <div class="categories-type-grid" id="categories-type-grid">
                ${sortedTypes.map(([type, typeData]) => this.createCategoryCard(type, typeData)).join('')}
            </div>
        `;

        this.categoriesGrid = document.getElementById('categories-type-grid');
        this.setupClickHandlers();
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
     * Sort types by contractor count
     */
    sortCategoryTypes(categoriesByType) {
        return Object.entries(categoriesByType).sort((a, b) => {
            return b[1].contractorCount - a[1].contractorCount;
        });
    }

    /**
     * Create category card HTML
     */
    createCategoryCard(type, typeData) {
        const hasContractors = typeData.contractorCount > 0;
        const icon = typeData.categories[0]?.icon || 'category';
        
        return `
            <div class="card contractor-card material-card category-type-card ${hasContractors ? 'has-contractors' : 'no-contractors'}" 
                 data-category-type="${type}">
                <div class="card-content">
                    <div class="category-type-icon">
                        <i class="material-icons">${icon}</i>
                        ${!hasContractors ? '<div class="no-contractors-badge">0</div>' : ''}
                    </div>
                    
                    <h3 class="contractor-name">${type}</h3>
                    
                    <div class="contractor-meta">
                        <p class="contractor-category">
                            <i class="material-icons">category</i>
                            ${typeData.categories.length} service${typeData.categories.length !== 1 ? 's' : ''}
                        </p>
                        <p class="contractor-location">
                            <i class="material-icons">groups</i>
                            ${hasContractors ? 
                                `${typeData.contractorCount} professional${typeData.contractorCount !== 1 ? 's' : ''}` : 
                                'No contractors yet'
                            }
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Setup click handlers
     */
    setupClickHandlers() {
        const cards = this.container.querySelectorAll('[data-category-type]');
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                const type = card.getAttribute('data-category-type');
                this.handleCategoryClick(type);
            });
        });
    }

    /**
     * Handle category click
     */
    handleCategoryClick(type) {
        const categories = this.dataModule.getCategories().filter(cat => cat.type === type);
        const categoryNames = categories.map(cat => cat.name);
        
        // Dispatch simple event
        document.dispatchEvent(new CustomEvent('categorySelected', {
            detail: { type, categories, categoryNames }
        }));
    }

    /**
     * Get contractor count for category
     */
    getContractorCount(categoryName) {
        return this.dataModule.getContractors().filter(contractor => contractor.category === categoryName).length;
    }

    /**
     * Empty state
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
}