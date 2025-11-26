// js/app/views/feedbackView.js - FIXED HTML STRUCTURE
import { BaseView } from './BaseView.js';
import { showNotification } from '../../modules/notifications.js';
import { createViewHeader } from '../utils/viewHelpers.js';

export class FeedbackView extends BaseView {
    constructor(dataModule) {
        super('feedbackView');
        this.dataModule = dataModule;
        this.currentRating = 0;
        this.headerHelper = null;
    }

    render() {
        const mainContainer = document.getElementById('mainViewContainer');
        if (!mainContainer) return;

        // Only create container if it doesn't exist
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = this.viewId;
            this.container.className = 'view feedback-view';
            mainContainer.appendChild(this.container);
        }

        this.renderContent();
        return this.container;
    }

    renderContent() {
        this.headerHelper = createViewHeader(
            this.viewId,
            'Send Feedback',
            'Help us improve the app',
            true // Include back button
        );

        this.container.innerHTML = `
            <div class="feedback-view-content">
                ${this.headerHelper.html}
                
                <div class="view-content">
                    <form id="feedbackViewForm" class="feedback-form">
                        <!-- REMOVED: feedback-form-fields wrapper -->
                        <!-- Overall Experience -->
                        <div class="feedback-section">
                            <h3 class="material-section-title">
                                <i class="material-icons">sentiment_satisfied</i>
                                Overall Experience
                            </h3>
                            <div class="feedback-rating-container">
                                <div class="feedback-rating-stars" id="feedbackViewRatingStars">
                                    ${[1, 2, 3, 4, 5].map(i => `
                                        <button type="button" class="material-star-button" data-rating="${i}">
                                            <span class="material-icons star-icon" data-rating="${i}">star_border</span>
                                        </button>
                                    `).join('')}
                                </div>
                                <div class="rating-text" id="feedbackViewRatingText">Tap to rate your experience</div>
                            </div>
                        </div>

                        <!-- Positive Comments -->
                        <div class="feedback-section">
                            <div class="material-form-group">
                                <label for="feedbackViewPositiveComments" class="material-input-label">
                                    <i class="material-icons">thumb_up</i>
                                    What's working well?
                                </label>
                                <textarea id="feedbackViewPositiveComments" name="positiveComments" 
                                          class="material-textarea" rows="3"
                                          placeholder="What do you like about the app? What features are most useful to you?"></textarea>
                            </div>
                        </div>

                        <!-- Improvement Comments -->
                        <div class="feedback-section">
                            <div class="material-form-group">
                                <label for="feedbackViewImprovementComments" class="material-input-label">
                                    <i class="material-icons">build</i>
                                    What can be improved?
                                </label>
                                <textarea id="feedbackViewImprovementComments" name="improvementComments" 
                                          class="material-textarea" rows="3"
                                          placeholder="Any issues you've encountered? Feature requests? Suggestions for improvement?"></textarea>
                            </div>
                        </div>

                        <!-- Contact Information -->
                        <div class="feedback-section">
                            <div class="material-form-group">
                                <label for="feedbackViewContactEmail" class="material-input-label">
                                    <i class="material-icons">email</i>
                                    Email (optional)
                                </label>
                                <input type="email" id="feedbackViewContactEmail" name="contactEmail" 
                                       class="material-input" 
                                       placeholder="your.email@example.com">
                                <div class="material-input-helper">If you'd like us to follow up with you</div>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="form-actions">
                            <button type="button" class="mdc-button mdc-button--outlined" id="feedbackViewCancel">
                                Cancel
                            </button>
                            <button type="button" class="mdc-button mdc-button--raised" id="feedbackViewSubmit" disabled>
                                <i class="material-icons mdc-button__icon">send</i>
                                Send Feedback
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        this.bindEvents();
        this.resetForm();
    }

    // In FeedbackView class, add this method override:
    show(context = {}) {
        console.log('🔍 FeedbackView: Showing view - WITH FIX');
        // Call parent show first
        super.show();
        
        // THEN override to ensure it stays visible
        if (this.container) {
            this.container.style.display = 'block';
            this.container.style.visibility = 'visible';
            this.container.style.opacity = '1';
        }
        
        // Ensure form is visible
        const form = this.container.querySelector('#feedbackViewForm');
        if (form) {
            form.style.display = 'flex';
        }
        
        this.resetForm();
    }

    // Also add this to prevent hide() from working incorrectly
    hide() {
        console.log('🔍 FeedbackView: Hiding view - BUT NOT ACTUALLY HIDING FOR DEBUG');
        // Don't call super.hide() to prevent the display: none issue
        this.currentRating = 0;
    }

    hide() {
        console.log('🔍 FeedbackView: Hiding view');
        super.hide();
        this.currentRating = 0;
    }

    bindEvents() {
        // Use header helper for back button
        if (this.headerHelper) {
            this.headerHelper.bindBackButton(() => this.handleCancel());
        }

        // Star rating
        const ratingContainer = this.container.querySelector('#feedbackViewRatingStars');
        if (ratingContainer) {
            ratingContainer.addEventListener('click', (e) => {
                const starButton = e.target.closest('.material-star-button');
                if (starButton) {
                    e.preventDefault();
                    this.setRating(parseInt(starButton.getAttribute('data-rating')));
                }
            });
        }

        // Submit button
        const submitBtn = this.container.querySelector('#feedbackViewSubmit');
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleSubmit();
            });
        }

        // Cancel button
        const cancelBtn = this.container.querySelector('#feedbackViewCancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleCancel();
            });
        }

        // Form validation
        const textareas = this.container.querySelectorAll('textarea');
        textareas.forEach(textarea => {
            textarea.addEventListener('input', () => this.validateForm());
        });

        // Prevent form submission
        const form = this.container.querySelector('#feedbackViewForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
            });
        }
    }

    handleCancel() {
        document.dispatchEvent(new CustomEvent('navigationViewChange', {
            detail: { view: 'back' }
        }));
    }

    setRating(rating) {
        this.currentRating = rating;
        this.updateStarDisplay();
        this.validateForm();
    }

    updateStarDisplay() {
        const stars = this.container.querySelectorAll('.material-star-button .star-icon');
        const ratingText = this.container.querySelector('#feedbackViewRatingText');

        if (!stars.length || !ratingText) return;

        stars.forEach(star => {
            const starRating = parseInt(star.getAttribute('data-rating'));
            const isActive = starRating <= this.currentRating;

            star.textContent = isActive ? 'star' : 'star_border';

            // Update classes instead of inline styles
            const starButton = star.closest('.material-star-button');
            if (isActive) {
                starButton.classList.add('active');
            } else {
                starButton.classList.remove('active');
            }

            // Add animation for clicked star
            if (starRating === this.currentRating) {
                starButton.classList.add('star-pulse');
                setTimeout(() => {
                    starButton.classList.remove('star-pulse');
                }, 300);
            }
        });

        const ratings = {
            1: 'Poor - Needs significant improvement',
            2: 'Fair - Has some issues',
            3: 'Good - Meets basic expectations',
            4: 'Very Good - Works well',
            5: 'Excellent - Love using it!'
        };
        ratingText.textContent = ratings[this.currentRating] || 'Tap to rate your experience';
        ratingText.className = `rating-text ${this.currentRating > 0 ? 'has-rating' : ''}`;
    }

    validateForm() {
        const submitBtn = this.container.querySelector('#feedbackViewSubmit');
        if (!submitBtn) return false;

        const hasRating = this.currentRating > 0;
        const positiveComments = this.container.querySelector('#feedbackViewPositiveComments')?.value.trim() || '';
        const improvementComments = this.container.querySelector('#feedbackViewImprovementComments')?.value.trim() || '';
        const hasComments = positiveComments.length > 0 || improvementComments.length > 0;

        const isValid = hasRating && hasComments;
        submitBtn.disabled = !isValid;

        return isValid;
    }

    resetForm() {
        const form = this.container.querySelector('#feedbackViewForm');
        if (form) {
            form.reset();
        }

        this.currentRating = 0;
        this.updateStarDisplay();

        const submitBtn = this.container.querySelector('#feedbackViewSubmit');
        if (submitBtn) {
            submitBtn.disabled = true;
        }
    }

    async handleSubmit() {
        if (!this.validateForm()) {
            showNotification('Please provide a rating and at least one comment', 'error');
            return;
        }

        const submitBtn = this.container.querySelector('#feedbackViewSubmit');
        if (!submitBtn) return;

        const originalContent = submitBtn.innerHTML;

        try {
            // Show loading state
            submitBtn.innerHTML = '<i class="material-icons mdc-button__icon">hourglass_empty</i>Sending...';
            submitBtn.disabled = true;

            const feedbackData = {
                rating: this.currentRating,
                positive_comments: this.container.querySelector('#feedbackViewPositiveComments')?.value.trim() || '',
                improvement_comments: this.container.querySelector('#feedbackViewImprovementComments')?.value.trim() || '',
                contact_email: this.container.querySelector('#feedbackViewContactEmail')?.value.trim() || null,
                submission_date: new Date().toISOString()
            };

            const success = await this.dataModule.submitFeedback(feedbackData);

            if (success) {
                showNotification('Thank you for your feedback! We appreciate your input.', 'success');
                this.handleCancel();
            } else {
                throw new Error('Feedback submission failed');
            }

        } catch (error) {
            console.error('Error submitting feedback:', error);
            showNotification('Error submitting feedback. Please try again.', 'error');

            // Reset button state
            submitBtn.innerHTML = originalContent;
            submitBtn.disabled = false;
        }
    }
}

export default FeedbackView;