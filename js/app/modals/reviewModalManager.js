// js/app/modals/reviewModalManager.js - SIMPLIFIED WITH DIRECT CALLBACK
export class ReviewModalManager {
    constructor(dataModule, reviewManager, onReviewSubmitCallback = null) {
        this.dataModule = dataModule;
        this.reviewManager = reviewManager;
        this.onReviewSubmitCallback = onReviewSubmitCallback; // Direct callback from main app
        this.modalElement = null;
        this.isOpen = false;
        this.currentContractorId = null;
        
        // Form state
        this.currentRatings = {
            overall: 0,
            quality: 0,
            communication: 0,
            timeliness: 0,
            value: 0
        };
        
        console.log('🔧 ReviewModalManager: Created with direct callback:', !!this.onReviewSubmitCallback);
    }

    open(contractorId = null) {
        console.log('🔧 ReviewModalManager: Opening modal for contractor:', contractorId);
        this.currentContractorId = contractorId;

        // Create modal if it doesn't exist
        if (!this.modalElement) {
            console.log('🔧 ReviewModalManager: Creating new modal element');
            this.createModal();
        }

        // Reset form and populate
        this.resetForm();
        
        // Show modal
        this.showModal();
        
        this.isOpen = true;
        console.log('🔧 ReviewModalManager: Modal opened successfully');
    }

    createModal() {
        // Create modal structure from scratch
        const modalHTML = `
            <div class="modal review-modal">
                <div class="modal-content large">
                    <div class="modal-header">
                        <h2>Leave a Review</h2>
                        <button class="close" aria-label="Close modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="reviewForm" class="review-form">
                            <input type="hidden" id="contractorId" name="contractorId">
                            <input type="hidden" id="rating" name="rating" value="0">
                            <input type="hidden" id="qualityRating" name="qualityRating" value="0">
                            <input type="hidden" id="communicationRating" name="communicationRating" value="0">
                            <input type="hidden" id="timelinessRating" name="timelinessRating" value="0">
                            <input type="hidden" id="valueRating" name="valueRating" value="0">
                            
                            <div class="form-group">
                                <label for="reviewerName">Your Name *</label>
                                <input type="text" id="reviewerName" name="reviewerName" required 
                                       placeholder="Enter your name">
                            </div>

                            <!-- Overall Rating -->
                            <div class="form-group">
                                <label>Overall Rating *</label>
                                <div class="star-rating overall-rating">
                                    ${this.createStarRatingHTML('overall', 5)}
                                </div>
                            </div>

                            <!-- Category Ratings -->
                            <div class="category-ratings">
                                <h4>Rate Individual Categories (Optional)</h4>
                                
                                <div class="category-rating-group">
                                    <label>Quality of Work</label>
                                    <div class="star-rating quality-rating">
                                        ${this.createStarRatingHTML('quality', 5)}
                                    </div>
                                </div>

                                <div class="category-rating-group">
                                    <label>Communication</label>
                                    <div class="star-rating communication-rating">
                                        ${this.createStarRatingHTML('communication', 5)}
                                    </div>
                                </div>

                                <div class="category-rating-group">
                                    <label>Timeliness</label>
                                    <div class="star-rating timeliness-rating">
                                        ${this.createStarRatingHTML('timeliness', 5)}
                                    </div>
                                </div>

                                <div class="category-rating-group">
                                    <label>Value for Money</label>
                                    <div class="star-rating value-rating">
                                        ${this.createStarRatingHTML('value', 5)}
                                    </div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="projectType">Project Type *</label>
                                <select id="projectType" name="projectType" required>
                                    <option value="">Select project type</option>
                                    <option value="Home Renovation">Home Renovation</option>
                                    <option value="Plumbing">Plumbing</option>
                                    <option value="Electrical">Electrical</option>
                                    <option value="Painting">Painting</option>
                                    <option value="Roofing">Roofing</option>
                                    <option value="Landscaping">Landscaping</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="comment">Your Review *</label>
                                <textarea id="comment" name="comment" required 
                                          placeholder="Share your experience with this contractor..." 
                                          rows="4"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary cancel-review-btn">Cancel</button>
                        <button type="submit" class="btn btn-primary submit-review-btn">Submit Review</button>
                    </div>
                </div>
            </div>
        `;
        
        const template = document.createElement('template');
        template.innerHTML = modalHTML.trim();
        this.modalElement = template.content.firstChild;
        
        // Add to DOM
        document.body.appendChild(this.modalElement);
        
        // Bind events
        this.bindModalEvents();
        console.log('🔧 ReviewModalManager: Modal created and added to DOM');
    }

