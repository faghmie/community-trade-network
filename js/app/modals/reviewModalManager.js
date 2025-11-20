// js/app/modals/reviewModalManager.js
export class ReviewModalManager {
    constructor(dataModule, reviewManager, onReviewSubmitCallback = null) {
        this.dataModule = dataModule;
        this.reviewManager = reviewManager;
        this.onReviewSubmitCallback = onReviewSubmitCallback;
        this.modalElement = null;
        this.isOpen = false;
        this.currentContractorId = null;
        this.currentContractor = null;
        
        // Form state
        this.currentRatings = {
            overall: 0,
            quality: 0,
            communication: 0,
            timeliness: 0,
            value: 0
        };
    }

    open(contractorId = null, contractor = null) {
        this.currentContractorId = contractorId;
        this.currentContractor = contractor;

        // Create modal if it doesn't exist
        if (!this.modalElement) {
            this.createMaterialModal();
        }

        // Reset form and populate
        this.resetForm();
        
        // Update modal header with contractor info if available
        if (contractor) {
            this.updateModalHeader(contractor);
        }
        
        // Show modal
        this.showModal();
        
        this.isOpen = true;
    }

    createMaterialModal() {
        // Create Material Design modal structure - SIMPLIFIED like contractor modal
        const modalHTML = `
            <div class="modal review-modal material-modal">
                <div class="modal-backdrop"></div>
                <div class="modal-content material-dialog large">
                    <div class="modal-header material-dialog-header">
                        <div class="header-content">
                            <h2 class="dialog-title">Write a Review</h2>
                            <div class="dialog-subtitle">Share your experience with this contractor</div>
                        </div>
                        <button class="material-icon-button close" aria-label="Close modal">
                            <i class="material-icons">close</i>
                        </button>
                    </div>
                    <div class="modal-body material-dialog-body">
                        <form id="reviewForm" class="review-form material-form">
                            <input type="hidden" id="contractorId" name="contractorId">
                            <input type="hidden" id="rating" name="rating" value="0">
                            <input type="hidden" id="qualityRating" name="qualityRating" value="0">
                            <input type="hidden" id="communicationRating" name="communicationRating" value="0">
                            <input type="hidden" id="timelinessRating" name="timelinessRating" value="0">
                            <input type="hidden" id="valueRating" name="valueRating" value="0">
                            
                            <!-- Reviewer Name -->
                            <div class="material-form-group">
                                <label for="reviewerName" class="material-input-label">Your Name *</label>
                                <div class="material-input-container">
                                    <input type="text" id="reviewerName" name="reviewerName" required 
                                           class="material-input"
                                           placeholder="Enter your full name">
                                    <span class="material-input-underline"></span>
                                </div>
                            </div>

                            <!-- Overall Rating Section -->
                            <div class="rating-section">
                                <h3 class="material-section-title">
                                    <i class="material-icons">star</i>
                                    Overall Rating *
                                </h3>
                                <p class="section-subtitle">How would you rate your overall experience?</p>
                                <div class="star-rating-container overall-rating" data-rating-type="overall">
                                    <div class="star-rating-display">
                                        ${this.createMaterialStarRatingHTML('overall', 5)}
                                    </div>
                                    <div class="rating-label" id="overallRatingLabel">Select a rating</div>
                                </div>
                            </div>

                            <!-- Category Ratings Section -->
                            <div class="category-ratings">
                                <h3 class="material-section-title">
                                    <i class="material-icons">assessment</i>
                                    Detailed Ratings
                                </h3>
                                <p class="section-subtitle">Rate individual aspects (optional)</p>
                                
                                <div class="category-rating-grid">
                                    <div class="category-rating-item" data-rating-type="quality">
                                        <div class="category-info">
                                            <span class="material-icons category-icon">handyman</span>
                                            <div class="category-text">
                                                <label class="category-label">Quality of Work</label>
                                                <div class="rating-label" id="qualityRatingLabel">Not rated</div>
                                            </div>
                                        </div>
                                        <div class="star-rating-display compact">
                                            ${this.createMaterialStarRatingHTML('quality', 5)}
                                        </div>
                                    </div>

                                    <div class="category-rating-item" data-rating-type="communication">
                                        <div class="category-info">
                                            <span class="material-icons category-icon">chat</span>
                                            <div class="category-text">
                                                <label class="category-label">Communication</label>
                                                <div class="rating-label" id="communicationRatingLabel">Not rated</div>
                                            </div>
                                        </div>
                                        <div class="star-rating-display compact">
                                            ${this.createMaterialStarRatingHTML('communication', 5)}
                                        </div>
                                    </div>

                                    <div class="category-rating-item" data-rating-type="timeliness">
                                        <div class="category-info">
                                            <span class="material-icons category-icon">schedule</span>
                                            <div class="category-text">
                                                <label class="category-label">Timeliness</label>
                                                <div class="rating-label" id="timelinessRatingLabel">Not rated</div>
                                            </div>
                                        </div>
                                        <div class="star-rating-display compact">
                                            ${this.createMaterialStarRatingHTML('timeliness', 5)}
                                        </div>
                                    </div>

                                    <div class="category-rating-item" data-rating-type="value">
                                        <div class="category-info">
                                            <span class="material-icons category-icon">paid</span>
                                            <div class="category-text">
                                                <label class="category-label">Value for Money</label>
                                                <div class="rating-label" id="valueRatingLabel">Not rated</div>
                                            </div>
                                        </div>
                                        <div class="star-rating-display compact">
                                            ${this.createMaterialStarRatingHTML('value', 5)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Project Type -->
                            <div class="material-form-group">
                                <label for="projectType" class="material-input-label">Project Type *</label>
                                <div class="material-select-container">
                                    <select id="projectType" name="projectType" required class="material-select">
                                        <option value="">Select project type</option>
                                        <option value="Home Renovation">Home Renovation</option>
                                        <option value="Plumbing">Plumbing</option>
                                        <option value="Electrical">Electrical</option>
                                        <option value="Painting">Painting</option>
                                        <option value="Roofing">Roofing</option>
                                        <option value="Landscaping">Landscaping</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    <span class="material-select-arrow">▼</span>
                                </div>
                            </div>

                            <!-- Review Comment -->
                            <div class="material-form-group">
                                <label for="comment" class="material-input-label">Your Review *</label>
                                <div class="material-textarea-container">
                                    <textarea id="comment" name="comment" required 
                                              class="material-textarea"
                                              placeholder="Share details about your experience... What went well? What could be improved?"
                                              rows="4"></textarea>
                                    <span class="material-input-underline"></span>
                                </div>
                                <div class="character-count">
                                    <span id="characterCount">0</span> characters
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer material-dialog-actions">
                        <button type="button" class="material-button text-button cancel-review-btn">
                            <span class="button-text">Cancel</span>
                        </button>
                        <button type="submit" class="material-button contained-button submit-review-btn" disabled>
                            <span class="button-text">Submit Review</span>
                            <span class="material-icons button-icon" aria-hidden="true">send</span>
                        </button>
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
        this.bindMaterialEvents();
    }

    createMaterialStarRatingHTML(type, maxStars) {
        let starsHTML = '';
        for (let i = 1; i <= maxStars; i++) {
            starsHTML += `
                <button type="button" class="material-star-button" 
                        data-rating="${i}" data-type="${type}"
                        aria-label="Rate ${i} star${i > 1 ? 's' : ''} for ${type}"
                        aria-pressed="false">
                    <span class="material-icons star-icon">star_border</span>
                </button>
            `;
        }
        return starsHTML;
    }

    updateModalHeader(contractor) {
        if (!this.modalElement || !contractor) return;

        const title = this.modalElement.querySelector('.dialog-title');
        const subtitle = this.modalElement.querySelector('.dialog-subtitle');
        
        if (title && subtitle) {
            title.textContent = `Review ${contractor.name}`;
            subtitle.textContent = `Share your experience with ${contractor.name}`;
        }
    }

    bindMaterialEvents() {
        if (!this.modalElement) return;

        // Close button
        const closeBtn = this.modalElement.querySelector('.close');
        closeBtn.addEventListener('click', () => {
            this.close();
        });

        // Cancel button
        const cancelBtn = this.modalElement.querySelector('.cancel-review-btn');
        cancelBtn.addEventListener('click', () => {
            this.close();
        });

        // Submit button
        const submitBtn = this.modalElement.querySelector('.submit-review-btn');
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleReviewSubmit();
        });

        // Star rating events - FIXED: Use event delegation for better reliability
        this.initializeMaterialStarRatings();

        // Form validation events
        this.initializeFormValidation();

        // Backdrop click
        const backdrop = this.modalElement.querySelector('.modal-backdrop');
        backdrop.addEventListener('click', () => {
            this.close();
        });

        // Escape key
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
    }

    handleKeydown(e) {
        if (this.isOpen && e.key === 'Escape') {
            this.close();
        }
    }

    initializeMaterialStarRatings() {
        // Use event delegation for all star buttons
        const modalBody = this.modalElement.querySelector('.modal-body');
        if (modalBody) {
            modalBody.addEventListener('click', (e) => {
                const starButton = e.target.closest('.material-star-button');
                if (starButton) {
                    e.preventDefault();
                    const rating = parseInt(starButton.getAttribute('data-rating'));
                    const type = starButton.getAttribute('data-type');
                    this.handleMaterialStarClick(starButton, type);
                }
            });

            // Also handle keyboard events
            modalBody.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    const starButton = e.target.closest('.material-star-button');
                    if (starButton) {
                        e.preventDefault();
                        const rating = parseInt(starButton.getAttribute('data-rating'));
                        const type = starButton.getAttribute('data-type');
                        this.handleMaterialStarClick(starButton, type);
                    }
                }
            });
        }

        // Initialize visual state for all ratings
        this.setMaterialRating(0, 'overall');
        this.setMaterialRating(0, 'quality');
        this.setMaterialRating(0, 'communication');
        this.setMaterialRating(0, 'timeliness');
        this.setMaterialRating(0, 'value');
    }

    initializeFormValidation() {
        // Character count for comment
        const commentTextarea = this.modalElement.querySelector('#comment');
        const characterCount = this.modalElement.querySelector('#characterCount');
        
        if (commentTextarea && characterCount) {
            commentTextarea.addEventListener('input', () => {
                const count = commentTextarea.value.length;
                characterCount.textContent = count;
                
                // Update validation state
                this.validateForm();
            });
        }

        // Input validation
        const inputs = this.modalElement.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.validateForm());
            input.addEventListener('blur', () => this.handleInputBlur(input));
            input.addEventListener('focus', () => this.handleInputFocus(input));
        });

        // Form submit prevention
        const form = this.modalElement.querySelector('#reviewForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleReviewSubmit();
            });
        }
    }

    handleInputFocus(input) {
        const container = input.closest('.material-input-container, .material-textarea-container, .material-select-container');
        if (container) {
            container.classList.add('focused');
        }
    }

    handleInputBlur(input) {
        const container = input.closest('.material-input-container, .material-textarea-container, .material-select-container');
        if (container) {
            container.classList.remove('focused');
            if (input.value) {
                container.classList.add('has-value');
            } else {
                container.classList.remove('has-value');
            }
        }
    }

    validateForm() {
        const submitBtn = this.modalElement.querySelector('.submit-review-btn');
        if (!submitBtn) return false;

        const reviewerName = this.modalElement.querySelector('#reviewerName')?.value?.trim() || '';
        const projectType = this.modalElement.querySelector('#projectType')?.value || '';
        const comment = this.modalElement.querySelector('#comment')?.value?.trim() || '';
        const hasOverallRating = this.currentRatings.overall > 0;
        const hasAnyCategoryRating = this.currentRatings.quality > 0 || 
                                   this.currentRatings.communication > 0 || 
                                   this.currentRatings.timeliness > 0 || 
                                   this.currentRatings.value > 0;

        // FIXED: Allow submission if EITHER overall rating is provided OR any category is rated
        const hasAnyRating = hasOverallRating || hasAnyCategoryRating;

        // FIXED: Remove the 10-character minimum for comment to match the validation in validateReview
        const isValid = reviewerName && 
                       projectType && 
                       comment && 
                       comment.length > 0 && // Only require non-empty, not 10 characters
                       hasAnyRating; // Only require at least one rating

        submitBtn.disabled = !isValid;
        
        return isValid;
    }

    handleMaterialStarClick(star, ratingType) {
        const rating = parseInt(star.getAttribute('data-rating'));
        
        // Update the rating
        this.setMaterialRating(rating, ratingType);
        
        // Auto-calculate overall rating if all categories are rated
        if (ratingType !== 'overall') {
            this.calculateAndSetOverallRating();
        }

        // Update form validation
        this.validateForm();
    }

    setMaterialRating(rating, type = 'overall') {
        // Update the current rating state
        this.currentRatings[type] = rating;
        
        // Update the hidden input value
        const inputId = type === 'overall' ? 'rating' : `${type}Rating`;
        const ratingInput = this.modalElement.querySelector(`#${inputId}`);
        if (ratingInput) {
            ratingInput.value = rating;
        }
        
        // Update star visuals for ALL star buttons of this type
        const allStarButtons = this.modalElement.querySelectorAll(`.material-star-button[data-type="${type}"]`);
        
        if (allStarButtons && allStarButtons.length > 0) {
            allStarButtons.forEach((starButton, index) => {
                const starRatingValue = index + 1;
                const icon = starButton.querySelector('.material-icons');
                const isActive = starRatingValue <= rating;
                
                if (icon) {
                    icon.textContent = isActive ? 'star' : 'star_border';
                    icon.style.color = isActive ? '#ffb300' : '#e0e0e0';
                    
                    // Add active class for consistent styling
                    if (isActive) {
                        starButton.classList.add('active');
                    } else {
                        starButton.classList.remove('active');
                    }
                }
                
                // Update ARIA state
                starButton.setAttribute('aria-pressed', isActive.toString());
                
                // Add animation for the clicked star
                if (starRatingValue === rating) {
                    starButton.classList.add('star-pulse');
                    setTimeout(() => starButton.classList.remove('star-pulse'), 300);
                }
            });
        }

        // Update rating label
        this.updateRatingLabel(type, rating);
    }

