// js/app/uiManager.js - FIXED: Removed conflicting event listeners and fixed rating backgrounds
// REFACTORED: Card rendering logic moved to cardManager
class UIManager {
    constructor() {
        this.elements = {};
    }

    async init() {
        this.cacheElements();
        this.setupCategories();
        this.setupContractorModal();
        this.setupFavorites();
        // REMOVED: setupViewToggle() - handled by mapManager now
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
            // Favorites elements
            favoritesSection: document.getElementById('favoritesSection'),
            favoritesGrid: document.getElementById('favoritesGrid'),
            favoritesCount: document.querySelector('.favorites-count'),
            favoritesNotice: document.getElementById('favoritesNotice'),
            favoritesFilter: document.getElementById('favoritesFilter'),
            // Modal elements
            contractorModal: document.getElementById('contractorModal'),
            contractorDetailsContent: document.getElementById('contractorDetails'),
            closeContractorModal: document.querySelector('.close-contractor-modal'),
            // View toggle elements (kept for reference but not used for logic)
            viewToggle: document.getElementById('view-toggle'),
            viewToggleBtns: document.querySelectorAll('.view-toggle-btn'),
            mapContainer: document.getElementById('map-container'),
            contractorGrid: document.getElementById('contractor-grid')
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

    setupContractorModal() {
        const { contractorModal, closeContractorModal } = this.elements;
        
        if (closeContractorModal) {
            closeContractorModal.addEventListener('click', () => {
                this.hideContractorModal();
            });
        }

        if (contractorModal) {
            contractorModal.addEventListener('click', (e) => {
                if (e.target === contractorModal) {
                    this.hideContractorModal();
                }
            });
        }
    }

    // REMOVED: setupViewToggle() - handled by mapManager

    setupFavorites() {
        // Listen for favorites updates
        document.addEventListener('favoritesUpdated', () => {
            this.updateFavoritesUI();
        });

        // FIXED: Removed global event delegation that was causing conflicts
        // Only setup favorites filter if it exists
        const { favoritesFilter } = this.elements;
        if (favoritesFilter) {
            favoritesFilter.addEventListener('change', (e) => {
                this.handleFavoritesFilterChange(e.target.value);
            });
        }

        // Initial favorites UI update
        this.updateFavoritesUI();
    }

    handleFavoritesFilterChange(filterValue) {
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

        // Update favorites count in stats if available
        this.updateFavoritesCount();
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

    // REFACTORED: Use cardManager for rendering contractor cards
    renderContractors(contractorsToRender = null) {
        const { contractorsGrid } = this.elements;
        if (!contractorsGrid) return;

        const contractors = contractorsToRender || dataModule.getContractors();
        
        // Use cardManager to render the cards
        cardManager.renderContractorCards(contractors, contractorsGrid);
    }

    updateStats(filteredContractors) {
        this.renderStats(filteredContractors);
    }

    updateFavoritesUI() {
        this.updateFavoritesCount();
        this.updateFavoriteButtons();
        this.renderFavoritesSection();
    }

    updateFavoritesCount() {
        const { favoritesCount } = this.elements;
        if (favoritesCount) {
            const count = dataModule.getFavoritesCount();
            favoritesCount.textContent = count;
            
            // Update favorites badge in stats
            const favoritesStat = document.querySelector('.favorites-stat .stat-number');
            if (favoritesStat) {
                favoritesStat.textContent = count;
            }
        }
    }

    // REFACTORED: Use cardManager for updating favorite buttons
    updateFavoriteButtons() {
        cardManager.updateFavoriteButtons();
    }

    // REFACTORED: Use cardManager for rendering favorites section
    renderFavoritesSection() {
        const { favoritesGrid, favoritesSection, favoritesNotice } = this.elements;
        if (!favoritesGrid || !favoritesSection) return;

        const favoriteContractors = dataModule.getFavoriteContractors();
        
        if (favoriteContractors.length === 0) {
            // Use cardManager for empty favorites state
            favoritesGrid.innerHTML = cardManager.createFavoritesEmptyState();
            favoritesSection.classList.add('hidden');
        } else {
            // Use cardManager to render favorite contractor cards
            cardManager.renderContractorCards(favoriteContractors, favoritesGrid);
            favoritesSection.classList.remove('hidden');
        }

        // Update favorites notice
        if (favoritesNotice) {
            favoritesNotice.innerHTML = this.createFavoritesNotice();
        }
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
                    <button class="material-button outlined" onclick="dataModule.downloadFavorites()">
                        <i class="material-icons">download</i>
                        <span>Export Favorites</span>
                    </button>
                    <button class="material-button outlined" onclick="document.getElementById('importFavorites').click()">
                        <i class="material-icons">upload</i>
                        <span>Import Favorites</span>
                    </button>
                    <input type="file" id="importFavorites" accept=".json" class="hidden" 
                           onchange="handleFavoritesImport(this.files[0])">
                    ${favoritesCount > 0 ? `
                    <button class="material-button outlined error" onclick="dataModule.clearFavorites()">
                        <i class="material-icons">delete</i>
                        <span>Clear All</span>
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    showContractorModal() {
        const { contractorModal } = this.elements;
        if (contractorModal) {
            contractorModal.style.display = 'flex';
        }
    }

    hideContractorModal() {
        const { contractorModal } = this.elements;
        if (contractorModal) {
            contractorModal.style.display = 'none';
        }
    }

    updateContractorDetails(contractorId) {
        const { contractorDetailsContent } = this.elements;
        if (!contractorDetailsContent) return;

        const contractor = dataModule.getContractor(contractorId);
        if (contractor) {
            console.log('Updating contractor details for:', contractor.name);
        }
    }
}

// UPDATED: Global functions for favorites with Material Design
function toggleFavorite(contractorId) {
    const isNowFavorite = dataModule.toggleFavorite(contractorId);
    
    // Show feedback
    const contractor = dataModule.getContractor(contractorId);
    if (contractor && typeof utils !== 'undefined' && utils.showNotification) {
        const message = isNowFavorite ? 
            `Added ${contractor.name} to favorites! 💖` : 
            `Removed ${contractor.name} from favorites.`;
        utils.showNotification(message, isNowFavorite ? 'success' : 'info');
    }
}

// UPDATED: Handle favorites import
async function handleFavoritesImport(file) {
    if (!file) return;
    
    try {
        const text = await file.text();
        const success = dataModule.importFavorites(text);
        
        if (success && typeof utils !== 'undefined' && utils.showNotification) {
            utils.showNotification('Favorites imported successfully! 🎉', 'success');
        } else {
            utils.showNotification('Failed to import favorites. Invalid file format.', 'error');
        }
    } catch (error) {
        console.error('Error importing favorites:', error);
        if (typeof utils !== 'undefined' && utils.showNotification) {
            utils.showNotification('Error importing favorites file.', 'error');
        }
    }
}

// UPDATED: Show favorites section
function showFavoritesSection() {
    const favoritesSection = document.getElementById('favoritesSection');
    if (favoritesSection) {
        favoritesSection.classList.remove('hidden');
        favoritesSection.scrollIntoView({ behavior: 'smooth' });
    }
}