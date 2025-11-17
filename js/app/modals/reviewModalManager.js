// js/app/modals/reviewModalManager.js
// Review modal specific functionality - now handles all review form operations

export class ReviewModalManager {
    constructor(dataModule, reviewManager, baseModalManager) {
        this.dataModule = dataModule;
        this.reviewManager = reviewManager;
        this.baseModalManager = baseModalManager;
        this.currentContractorId = null;
        this.isInitialized = false;
        
        // Form state
        this.currentRatings = {
            overall: 0,
            quality: 0,
            communication: 0,
            timeliness: 0,
            value: 0
        };
        
        this.eventHandlers = {
            onReviewSubmit: null
        };
        
        // Initialize formElements as empty object to prevent undefined errors
        this.formElements = {};
    }

    async openReviewModal(contractorId = null) {
        this.currentContractorId = contractorId;
        const { reviewModal } = this.baseModalManager.elements;
        
        if (reviewModal) {
            // Ensure form is initialized before resetting
            if (!this.isInitialized) {
                await this.initializeForm();
                this.isInitialized = true;
            }
            
            // Now reset form after initialization
            await this.resetForm();
            
            this.baseModalManager.openModal(reviewModal);
            
            // Set contractor ID
            if (contractorId) {
                const contractorIdInput = document.getElementById('contractorId');
                if (contractorIdInput) {
                    contractorIdInput.value = contractorId;
                }
            }
        }
    }

    async initializeForm() {
        console.log('Initializing review form...');
        
        // Cache form elements
        this.cacheFormElements();
        
        // Bind form events
        this.bindFormEvents();
        
        // Initialize star ratings
        this.initializeStarRatings();
        
        console.log('Review form initialized');
    }

    cacheFormElements() {
        this.formElements = {
            reviewForm: document.getElementById('reviewForm'),
            reviewerName: document.getElementById('reviewerName'),
            rating: document.getElementById('rating'),
            comment: document.getElementById('comment'),
            projectType: document.getElementById('projectType'),
            contractorId: document.getElementById('contractorId'),
            // Category rating elements
            qualityRating: document.getElementById('qualityRating'),
            communicationRating: document.getElementById('communicationRating'),
            timelinessRating: document.getElementById('timelinessRating'),
            valueRating: document.getElementById('valueRating')
        };
        
        console.log('📝 Form elements cached:', Object.keys(this.formElements));
    }