    updateRatingLabel(type, rating) {
        let ratingLabel;
        switch(type) {
            case 'quality':
                ratingLabel = this.modalElement.querySelector('#qualityRatingLabel');
                break;
            case 'communication':
                ratingLabel = this.modalElement.querySelector('#communicationRatingLabel');
                break;
            case 'timeliness':
                ratingLabel = this.modalElement.querySelector('#timelinessRatingLabel');
                break;
            case 'value':
                ratingLabel = this.modalElement.querySelector('#valueRatingLabel');
                break;
            case 'overall':
            default:
                ratingLabel = this.modalElement.querySelector('#overallRatingLabel');
        }

        if (ratingLabel) {
            if (rating > 0) {
                const ratingText = this.getRatingText(rating);
                ratingLabel.textContent = `${rating}/5 - ${ratingText}`;
                ratingLabel.classList.add('has-rating');
            } else {
                ratingLabel.textContent = type === 'overall' ? 'Select a rating' : 'Not rated';
                ratingLabel.classList.remove('has-rating');
            }
        }
    }

    getRatingText(rating) {
        const ratings = {
            1: 'Poor',
            2: 'Fair',
            3: 'Good',
            4: 'Very Good',
            5: 'Excellent'
        };
        return ratings[rating] || '';
    }

