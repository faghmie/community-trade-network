// Contractor Reviews PWA - MVP 1a & 1b

class ContractorReviewApp {
    constructor() {
        this.reviews = this.loadReviews();
        this.currentRating = 0;
        this.initializeApp();
    }

    initializeApp() {
        this.bindEvents();
        this.renderContractors();
        this.registerServiceWorker();
    }

    bindEvents() {
        // Modal controls
        document.getElementById('addReviewBtn').addEventListener('click', () => this.openModal());
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelReview').addEventListener('click', () => this.closeModal());
        
        // Form submission
        document.getElementById('reviewForm').addEventListener('submit', (e) => this.handleReviewSubmit(e));
        
        // Star rating
        this.setupStarRating();
        
        // Search and filters
        document.getElementById('searchBtn').addEventListener('click', () => this.handleSearch());
        document.getElementById('searchInput').addEventListener('input', () => this.handleSearch());
        document.getElementById('categoryFilter').addEventListener('change', () => this.handleSearch());
        document.getElementById('ratingFilter').addEventListener('change', () => this.handleSearch());
        
        // Close modal when clicking outside
        document.getElementById('reviewModal').addEventListener('click', (e) => {
            if (e.target.id === 'reviewModal') {
                this.closeModal();
            }
        });
    }

    setupStarRating() {
        const stars = document.querySelectorAll('.star');
        stars.forEach(star => {
            star.addEventListener('click', () => {
                const rating = parseInt(star.dataset.rating);
                this.setRating(rating);
            });
        });
    }

