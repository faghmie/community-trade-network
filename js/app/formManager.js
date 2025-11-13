// js/app/formManager.js - UPDATED to work with current reviewManager
class FormManager {
    constructor() {
        this.elements = {};
        this.eventHandlers = {
            onReviewSubmit: null
        };
        this.currentRatings = {
            overall: 0,
            quality: 0,
            communication: 0,
            timeliness: 0,
            value: 0
        };
        this.currentContractorId = null;
    }

    async init() {
        this.cacheElements();
        this.bindEvents();
    }

    cacheElements() {
        this.elements = {
            reviewForm: document.getElementById('reviewForm'),
            reviewerName: document.getElementById('reviewerName'),
            rating: document.getElementById('rating'),
            comment: document.getElementById('comment'),
            projectType: document.getElementById('projectType'),
            // Category rating elements
            qualityRating: document.getElementById('qualityRating'),
            communicationRating: document.getElementById('communicationRating'),
            timelinessRating: document.getElementById('timelinessRating'),
            valueRating: document.getElementById('valueRating')
        };
    }

    bindEvents() {
        const { reviewForm } = this.elements;
        
        if (reviewForm) {
            reviewForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleReviewSubmit();
            });
        }

        // Bind overall rating stars
        this.bindRatingStars('.overall-rating .star', 'overall');
        
        // Bind category rating stars
        this.bindRatingStars('.quality-rating .star', 'quality');
        this.bindRatingStars('.communication-rating .star', 'communication');
        this.bindRatingStars('.timeliness-rating .star', 'timeliness');
        this.bindRatingStars('.value-rating .star', 'value');
    }

    bindRatingStars(selector, ratingType) {
        const stars = document.querySelectorAll(selector);
        stars.forEach(star => {
            star.addEventListener('click', () => {
                const rating = parseInt(star.getAttribute('data-rating'));
                this.setRating(rating, ratingType);
                
                // Auto-calculate overall rating if all categories are rated
                if (ratingType !== 'overall') {
                    this.calculateAndSetOverallRating();
                }
            });
        });
    }

    setContractorId(contractorId) {
        this.currentContractorId = contractorId;
    }

    onReviewSubmit(callback) {
        this.eventHandlers.onReviewSubmit = callback;
    }

    setRating(rating, type = 'overall') {
        // Update the current rating
        this.currentRatings[type] = rating;
        
        // Update the hidden input value
        const ratingInput = this.elements[`${type}Rating`];
        if (ratingInput) ratingInput.value = rating;
        
        // Update star visuals for the specific rating group
        let stars;
        switch(type) {
            case 'quality':
                stars = document.querySelectorAll('.quality-rating .star');
                break;
            case 'communication':
                stars = document.querySelectorAll('.communication-rating .star');
                break;
            case 'timeliness':
                stars = document.querySelectorAll('.timeliness-rating .star');
                break;
            case 'value':
                stars = document.querySelectorAll('.value-rating .star');
                break;
            case 'overall':
            default:
                stars = document.querySelectorAll('.overall-rating .star');
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

    handleReviewSubmit() {
        const { reviewerName, rating, comment, projectType } = this.elements;
        
        const reviewData = {
            reviewerName: reviewerName?.value?.trim() || '',
            rating: parseInt(rating?.value) || 0,
            // Category ratings - these match what reviewManager expects
            qualityRating: parseInt(this.elements.qualityRating?.value) || 0,
            communicationRating: parseInt(this.elements.communicationRating?.value) || 0,
            timelinessRating: parseInt(this.elements.timelinessRating?.value) || 0,
            valueRating: parseInt(this.elements.valueRating?.value) || 0,
            projectType: projectType?.value || '',
            comment: comment?.value?.trim() || ''
        };

        // Validate
        const errors = this.validateReview(reviewData);
        if (errors.length > 0) {
            alert(errors.join('\n'));
            return;
        }

        if (this.eventHandlers.onReviewSubmit) {
            // Pass both the review data and contractor ID
            this.eventHandlers.onReviewSubmit(reviewData, this.currentContractorId);
        }

        this.resetForm();
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

    resetForm() {
        const { reviewForm, rating, qualityRating, communicationRating, timelinessRating, valueRating, projectType } = this.elements;
        
        if (reviewForm) reviewForm.reset();
        if (rating) rating.value = '0';
        if (qualityRating) qualityRating.value = '0';
        if (communicationRating) communicationRating.value = '0';
        if (timelinessRating) timelinessRating.value = '0';
        if (valueRating) valueRating.value = '0';
        if (projectType) projectType.value = '';
        
        // Reset all star ratings visually
        this.setRating(0, 'overall');
        this.setRating(0, 'quality');
        this.setRating(0, 'communication');
        this.setRating(0, 'timeliness');
        this.setRating(0, 'value');
        
        this.currentRatings = {
            overall: 0,
            quality: 0,
            communication: 0,
            timeliness: 0,
            value: 0
        };
    }

    // Method to pre-fill form for a specific contractor
    setContractor(contractor) {
        this.currentContractorId = contractor.id;
        // You could pre-fill some fields here if needed
    }
}