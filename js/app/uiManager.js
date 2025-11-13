// js/app/uiManager.js
class UIManager {
    constructor() {
        this.elements = {};
    }

    async init() {
        this.cacheElements();
        this.setupCategories();
        this.setupContractorModal();
        this.setupFavorites(); // ADDED: Initialize favorites
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
            // ADDED: Favorites elements
            favoritesSection: document.getElementById('favoritesSection'),
            favoritesGrid: document.getElementById('favoritesGrid'),
            favoritesCount: document.getElementById('favoritesCount'),
            favoritesNotice: document.getElementById('favoritesNotice'),
            favoritesFilter: document.getElementById('favoritesFilter'),
            // ADDED: Modal elements
            contractorModal: document.getElementById('contractorModal'),
            contractorDetailsContent: document.getElementById('contractorDetailsContent'),
            closeContractorModal: document.querySelector('.close-contractor-modal')
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

    // ADDED: Setup favorites functionality
    setupFavorites() {
        // Listen for favorites updates
        document.addEventListener('favoritesUpdated', () => {
            this.updateFavoritesUI();
        });

        // Setup favorites filter if it exists
        const { favoritesFilter } = this.elements;
        if (favoritesFilter) {
            favoritesFilter.addEventListener('change', (e) => {
                this.handleFavoritesFilterChange(e.target.value);
            });
        }

        // Initial favorites UI update
        this.updateFavoritesUI();
    }

    // ADDED: Handle favorites filter changes
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

        // ADDED: Update favorites count in stats if available
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

        // ADDED: Update favorite buttons after rendering
        this.updateFavoriteButtons();
    }

    // UPDATED: Contractor card with favorite button
    createContractorCard(contractor) {
        const approvedReviews = contractor.reviews.filter(review => review.status === 'approved');
        const displayRating = approvedReviews.length > 0 ? 
            dataModule.calculateAverageRating(approvedReviews) : 0;
        
        const ratingValue = typeof displayRating === 'number' ? displayRating : parseFloat(displayRating) || 0;
        const displayRatingFormatted = !isNaN(ratingValue) ? ratingValue.toFixed(1) : '0.0';
        const isFavorite = dataModule.isFavorite(contractor.id);

        return `
            <div class="card contractor-card" onclick="app.showContractorDetails('${contractor.id}')">
                <div class="card-header">
                    <button class="favorite-btn ${isFavorite ? 'favorited' : ''}" 
                            data-contractor-id="${contractor.id}"
                            onclick="toggleFavorite('${contractor.id}'); event.stopPropagation();"
                            title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                        <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                </div>
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

    // ADDED: Favorites UI management
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
            favoritesCount.style.display = count > 0 ? 'inline-block' : 'none';
        }
    }

    updateFavoriteButtons() {
        // Update all favorite buttons in contractor cards
        const favoriteButtons = document.querySelectorAll('.favorite-btn');
        favoriteButtons.forEach(button => {
            const contractorId = button.getAttribute('data-contractor-id');
            if (contractorId) {
                const isFavorite = dataModule.isFavorite(contractorId);
                button.classList.toggle('favorited', isFavorite);
                button.innerHTML = isFavorite ? 
                    '<i class="fas fa-heart"></i>' : 
                    '<i class="far fa-heart"></i>';
                button.title = isFavorite ? 'Remove from favorites' : 'Add to favorites';
            }
        });
    }

    renderFavoritesSection() {
        const { favoritesGrid, favoritesSection, favoritesNotice } = this.elements;
        if (!favoritesGrid || !favoritesSection) return;

        const favoriteContractors = dataModule.getFavoriteContractors();
        
        if (favoriteContractors.length === 0) {
            favoritesGrid.innerHTML = `
                <div class="no-favorites">
                    <p>You haven't added any contractors to favorites yet.</p>
                    <p>Click the heart icon 💖 on contractor cards to add them to your favorites!</p>
                </div>
            `;
            favoritesSection.style.display = 'none';
        } else {
            favoritesGrid.innerHTML = favoriteContractors.map(contractor => 
                this.createContractorCard(contractor)
            ).join('');
            favoritesSection.style.display = 'block';
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
                <p>💡 <strong>Your ${favoritesCount} favorite contractor${favoritesCount !== 1 ? 's are' : ' is'} stored locally in this browser.</strong></p>
                <p>They won't be available on other devices or if you clear browser data.</p>
                <div class="favorites-actions">
                    <button class="btn btn-small" onclick="dataModule.downloadFavorites()">
                        <i class="fas fa-download"></i> Export Favorites
                    </button>
                    <button class="btn btn-small btn-secondary" onclick="document.getElementById('importFavorites').click()">
                        <i class="fas fa-upload"></i> Import Favorites
                    </button>
                    <input type="file" id="importFavorites" accept=".json" style="display: none;" 
                           onchange="handleFavoritesImport(this.files[0])">
                    ${favoritesCount > 0 ? `
                    <button class="btn btn-small btn-danger" onclick="dataModule.clearFavorites()">
                        <i class="fas fa-trash"></i> Clear All
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // ADDED: Modal methods
    showContractorModal() {
        const { contractorModal } = this.elements;
        if (contractorModal) {
            contractorModal.style.display = 'block';
        }
    }

    hideContractorModal() {
        const { contractorModal } = this.elements;
        if (contractorModal) {
            contractorModal.style.display = 'none';
        }
    }

    // ADDED: Update contractor details in modal
    updateContractorDetails(contractorId) {
        const { contractorDetailsContent } = this.elements;
        if (!contractorDetailsContent) return;

        const contractor = dataModule.getContractor(contractorId);
        if (contractor) {
            // This would be handled by modalManager, but we can add a fallback
            console.log('Updating contractor details for:', contractor.name);
        }
    }
}

// ADDED: Global functions for favorites
function toggleFavorite(contractorId) {
    const isNowFavorite = dataModule.toggleFavorite(contractorId);
    
    // Show feedback
    const contractor = contractorManager.getById(contractorId);
    if (contractor && typeof utils !== 'undefined' && utils.showNotification) {
        const message = isNowFavorite ? 
            `Added ${contractor.name} to favorites! 💖` : 
            `Removed ${contractor.name} from favorites.`;
        utils.showNotification(message, 'success');
    }
}

// ADDED: Handle favorites import
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

// ADDED: Show favorites section
function showFavoritesSection() {
    const favoritesSection = document.getElementById('favoritesSection');
    if (favoritesSection) {
        favoritesSection.scrollIntoView({ behavior: 'smooth' });
    }
}