    setRating(rating) {
        this.currentRating = rating;
        document.getElementById('rating').value = rating;
        
        const stars = document.querySelectorAll('.star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
                star.textContent = '★';
            } else {
                star.classList.remove('active');
                star.textContent = '☆';
            }
        });
    }

    openModal() {
        document.getElementById('reviewModal').classList.add('show');
        document.getElementById('reviewForm').reset();
        this.setRating(0);
    }

    closeModal() {
        document.getElementById('reviewModal').classList.remove('show');
    }

    handleReviewSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const review = {
            id: Date.now().toString(),
            contractorName: formData.get('contractorName'),
            service: formData.get('contractorService'),
            reviewerName: formData.get('reviewerName'),
            rating: parseInt(formData.get('rating')),
            reviewText: formData.get('reviewText'),
            projectDate: formData.get('projectDate') || new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString()
        };

        if (this.validateReview(review)) {
            this.showLoading(true);
            
            // Simulate API call delay
            setTimeout(() => {
                this.saveReview(review);
                this.showLoading(false);
                this.closeModal();
                this.renderContractors();
                this.showNotification('Review submitted successfully!');
            }, 1000);
        }
    }

    validateReview(review) {
        if (!review.contractorName.trim()) {
            this.showNotification('Please enter contractor name');
            return false;
        }
        if (!review.service) {
            this.showNotification('Please select a service type');
            return false;
        }
        if (!review.reviewerName.trim()) {
            this.showNotification('Please enter your name');
            return false;
        }
        if (!review.rating || review.rating < 1 || review.rating > 5) {
            this.showNotification('Please provide a rating');
            return false;
        }
        if (!review.reviewText.trim()) {
            this.showNotification('Please write a review');
            return false;
        }
        return true;
    }

    saveReview(review) {
        this.reviews.push(review);
        localStorage.setItem('contractorReviews', JSON.stringify(this.reviews));
    }

    loadReviews() {
        const stored = localStorage.getItem('contractorReviews');
        if (stored) {
            return JSON.parse(stored);
        }
        
        // Return sample data for demo
        return [
            {
                id: '1',
                contractorName: 'John Smith Plumbing',
                service: 'plumbing',
                reviewerName: 'Sarah Johnson',
                rating: 5,
                reviewText: 'Excellent work! Fixed our leaky pipes quickly and professionally. Highly recommended!',
                projectDate: '2024-01-15',
                createdAt: '2024-01-16T10:30:00Z'
            },
            {
                id: '2',
                contractorName: 'Bright Electric',
                service: 'electrical',
                reviewerName: 'Mike Chen',
                rating: 4,
                reviewText: 'Good service, fair pricing. Completed the electrical panel upgrade on time.',
                projectDate: '2024-01-10',
                createdAt: '2024-01-12T14:20:00Z'
            },
            {
                id: '3',
                contractorName: 'Quality Carpentry',
                service: 'carpentry',
                reviewerName: 'Lisa Rodriguez',
                rating: 5,
                reviewText: 'Amazing craftsmanship! Built custom bookshelves that exceeded our expectations.',
                projectDate: '2024-01-05',
                createdAt: '2024-01-08T09:15:00Z'
            }
        ];
    }

    handleSearch() {
        this.renderContractors();
    }

    renderContractors() {
        const contractorList = document.getElementById('contractorList');
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        const ratingFilter = parseInt(document.getElementById('ratingFilter').value);

        let filteredReviews = this.reviews.filter(review => {
            const matchesSearch = review.contractorName.toLowerCase().includes(searchTerm) ||
                                review.reviewText.toLowerCase().includes(searchTerm) ||
                                review.reviewerName.toLowerCase().includes(searchTerm);
            
            const matchesCategory = !categoryFilter || review.service === categoryFilter;
            const matchesRating = !ratingFilter || review.rating >= ratingFilter;

            return matchesSearch && matchesCategory && matchesRating;
        });

        if (filteredReviews.length === 0) {
            contractorList.innerHTML = `
                <div class="empty-state">
                    <h3>No reviews found</h3>
                    <p>Try adjusting your search or filters, or be the first to add a review!</p>
                </div>
            `;
            return;
        }

        // Group reviews by contractor
        const contractors = this.groupReviewsByContractor(filteredReviews);

        contractorList.innerHTML = contractors.map(contractor => `
            <div class="contractor-card">
                <div class="contractor-header">
                    <h3 class="contractor-name">${this.escapeHtml(contractor.name)}</h3>
                    <span class="contractor-service">${this.formatServiceType(contractor.service)}</span>
                </div>
                
                <div class="contractor-rating">
                    <div class="stars">${this.generateStars(contractor.averageRating)}</div>
                    <span class="rating-value">${contractor.averageRating.toFixed(1)}</span>
                    <span class="review-count">(${contractor.reviews.length} review${contractor.reviews.length !== 1 ? 's' : ''})</span>
                </div>

                ${contractor.reviews.map(review => `
                    <div class="review-item">
                        <div class="review-meta">
                            <strong>${this.escapeHtml(review.reviewerName)}</strong>
                            <span class="stars">${this.generateStars(review.rating)}</span>
                        </div>
                        <p class="review-text">${this.escapeHtml(review.reviewText)}</p>
                        <div class="review-meta">
                            <span class="review-date">${this.formatDate(review.projectDate)}</span>
                        </div>
                    </div>
                    ${contractor.reviews.indexOf(review) < contractor.reviews.length - 1 ? '<hr style="margin: 1rem 0; border: none; border-top: 1px solid #e5e7eb;">' : ''}
                `).join('')}
            </div>
        `).join('');
    }

    groupReviewsByContractor(reviews) {
        const contractors = {};
        
        reviews.forEach(review => {
            const key = `${review.contractorName}-${review.service}`;
            if (!contractors[key]) {
                contractors[key] = {
                    name: review.contractorName,
                    service: review.service,
                    reviews: [],
                    totalRating: 0
                };
            }
            contractors[key].reviews.push(review);
            contractors[key].totalRating += review.rating;
        });

        return Object.values(contractors).map(contractor => ({
            ...contractor,
            averageRating: contractor.totalRating / contractor.reviews.length
        })).sort((a, b) => b.averageRating - a.averageRating);
    }

    generateStars(rating) {
        const fullStars = '★'.repeat(Math.floor(rating));
        const emptyStars = '☆'.repeat(5 - Math.ceil(rating));
        return fullStars + emptyStars;
    }

    formatServiceType(service) {
        const serviceNames = {
            plumbing: 'Plumbing',
            electrical: 'Electrical',
            carpentry: 'Carpentry',
            painting: 'Painting',
            renovation: 'Renovation',
            other: 'Other'
        };
        return serviceNames[service] || service;
    }

    formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showLoading(show) {
        document.getElementById('loadingSpinner').style.display = show ? 'flex' : 'none';
    }

    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 3000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.style.transform = 'translateX(0)', 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered successfully');
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ContractorReviewApp();
});

// Add to homescreen prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install prompt (you can customize this)
    setTimeout(() => {
        if (deferredPrompt && confirm('Install Contractor Reviews app for better experience?')) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                deferredPrompt = null;
            });
        }
    }, 3000);
});