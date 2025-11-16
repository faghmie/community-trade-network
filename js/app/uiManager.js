// js/app/uiManager.js
class UIManager {
    constructor(cardManager) {
        this.cardManager = cardManager;
        this.elements = {};
    }

    async init() {
        this.cacheElements();
        this.setupCategories();
        this.setupContractorModal();
        this.setupFavorites();
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
            averageRatingCount: document.getElementById('averageRatingCount'),
            favoritesSection: document.getElementById('favoritesSection'),
            favoritesGrid: document.getElementById('favoritesGrid'),
            favoritesCount: document.querySelector('.favorites-count'),
            favoritesNotice: document.getElementById('favoritesNotice'),
            favoritesFilter: document.getElementById('favoritesFilter'),
            contractorModal: document.getElementById('contractorModal'),
            contractorDetailsContent: document.getElementById('contractorDetails'),
            closeContractorModal: document.querySelector('.close-contractor-modal')
        };
    }

    setupCategories() {
        // Don't re-initialize categoriesModule - it's already initialized by dataModule
        // Just refresh the filter dropdown
        this.refreshCategoryFilter();
        
        // Listen for category changes
        categoriesModule.onCategoriesChanged(() => {
            this.refreshCategoryFilter();
        });
    }

    setupContractorModal() {
        const { contractorModal, closeContractorModal } = this.elements;
        
        closeContractorModal.addEventListener('click', () => {
            this.hideContractorModal();
        });

        contractorModal.addEventListener('click', (e) => {
            if (e.target === contractorModal) {
                this.hideContractorModal();
            }
        });
    }

    setupFavorites() {
        document.addEventListener('favoritesUpdated', () => {
            this.updateFavoritesUI();
        });

        const { favoritesFilter } = this.elements;
        favoritesFilter.addEventListener('change', (e) => {
            this.handleFavoritesFilterChange(e.target.value);
        });

        this.updateFavoritesUI();
    }

    handleFavoritesFilterChange = (filterValue) => {
        let contractors = dataModule.getContractors();
        
        if (filterValue === 'favorites') {
            contractors = dataModule.getFavoriteContractors();
        } else if (filterValue === 'non-favorites') {
            contractors = contractors.filter(contractor => 
                !dataModule.isFavorite(contractor.id)
            );
        }
        
        this.renderContractors(contractors);
        this.updateStats(contractors);
    }

    refreshFilters() {
        this.refreshCategoryFilter();
        this.refreshLocationFilter();
    }

    refreshCategoryFilter() {
        const { categoryFilter } = this.elements;
        const currentValue = categoryFilter.value;
        
        const categories = categoriesModule.getCategories();
        
        categoryFilter.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name;
            categoryFilter.appendChild(option);
        });
        
        if (categories.some(cat => cat.name === currentValue)) {
            categoryFilter.value = currentValue;
        }
    }

    refreshLocationFilter() {
        const { locationFilter } = this.elements;
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

    getUniqueLocations = (contractors) => [...new Set(contractors
        .map(contractor => contractor.location)
        .filter(location => location && location.trim() !== '')
    )].sort();

    renderStats = (filteredContractors = null) => {
        const stats = filteredContractors ? 
            this.calculateFilteredStats(filteredContractors) : 
            dataModule.getStats();

        const { totalContractorsCount, totalReviewsCount, averageRatingCount } = this.elements;
        totalContractorsCount.textContent = stats.totalContractors;
        totalReviewsCount.textContent = stats.totalReviews;
        averageRatingCount.textContent = stats.averageRating;

        this.updateFavoritesCount();
    }

    calculateFilteredStats(contractors) {
        const totalContractors = contractors.length;
        const approvedReviews = contractors.flatMap(contractor => 
            reviewManager.getApprovedReviewsByContractor(contractor.id)
        );
        const totalReviews = approvedReviews.length;
        
        const averageRating = contractors.length > 0 ? 
            contractors.reduce((total, contractor) => total + parseFloat(contractor.overallRating || 0), 0) / contractors.length : 0;

        return {
            totalContractors,
            totalReviews,
            averageRating: averageRating.toFixed(1)
        };
    }

    renderContractors = (contractorsToRender = null) => {
        const { contractorsGrid } = this.elements;
        const contractors = contractorsToRender || dataModule.getContractors();
        this.cardManager.renderContractorCards(contractors, contractorsGrid);
    }

    updateStats = (filteredContractors) => this.renderStats(filteredContractors);

    updateFavoritesUI() {
        this.updateFavoritesCount();
        this.updateFavoriteButtons();
        this.renderFavoritesSection();
    }

    updateFavoritesCount() {
        const { favoritesCount } = this.elements;
        const count = dataModule.getFavoritesCount();
        favoritesCount.textContent = count;
        
        const favoritesStat = document.querySelector('.favorites-stat .stat-number');
        if (favoritesStat) {
            favoritesStat.textContent = count;
        }
    }

    updateFavoriteButtons = () => this.cardManager.updateFavoriteButtons();

    renderFavoritesSection() {
        const { favoritesGrid, favoritesSection, favoritesNotice } = this.elements;
        const favoriteContractors = dataModule.getFavoriteContractors();
        
        if (favoriteContractors.length === 0) {
            favoritesGrid.innerHTML = this.cardManager.createFavoritesEmptyState();
            favoritesSection.classList.add('hidden');
        } else {
            this.cardManager.renderContractorCards(favoriteContractors, favoritesGrid);
            favoritesSection.classList.remove('hidden');
        }

        favoritesNotice.innerHTML = this.createFavoritesNotice();
    }

    createFavoritesNotice() {
        const favoritesCount = dataModule.getFavoritesCount();
        return `
            <div class="favorites-notice">
                <p>
                    <i class="material-icons">info</i>
                    <strong>Your ${favoritesCount} favorite contractor${favoritesCount !== 1 ? 's are' : ' is'} stored locally in this browser.</strong>
                    They won't be available on other devices or if you clear browser data.
                </p>
                <div class="favorites-actions">
                    <button class="btn btn-secondary" onclick="dataModule.downloadFavorites()">
                        <i class="material-icons">download</i>
                        <span>Export Favorites</span>
                    </button>
                    <button class="btn btn-secondary" onclick="document.getElementById('importFavorites').click()">
                        <i class="material-icons">upload</i>
                        <span>Import Favorites</span>
                    </button>
                    <input type="file" id="importFavorites" accept=".json" class="hidden" 
                           onchange="handleFavoritesImport(this.files[0])">
                    ${favoritesCount > 0 ? `
                    <button class="btn btn-error" onclick="dataModule.clearFavorites()">
                        <i class="material-icons">delete</i>
                        <span>Clear All</span>
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    showContractorModal = () => this.elements.contractorModal.style.display = 'flex';
    hideContractorModal = () => this.elements.contractorModal.style.display = 'none';

    updateContractorDetails(contractorId) {
        const { contractorDetailsContent } = this.elements;
        const contractor = dataModule.getContractor(contractorId);
        if (contractor) {
            console.log('Updating contractor details for:', contractor.name);
        }
    }
}

// Global functions for favorites
const toggleFavorite = (contractorId) => {
    const isNowFavorite = dataModule.toggleFavorite(contractorId);
    const contractor = dataModule.getContractor(contractorId);
    
    if (contractor) {
        const message = isNowFavorite ? 
            `Added ${contractor.name} to favorites! 💖` : 
            `Removed ${contractor.name} from favorites.`;
        utils.showNotification(message, isNowFavorite ? 'success' : 'info');
    }
};

// Handle favorites import
const handleFavoritesImport = async (file) => {
    const text = await file.text();
    const success = dataModule.importFavorites(text);
    
    if (success) {
        utils.showNotification('Favorites imported successfully! 🎉', 'success');
    } else {
        utils.showNotification('Failed to import favorites. Invalid file format.', 'error');
    }
};

// Show favorites section
const showFavoritesSection = () => {
    const favoritesSection = document.getElementById('favoritesSection');
    favoritesSection.classList.remove('hidden');
    favoritesSection.scrollIntoView({ behavior: 'smooth' });
};