    calculateAndSetOverallRating() {
        const { quality, communication, timeliness, value } = this.currentRatings;
        
        // Only calculate if all category ratings are set
        if (quality > 0 && communication > 0 && timeliness > 0 && value > 0) {
            const average = Math.round((quality + communication + timeliness + value) / 4);
            this.setMaterialRating(average, 'overall');
        }
    }

    showModal() {
        if (!this.modalElement) return;

        this.modalElement.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Add animation class
        setTimeout(() => {
            this.modalElement.classList.add('modal-open');
            
            // Focus on first input for accessibility
            const firstInput = this.modalElement.querySelector('#reviewerName');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }, 10);
    }

    close() {
        if (!this.modalElement || !this.isOpen) return;

        this.modalElement.classList.remove('modal-open');

        setTimeout(() => {
            this.modalElement.style.display = 'none';
            document.body.style.overflow = '';
            this.isOpen = false;
            this.resetForm();
        }, 300);
    }

    handleReviewSubmit() {
        if (!this.validateForm()) {
            this.showFormError('Please complete all required fields.');
            return;
        }

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
            contractorId: this.currentContractorId,
            date: new Date().toISOString(),
            status: 'pending'
        };

        // Validate
        const errors = this.validateReview(reviewData);
        if (errors.length > 0) {
            console.error('ReviewModalManager: Validation errors:', errors);
            this.showFormError(errors.join('\n'));
            return;
        }

