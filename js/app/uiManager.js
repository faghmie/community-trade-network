// js/app/uiManager.js
class UIManager {
    constructor() {
        this.elements = {};
    }

    async init() {
        this.cacheElements();
        this.setupCategories();
    }

    cacheElements() {
        this.elements = {
            contractorsGrid: document.getElementById('contractorsGrid'),
            categoryFilter: document.getElementById('categoryFilter'),
            locationFilter: document.getElementById('locationFilter'),
            ratingFilter: document.getElementById('ratingFilter'),
            searchInput: document.getElementById('searchInput'),
            sortBy: document.getElementById('sortBy'),
            totalContractorsCount: document.getElementById('totalContractorsCount'),
            totalReviewsCount: document.getElementById('totalReviewsCount'),
            averageRatingCount: document.getElementById('averageRatingCount')
        };
    }

    setupCategories() {
        // Initialize categories module if available
        if (typeof categoriesModule !== 'undefined') {
            categoriesModule.init();
            
            // Listen for category changes
            if (categoriesModule.onCategoriesChanged) {
                categoriesModule.onCategoriesChanged(() => {
                    this.refreshCategoryFilter();
                });
            }
        } else {
            console.warn('categoriesModule not available, category filters may not update automatically');
        }
    }

    refreshFilters() {
        this.refreshCategoryFilter();
        this.refreshLocationFilter();
    }

    refreshCategoryFilter() {
        const { categoryFilter } = this.elements;
        if (!categoryFilter) return;

        const currentValue = categoryFilter.value;
        
        // Get categories from the module
        let categories = [];
        if (typeof categoriesModule !== 'undefined' && categoriesModule.getCategories) {
            categories = categoriesModule.getCategories();
        } else {
            // Fallback categories if module is not available
            categories = ['Plumbing', 'Electrical', 'Construction', 'Painting', 'Landscaping', 'Roofing', 'HVAC'];
        }
        
        categoryFilter.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
        
        // Restore the selected value if it still exists
        if (categories.includes(currentValue)) {
            categoryFilter.value = currentValue;
        }
    }

    refreshLocationFilter() {
        const { locationFilter } = this.elements;
        if (!locationFilter) return;

        const currentValue = locationFilter.value;
        const contractors = dataModule.getContractors();
        const locations = this.getUniqueLocations(contractors);
        
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

    getUniqueLocations(contractors) {
        return [...new Set(contractors
            .map(contractor => contractor.location)
            .filter(location => location && location.trim() !== '')
        )].sort();
    }

    renderStats(filteredContractors = null) {
        const stats = filteredContractors ? 
            this.calculateFilteredStats(filteredContractors) : 
            dataModule.getStats();

        const { totalContractorsCount, totalReviewsCount, averageRatingCount } = this.elements;
        if (totalContractorsCount) totalContractorsCount.textContent = stats.totalContractors;
        if (totalReviewsCount) totalReviewsCount.textContent = stats.totalReviews;
        if (averageRatingCount) averageRatingCount.textContent = stats.averageRating;
    }

    calculateFilteredStats(contractors) {
        const totalContractors = contractors.length;
        const totalReviews = contractors.reduce((total, contractor) => 
            total + contractor.reviews.filter(r => r.status === 'approved').length, 0
        );
        
        const averageRating = contractors.length > 0 ? 
            contractors.reduce((total, contractor) => {
                const approvedReviews = contractor.reviews.filter(r => r.status === 'approved');
                const contractorRating = approvedReviews.length > 0 ? 
                    parseFloat(dataModule.calculateAverageRating(approvedReviews)) : 0;
                return total + contractorRating;
            }, 0) / contractors.length : 0;

        return {
            totalContractors,
            totalReviews,
            averageRating: averageRating.toFixed(1)
        };
    }

    renderContractors(contractorsToRender = null) {
        const { contractorsGrid } = this.elements;
        if (!contractorsGrid) return;

        const contractors = contractorsToRender || dataModule.getContractors();
        
        if (contractors.length === 0) {
            contractorsGrid.innerHTML = '<div class="no-results">No contractors found matching your criteria.</div>';
            return;
        }

        contractorsGrid.innerHTML = contractors.map(contractor => 
            this.createContractorCard(contractor)
        ).join('');
    }

    createContractorCard(contractor) {
        const approvedReviews = contractor.reviews.filter(review => review.status === 'approved');
        const displayRating = approvedReviews.length > 0 ? 
            dataModule.calculateAverageRating(approvedReviews) : 0;
        
        const ratingValue = typeof displayRating === 'number' ? displayRating : parseFloat(displayRating) || 0;
        const displayRatingFormatted = !isNaN(ratingValue) ? ratingValue.toFixed(1) : '0.0';

        return `
            <div class="card contractor-card" onclick="app.showContractorDetails('${contractor.id}')">
                <div class="card-body">
                    <h3>${contractor.name}</h3>
                    <p class="category">${contractor.category}</p>
                    <p class="location">
                        <i class="fas fa-map-marker-alt"></i> ${contractor.location || 'Service area not specified'}
                    </p>
                    <div class="rating">
                        ${'⭐'.repeat(Math.floor(ratingValue))}${ratingValue % 1 >= 0.5 ? '⭐' : ''} 
                        ${displayRatingFormatted}
                    </div>
                    <p class="review-count">${approvedReviews.length} reviews</p>
                </div>
                <div class="card-footer">
                    <button class="btn btn-primary" onclick="app.showReviewForm('${contractor.id}'); event.stopPropagation();">
                        Leave Review
                    </button>
                </div>
            </div>
        `;
    }

    updateStats(filteredContractors) {
        this.renderStats(filteredContractors);
    }
}