    bindFormEvents() {
        const { reviewForm } = this.formElements;
        
        if (reviewForm) {
            reviewForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleReviewSubmit();
            });
        }
    }

    initializeStarRatings() {
        console.log('Initializing star ratings...');
        
        // Overall rating stars
        const overallStars = document.querySelectorAll('.overall-rating .material-star');
        overallStars.forEach(star => {
            star.addEventListener('click', () => this.handleStarClick(star, 'overall'));
        });

        // Category rating stars
        const categories = ['quality', 'communication', 'timeliness', 'value'];
        categories.forEach(category => {
            const stars = document.querySelectorAll(`.${category}-rating .material-star`);
            stars.forEach(star => {
                star.addEventListener('click', () => this.handleStarClick(star, category));
            });
        });

        console.log('Star ratings initialized');
    }

    handleStarClick(star, ratingType) {
        const rating = parseInt(star.getAttribute('data-rating'));
        this.setRating(rating, ratingType);
        
        // Auto-calculate overall rating if all categories are rated
        if (ratingType !== 'overall') {
            this.calculateAndSetOverallRating();
        }
    }

    setRating(rating, type = 'overall') {
        // Update the current rating state
        this.currentRatings[type] = rating;
        
        // Update the hidden input value
        const inputId = type === 'overall' ? 'rating' : `${type}Rating`;
        const ratingInput = document.getElementById(inputId);
        if (ratingInput) {
            ratingInput.value = rating;
            console.log(`⭐ Set ${type} rating to:`, rating);
        }
        
        // Update star visuals for the specific rating group
        let stars;
        switch(type) {
            case 'quality':
                stars = document.querySelectorAll('.quality-rating .material-star');
                break;
            case 'communication':
                stars = document.querySelectorAll('.communication-rating .material-star');
                break;
            case 'timeliness':
                stars = document.querySelectorAll('.timeliness-rating .material-star');
                break;
            case 'value':
                stars = document.querySelectorAll('.value-rating .material-star');
                break;
            case 'overall':
            default:
                stars = document.querySelectorAll('.overall-rating .material-star');
        }

        if (stars) {
            stars.forEach(star => {
                const starRatingValue = parseInt(star.getAttribute('data-rating'));
                star.classList.toggle('active', starRatingValue <= rating);
                
                // Add pulse animation
                if (starRatingValue === rating) {
                    star.classList.add('pulse');
                    setTimeout(() => star.classList.remove('pulse'), 300);
                }
            });
        }
    }

    calculateAndSetOverallRating() {
        const { quality, communication, timeliness, value } = this.currentRatings;
        
        // Only calculate if all category ratings are set
        if (quality > 0 && communication > 0 && timeliness > 0 && value > 0) {
            const average = Math.round((quality + communication + timeliness + value) / 4);
            this.setRating(average, 'overall');
        }
    }

    onReviewSubmit(callback) {
        this.eventHandlers.onReviewSubmit = callback;
    }

    handleReviewSubmit() {
        const { reviewerName, projectType, comment } = this.formElements;
        
        const reviewData = {
            reviewerName: reviewerName?.value?.trim() || '',
            rating: this.currentRatings.overall,
            // Category ratings
            qualityRating: this.currentRatings.quality,
            communicationRating: this.currentRatings.communication,
            timelinessRating: this.currentRatings.timeliness,
            valueRating: this.currentRatings.value,
            projectType: projectType?.value || '',
            comment: comment?.value?.trim() || '',
            contractorId: this.currentContractorId
        };

        // Debug logging
        console.log('📝 Review form data:', reviewData);
        console.log('⭐ Current ratings state:', this.currentRatings);

        // Validate
        const errors = this.validateReview(reviewData);
        if (errors.length > 0) {
            console.log('❌ Validation errors:', errors);
            this.showFormError(errors.join('\n'));
            return;
        }

        if (this.eventHandlers.onReviewSubmit) {
            // Pass both the review data and contractor ID
            this.eventHandlers.onReviewSubmit(reviewData, this.currentContractorId);
            this.showFormSuccess('Review submitted successfully!');
            this.closeReviewModal();
        }
    }

    validateReview(reviewData) {
        const errors = [];
        
        if (!reviewData.reviewerName) {
            errors.push('Please enter your name');
        }
        
        // Check if overall rating is provided OR all category ratings are provided
        const hasOverallRating = reviewData.rating > 0 && !isNaN(reviewData.rating);
        const hasAllCategoryRatings = reviewData.qualityRating > 0 && 
                                    reviewData.communicationRating > 0 && 
                                    reviewData.timelinessRating > 0 && 
                                    reviewData.valueRating > 0;

        if (!hasOverallRating && !hasAllCategoryRatings) {
            errors.push('Please either provide an overall rating OR rate all categories (Quality, Communication, Timeliness, Value)');
        }
        
        if (!reviewData.projectType) {
            errors.push('Please select project type');
        }
        
        if (!reviewData.comment) {
            errors.push('Please enter a review comment');
        }
        
        return errors;
    }

    async resetForm() {
        console.log('Resetting review form...');
        
        // Ensure form elements are cached
        if (!this.formElements.reviewForm) {
            this.cacheFormElements();
        }
        
        const { reviewForm, projectType } = this.formElements;
        
        if (reviewForm) {
            reviewForm.reset();
        }
        if (projectType) {
            projectType.value = '';
        }
        
        // Reset all star ratings
        this.currentRatings = {
            overall: 0,
            quality: 0,
            communication: 0,
            timeliness: 0,
            value: 0
        };
        
        // Reset hidden inputs
        const ratingInputs = ['rating', 'qualityRating', 'communicationRating', 'timelinessRating', 'valueRating'];
        ratingInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) input.value = '0';
        });
        
        // Reset all star displays
        this.setRating(0, 'overall');
        this.setRating(0, 'quality');
        this.setRating(0, 'communication');
        this.setRating(0, 'timeliness');
        this.setRating(0, 'value');
        
        // Clear modal state
        this.baseModalManager.clearModalState('reviewForm');
        
        console.log('Review form reset complete');
    }

    closeReviewModal() {
        this.resetForm();
        this.baseModalManager.closeReviewModal();
    }

    showFormError(message) {
        console.error('Review form error:', message);
        if (window.utils && window.utils.showNotification) {
            window.utils.showNotification(message, 'error');
        } else {
            alert(message); // Fallback
        }
    }

    showFormSuccess(message) {
        console.log('Review form success:', message);
        if (window.utils && window.utils.showNotification) {
            window.utils.showNotification(message, 'success');
        }
    }

    // Method to pre-fill form for a specific contractor
    setContractor(contractor) {
        this.currentContractorId = contractor.id;
    }
}