        // Use direct callback if available
        if (this.onReviewSubmitCallback) {
            // Show loading state
            const submitBtn = this.modalElement.querySelector('.submit-review-btn');
            const originalText = submitBtn.querySelector('.button-text').textContent;
            submitBtn.querySelector('.button-text').textContent = 'Submitting...';
            submitBtn.disabled = true;
            
            try {
                this.onReviewSubmitCallback(reviewData, this.currentContractorId);
                this.showFormSuccess('Thank you for your review! It will be visible after approval.');
                this.close();
            } catch (error) {
                console.error('ReviewModalManager: Error submitting review:', error);
                this.showFormError('Failed to submit review. Please try again.');
                
                // Reset button state
                submitBtn.querySelector('.button-text').textContent = originalText;
                submitBtn.disabled = false;
            }
        } else {
            console.error('ReviewModalManager: No review submission handler available');
            this.showFormError('Review submission is not configured properly.');
        }
    }

    validateReview(reviewData) {
        const errors = [];
        
        if (!reviewData.reviewerName) {
            errors.push('• Please enter your name');
        }
        
        const hasOverallRating = reviewData.rating > 0 && !isNaN(reviewData.rating);
        const hasAnyCategoryRating = reviewData.qualityRating > 0 || 
                                   reviewData.communicationRating > 0 || 
                                   reviewData.timelinessRating > 0 || 
                                   reviewData.valueRating > 0;

        // FIXED: Only require at least one rating (overall OR any category)
        if (!hasOverallRating && !hasAnyCategoryRating) {
            errors.push('• Please provide at least one rating (overall or any category)');
        }
        
        if (!reviewData.projectType) {
            errors.push('• Please select a project type');
        }
        
        if (!reviewData.comment) {
            errors.push('• Please enter your review comments');
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
        
        // Reset all star displays and labels
        this.setMaterialRating(0, 'overall');
        this.setMaterialRating(0, 'quality');
        this.setMaterialRating(0, 'communication');
        this.setMaterialRating(0, 'timeliness');
        this.setMaterialRating(0, 'value');
        
        // Reset character count
        const characterCount = this.modalElement.querySelector('#characterCount');
        if (characterCount) {
            characterCount.textContent = '0';
        }
        
        // Reset input states
        const inputs = this.modalElement.querySelectorAll('.material-input-container, .material-select-container, .material-textarea-container');
        inputs.forEach(container => {
            container.classList.remove('focused', 'has-value');
        });
        
        // Reset submit button
        const submitBtn = this.modalElement.querySelector('.submit-review-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.querySelector('.button-text').textContent = 'Submit Review';
        }
    }

    // Cleanup
    destroy() {
        if (this.modalElement) {
            document.removeEventListener('keydown', this.handleKeydown);
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
        if (window.utils && window.utils.showNotification) {
            window.utils.showNotification(message, 'success');
        }
    }

    // Backward compatibility - alias for old code
    openReviewModal(contractorId = null, contractor = null) {
        this.open(contractorId, contractor);
    }

    closeReviewModal() {
        this.close();
    }

    // Additional utility methods for external access
    isModalOpen() {
        return this.isOpen;
    }

    getCurrentContractorId() {
        return this.currentContractorId;
    }
}