    createStarRatingHTML(type, maxStars) {
        let starsHTML = '';
        for (let i = 1; i <= maxStars; i++) {
            starsHTML += `
                <span class="material-star" data-rating="${i}" data-type="${type}">
                    <i class="material-icons">star_border</i>
                </span>
            `;
        }
        return starsHTML;
    }

    bindModalEvents() {
        if (!this.modalElement) return;

        // Close button
        const closeBtn = this.modalElement.querySelector('.close');
        closeBtn.addEventListener('click', () => {
            console.log('🔧 ReviewModalManager: Close button clicked');
            this.close();
        });

        // Cancel button
        const cancelBtn = this.modalElement.querySelector('.cancel-review-btn');
        cancelBtn.addEventListener('click', () => {
            console.log('🔧 ReviewModalManager: Cancel button clicked');
            this.close();
        });

        // Submit button
        const submitBtn = this.modalElement.querySelector('.submit-review-btn');
        submitBtn.addEventListener('click', () => {
            console.log('🔧 ReviewModalManager: Submit button clicked');
            this.handleReviewSubmit();
        });

        // Star rating events
        this.initializeStarRatings();

        // Backdrop click
        this.modalElement.addEventListener('click', (e) => {
            if (e.target === this.modalElement) {
                console.log('🔧 ReviewModalManager: Backdrop clicked');
                this.close();
            }
        });

        // Escape key
        document.addEventListener('keydown', this.handleKeydown.bind(this));
        console.log('🔧 ReviewModalManager: Modal events bound');
    }

    handleKeydown(e) {
        if (this.isOpen && e.key === 'Escape') {
            console.log('🔧 ReviewModalManager: Escape key pressed');
            this.close();
        }
    }

    initializeStarRatings() {
        // Overall rating stars
        const overallStars = this.modalElement.querySelectorAll('.overall-rating .material-star');
        overallStars.forEach(star => {
            star.addEventListener('click', () => this.handleStarClick(star, 'overall'));
        });

        // Category rating stars
        const categories = ['quality', 'communication', 'timeliness', 'value'];
        categories.forEach(category => {
            const stars = this.modalElement.querySelectorAll(`.${category}-rating .material-star`);
            stars.forEach(star => {
                star.addEventListener('click', () => this.handleStarClick(star, category));
            });
        });
    }

