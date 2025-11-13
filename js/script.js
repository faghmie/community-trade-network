// Main application
class ContractorReviewApp {
    constructor() {
        this.currentContractor = null;
        this.filteredContractors = [];
        this.init();
    }

    init() {
        // Initialize data modules first
        dataModule.init();
        
        // Safely initialize categories module if available
        if (typeof categoriesModule !== 'undefined') {
            categoriesModule.init();
            
            // Listen for category changes
            categoriesModule.onCategoriesChanged(() => {
                this.refreshCategoryFilters();
            });
        } else {
            console.warn('categoriesModule not available, category filters may not update automatically');
        }
        
        this.bindEvents();
        this.renderDashboard();
    }

    bindEvents() {
        // Review form submission
        document.getElementById('reviewForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleReviewSubmit();
        });

        // Modal close events
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal('reviewModal');
        });

        document.getElementById('closeContractorModal').addEventListener('click', () => {
            this.closeModal('contractorModal');
        });

        // Star rating
        this.bindStarRating();

        // Search with debounce
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            const debouncedSearch = utils.debounce(() => this.searchContractors(), 300);
            searchInput.addEventListener('input', debouncedSearch);
        }
    }

    bindStarRating() {
        const stars = document.querySelectorAll('.star-rating .star');
        stars.forEach(star => {
            star.addEventListener('click', () => {
                const rating = star.getAttribute('data-rating');
                this.setRating(rating);
            });
        });
    }

    setRating(rating) {
        const stars = document.querySelectorAll('.star-rating .star');
        stars.forEach(star => {
            const starRating = star.getAttribute('data-rating');
            star.classList.toggle('active', starRating <= rating);
        });
        document.getElementById('rating').value = rating;
    }

    // Add this method to refresh categories in filters
    refreshCategoryFilters() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter && typeof categoriesModule !== 'undefined') {
            const currentValue = categoryFilter.value;
            categoryFilter.innerHTML = '<option value="">All Categories</option>';
            
            const categories = categoriesModule.getCategories();
            categories.forEach(category => {
                categoryFilter.innerHTML += `<option value="${category}">${category}</option>`;
            });
            
            // Restore the selected value if it still exists
            if (categories.includes(currentValue)) {
                categoryFilter.value = currentValue;
            }
        }
    }

    renderDashboard() {
        this.refreshCategoryFilters();
        this.renderStats();
        this.renderContractors();
    }

    renderStats() {
        const stats = dataModule.getStats();
        document.getElementById('totalContractorsCount').textContent = stats.totalContractors;
        document.getElementById('totalReviewsCount').textContent = stats.totalReviews;
        document.getElementById('averageRatingCount').textContent = stats.averageRating;
    }

    searchContractors() {
        const searchTerm = document.getElementById('searchInput').value;
        const categoryFilter = document.getElementById('categoryFilter').value;
        const ratingFilter = document.getElementById('ratingFilter').value;
        
        this.filteredContractors = dataModule.searchContractors(searchTerm, categoryFilter, ratingFilter);
        this.renderContractors();
    }

    filterContractors() {
        this.searchContractors();
    }

    sortContractors() {
        const sortBy = document.getElementById('sortBy').value;
        const contractors = this.filteredContractors.length > 0 ? 
            this.filteredContractors : dataModule.getContractors();
        
        contractors.sort((a, b) => {
            switch(sortBy) {
                case 'rating':
                    return parseFloat(b.rating) - parseFloat(a.rating);
                case 'reviews':
                    return b.reviews.length - a.reviews.length;
                case 'name':
                default:
                    return a.name.localeCompare(b.name);
            }
        });
        
        this.renderContractors(contractors);
    }

    renderContractors(contractorsToRender = null) {
        const contractors = contractorsToRender || 
            (this.filteredContractors.length > 0 ? this.filteredContractors : dataModule.getContractors());
        
        const grid = document.getElementById('contractorsGrid');
        
        grid.innerHTML = contractors.map(contractor => {
            // Only count approved reviews for display
            const approvedReviews = contractor.reviews.filter(review => review.status === 'approved');
            const displayRating = approvedReviews.length > 0 ? 
                dataModule.calculateAverageRating(approvedReviews) : 0;
            
            return `
                <div class="card contractor-card" onclick="app.showContractorDetails('${contractor.id}')">
                    <div class="card-body">
                        <h3>${contractor.name}</h3>
                        <p class="category">${contractor.category}</p>
                        <div class="rating">
                            ${'⭐'.repeat(Math.floor(displayRating))}${displayRating % 1 >= 0.5 ? '⭐' : ''} 
                            ${displayRating}
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
        }).join('');
        
        // Update stats if filtered
        if (this.filteredContractors.length > 0) {
            const totalReviews = this.filteredContractors.reduce((total, contractor) => 
                total + contractor.reviews.filter(r => r.status === 'approved').length, 0
            );
            const averageRating = this.filteredContractors.length > 0 ? 
                this.filteredContractors.reduce((total, contractor) => {
                    const approvedReviews = contractor.reviews.filter(r => r.status === 'approved');
                    const contractorRating = approvedReviews.length > 0 ? 
                        parseFloat(dataModule.calculateAverageRating(approvedReviews)) : 0;
                    return total + contractorRating;
                }, 0) / this.filteredContractors.length : 0;

            document.getElementById('totalContractorsCount').textContent = this.filteredContractors.length;
            document.getElementById('totalReviewsCount').textContent = totalReviews;
            document.getElementById('averageRatingCount').textContent = averageRating.toFixed(1);
        } else {
            this.renderStats();
        }
    }

    showReviewForm(contractorId) {
        this.currentContractor = contractorId;
        document.getElementById('reviewModal').style.display = 'block';
        document.getElementById('reviewForm').reset();
        this.setRating(0);
    }

    showContractorDetails(contractorId) {
        const contractor = dataModule.getContractor(contractorId);
        if (contractor) {
            const details = document.getElementById('contractorDetails');
            // Only show approved reviews to public
            const approvedReviews = contractor.reviews.filter(review => review.status === 'approved');
            
            details.innerHTML = `
                <h3>${contractor.name}</h3>
                <div class="contractor-info">
                    <p><strong>Category:</strong> ${contractor.category}</p>
                    <p><strong>Email:</strong> ${contractor.email}</p>
                    <p><strong>Phone:</strong> ${contractor.phone}</p>
                    <p><strong>Rating:</strong> ${contractor.rating} ⭐</p>
                </div>
                <div class="reviews-section">
                    <h4>Reviews (${approvedReviews.length})</h4>
                    ${approvedReviews.length > 0 ? 
                        approvedReviews.map(review => `
                            <div class="review-item">
                                <div class="review-header">
                                    <span class="reviewer-name">${review.reviewerName}</span>
                                    <span class="rating">${'⭐'.repeat(review.rating)}</span>
                                </div>
                                <div class="review-date">${dataModule.formatDate(review.date)}</div>
                                <p class="review-comment">${review.comment}</p>
                            </div>
                        `).join('') : 
                        '<p>No reviews yet. Be the first to review!</p>'
                    }
                </div>
                <div class="text-center" style="margin-top: var(--space-lg);">
                    <button class="btn btn-primary" onclick="app.showReviewForm('${contractor.id}')">
                        Leave a Review
                    </button>
                </div>
            `;
            document.getElementById('contractorModal').style.display = 'block';
        }
    }

    handleReviewSubmit() {
        // Get form values directly from input elements
        const reviewerName = document.getElementById('reviewerName').value;
        const rating = parseInt(document.getElementById('rating').value);
        const comment = document.getElementById('comment').value;

        console.log('Review form values:', { reviewerName, rating, comment }); // Debug log

        // Validate inputs
        if (!reviewerName || reviewerName.trim() === '') {
            alert('Please enter your name');
            return;
        }

        if (rating === 0 || isNaN(rating)) {
            alert('Please select a rating');
            return;
        }

        if (!comment || comment.trim() === '') {
            alert('Please enter a review comment');
            return;
        }

        const reviewData = {
            reviewerName: reviewerName.trim(),
            rating: rating,
            comment: comment.trim()
        };

        const review = dataModule.addReview(this.currentContractor, reviewData);
        if (review) {
            this.closeModal('reviewModal');
            this.renderDashboard();
        }
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }
}

// Initialize app with safety check
if (typeof dataModule !== 'undefined') {
    const app = new ContractorReviewApp();
    window.app = app;
} else {
    console.error('dataModule is not available. Make sure scripts are loaded in correct order.');
    document.addEventListener('DOMContentLoaded', function() {
        // Try initializing again after DOM is loaded
        if (typeof dataModule !== 'undefined') {
            const app = new ContractorReviewApp();
            window.app = app;
        }
    });
}