import { contractorsModule } from './modules/contractors.js';
import { utils } from './utils.js';

// Main application logic
class ContractorReviewApp {
    constructor() {
        this.currentContractor = null;
        this.init();
    }

    init() {
        contractorsModule.init();
        this.bindEvents();
        this.renderContractors();
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

    renderContractors() {
        const contractors = contractorsModule.getContractors();
        const grid = document.getElementById('contractorsGrid');
        
        grid.innerHTML = contractors.map(contractor => `
            <div class="card contractor-card" onclick="app.showContractorDetails('${contractor.id}')">
                <div class="card-body">
                    <h3>${contractor.name}</h3>
                    <p class="category">${contractor.category}</p>
                    <div class="rating">${'⭐'.repeat(Math.round(contractor.rating))} ${contractor.rating}</div>
                    <p class="review-count">${contractor.reviews.length} reviews</p>
                </div>
                <div class="card-footer">
                    <button class="btn btn-primary" onclick="app.showReviewForm('${contractor.id}'); event.stopPropagation();">
                        Leave Review
                    </button>
                </div>
            </div>
        `).join('');
    }

    showReviewForm(contractorId) {
        this.currentContractor = contractorId;
        document.getElementById('reviewModal').style.display = 'block';
        document.getElementById('reviewForm').reset();
        this.setRating(0);
    }

    showContractorDetails(contractorId) {
        const contractor = contractorsModule.getContractor(contractorId);
        if (contractor) {
            const details = document.getElementById('contractorDetails');
            details.innerHTML = `
                <h3>${contractor.name}</h3>
                <div class="contractor-info">
                    <p><strong>Category:</strong> ${contractor.category}</p>
                    <p><strong>Email:</strong> ${contractor.email}</p>
                    <p><strong>Phone:</strong> ${contractor.phone}</p>
                    <p><strong>Rating:</strong> ${contractor.rating} ⭐</p>
                </div>
                <div class="reviews-section">
                    <h4>Reviews (${contractor.reviews.length})</h4>
                    ${contractor.reviews.length > 0 ? 
                        contractor.reviews.map(review => `
                            <div class="review-item">
                                <div class="review-header">
                                    <span class="reviewer-name">${review.reviewerName}</span>
                                    <span class="rating">${'⭐'.repeat(review.rating)}</span>
                                </div>
                                <div class="review-date">${utils.formatDate(review.date)}</div>
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
        const formData = new FormData(document.getElementById('reviewForm'));
        const reviewData = {
            reviewerName: formData.get('reviewerName'),
            rating: parseInt(formData.get('rating')),
            comment: formData.get('comment')
        };

        if (reviewData.rating === 0) {
            alert('Please select a rating');
            return;
        }

        const review = contractorsModule.addReview(this.currentContractor, reviewData);
        if (review) {
            utils.showNotification('Review submitted successfully!');
            this.closeModal('reviewModal');
            this.renderContractors();
        }
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }
}

// Initialize app
const app = new ContractorReviewApp();
window.app = app;