    handleStarClick(star, ratingType) {
        const rating = parseInt(star.getAttribute('data-rating'));
        console.log('🔧 ReviewModalManager: Star clicked - rating:', rating, 'type:', ratingType);
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
        const ratingInput = this.modalElement.querySelector(`#${inputId}`);
        if (ratingInput) {
            ratingInput.value = rating;
        }
        
        // Update star visuals for the specific rating group
        let stars;
        switch(type) {
            case 'quality':
                stars = this.modalElement.querySelectorAll('.quality-rating .material-star');
                break;
            case 'communication':
                stars = this.modalElement.querySelectorAll('.communication-rating .material-star');
                break;
            case 'timeliness':
                stars = this.modalElement.querySelectorAll('.timeliness-rating .material-star');
                break;
            case 'value':
                stars = this.modalElement.querySelectorAll('.value-rating .material-star');
                break;
            case 'overall':
            default:
                stars = this.modalElement.querySelectorAll('.overall-rating .material-star');
        }

        if (stars) {
            stars.forEach(star => {
                const starRatingValue = parseInt(star.getAttribute('data-rating'));
                const icon = star.querySelector('.material-icons');
                
                if (icon) {
                    icon.textContent = starRatingValue <= rating ? 'star' : 'star_border';
                    icon.style.color = starRatingValue <= rating ? '#ffc107' : '#ccc';
                }
                
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
            console.log('🔧 ReviewModalManager: Auto-calculating overall rating:', average);
            this.setRating(average, 'overall');
        }
    }

    showModal() {
        if (!this.modalElement) return;

        console.log('🔧 ReviewModalManager: Showing modal');
        this.modalElement.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Add animation class
        setTimeout(() => {
            this.modalElement.classList.add('modal-open');
            console.log('🔧 ReviewModalManager: modal-open class added');
        }, 10);
    }

    close() {
        if (!this.modalElement || !this.isOpen) return;

        console.log('🔧 ReviewModalManager: Closing modal');
        this.modalElement.classList.remove('modal-open');
        
        setTimeout(() => {
            this.modalElement.style.display = 'none';
            document.body.style.overflow = '';
            this.isOpen = false;
            this.resetForm();
            console.log('🔧 ReviewModalManager: Modal closed');
        }, 300);
    }

    handleReviewSubmit() {
        console.log('🔧 ReviewModalManager: Handling review submission');
        const reviewerName = this.modalElement.querySelector('#reviewerName')?.value?.trim() || '';
        const projectType = this.modalElement.querySelector('#projectType')?.value || '';
        const comment = this.modalElement.querySelector('#comment')?.value?.trim() || '';

        const reviewData = {
            reviewerName,
            rating: this.currentRatings.overall,
            qualityRating: this.currentRatings.quality,
            communicationRating: this.currentRatings.communication,
            timelinessRating: this.currentRatings.timeliness,
            valueRating: this.currentRatings.value,
            projectType,
            comment,
            contractorId: this.currentContractorId
        };

        console.log('🔧 ReviewModalManager: Review data:', reviewData);

        // Validate
        const errors = this.validateReview(reviewData);
        if (errors.length > 0) {
            console.error('🔧 ReviewModalManager: Validation errors:', errors);
            this.showFormError(errors.join('\n'));
            return;
        }

        // Use direct callback if available (simpler approach)
        if (this.onReviewSubmitCallback) {
            console.log('🔧 ReviewModalManager: Calling direct onReviewSubmitCallback');
            this.onReviewSubmitCallback(reviewData, this.currentContractorId);
            this.showFormSuccess('Review submitted successfully!');
            this.close();
        } else {
            console.error('🔧 ReviewModalManager: No review submission handler available');
            this.showFormError('Review submission is not configured properly.');
        }
    }

    validateReview(reviewData) {
        const errors = [];
        
        if (!reviewData.reviewerName) {
            errors.push('Please enter your name');
        }
        
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
        if (!this.modalElement) return;

        const form = this.modalElement.querySelector('#reviewForm');
        if (form) {
            form.reset();
        }

        // Set contractor ID if available
        if (this.currentContractorId) {
            const contractorIdInput = this.modalElement.querySelector('#contractorId');
            if (contractorIdInput) {
                contractorIdInput.value = this.currentContractorId;
            }
        }
        
        // Reset all star ratings
        this.currentRatings = {
            overall: 0,
            quality: 0,
            communication: 0,
            timeliness: 0,
            value: 0
        };
        
        // Reset all star displays
        this.setRating(0, 'overall');
        this.setRating(0, 'quality');
        this.setRating(0, 'communication');
        this.setRating(0, 'timeliness');
        this.setRating(0, 'value');
    }

    // Cleanup
    destroy() {
        if (this.modalElement) {
            document.removeEventListener('keydown', this.handleKeydown.bind(this));
            this.modalElement.remove();
            this.modalElement = null;
        }
        this.isOpen = false;
    }

    showFormError(message) {
        console.error('Review form error:', message);
        if (window.utils && window.utils.showNotification) {
            window.utils.showNotification(message, 'error');
        } else {
            alert(message);
        }
    }

    showFormSuccess(message) {
        console.log('Review form success:', message);
        if (window.utils && window.utils.showNotification) {
            window.utils.showNotification(message, 'success');
        }
    }

    // Backward compatibility - alias for old code
    openReviewModal(contractorId = null) {
        this.open(contractorId);
    }

    closeReviewModal() {
        this.close();
    }
}