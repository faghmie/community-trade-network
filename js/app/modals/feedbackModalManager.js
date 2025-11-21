/**
 * Feedback Modal Manager - ES6 Module
 * Handles user feedback collection and submission using DataModule
 */
import { showSuccess, showError } from '../../modules/notifications.js';

export class FeedbackModalManager {
    constructor(dataModule) {
        this.dataModule = dataModule;
        this.isOpen = false;
        this.currentRating = 0;
        this.modalElement = null;
        this.modalId = 'feedback-modal'; // NEW: Unique identifier for back button manager
        this.callbacks = {
            onSubmit: null,
            onClose: null
        };
    }

    /**
     * Initialize the feedback modal manager
     */
    init() {
        this.createModal();
    }

    /**
     * Create the modal HTML structure using Material Design classes
     */
    createModal() {
        // Remove existing modal if present
        if (this.modalElement) {
            this.modalElement.remove();
        }

        // Create Material Design modal structure (consistent with contractor modal)
        const modalHTML = `
            <div class="modal feedback-modal">
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Send Feedback</h2>
                        <button class="close" aria-label="Close modal">
                            <i class="material-icons">close</i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="feedback-form" class="feedback-form">
                            <!-- Rating Section -->
                            <div class="feedback-section material-form-group">
                                <label class="material-input-label">Overall Experience</label>
                                <div class="feedback-rating-stars" id="feedback-rating-stars">
                                    ${this.generateStarRatingHTML()}
                                </div>
                                <div class="rating-text" id="rating-text">Tap to rate</div>
                            </div>

                            <!-- Positive Comments -->
                            <div class="feedback-section material-form-group">
                                <label for="positive-comments" class="material-input-label">
                                    What's working well?
                                </label>
                                <textarea 
                                    id="positive-comments" 
                                    class="material-textarea" 
                                    placeholder="What do you like about the app? What features are most useful?"
                                    rows="3"
                                    maxlength="1000"
                                ></textarea>
                                <div class="material-form-help">Required - Share what you love about the app</div>
                            </div>

                            <!-- Improvement Comments -->
                            <div class="feedback-section material-form-group">
                                <label for="improvement-comments" class="material-input-label">
                                    What can be improved?
                                </label>
                                <textarea 
                                    id="improvement-comments" 
                                    class="material-textarea" 
                                    placeholder="Any issues, bugs, or features you'd like to see?"
                                    rows="3"
                                    maxlength="1000"
                                ></textarea>
                                <div class="material-form-help">Optional - Help us make the app better</div>
                            </div>

                            <!-- Optional Contact -->
                            <div class="feedback-section material-form-group">
                                <label for="contact-email" class="material-input-label">
                                    Email (optional - for follow up)
                                </label>
                                <input 
                                    type="email" 
                                    id="contact-email" 
                                    class="material-input" 
                                    placeholder="your.email@example.com"
                                >
                                <div class="material-form-help">We'll only use this to respond to your feedback</div>
                            </div>

                            <!-- Context Information (hidden) -->
                            <input type="hidden" id="page-context" value="">
                            <input type="hidden" id="feature-context" value="">
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="feedback-cancel">
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-primary" id="feedback-submit" disabled>
                            Send Feedback
                        </button>
                    </div>
                </div>
            </div>
        `;

        const template = document.createElement('template');
        template.innerHTML = modalHTML.trim();
        this.modalElement = template.content.firstChild;
        
        // NEW: Set modal ID for back button manager tracking
        this.modalElement.setAttribute('data-modal-id', this.modalId);
        
        document.body.appendChild(this.modalElement);
        this.bindModalEvents();
    }

    /**
     * Generate star rating HTML
     */
    generateStarRatingHTML() {
        let starsHTML = '';
        for (let i = 1; i <= 5; i++) {
            starsHTML += `
                <button type="button" class="star-rating-btn" data-rating="${i}" aria-label="Rate ${i} star${i !== 1 ? 's' : ''}">
                    <span class="star-icon material-icons" data-rating="${i}">star_border</span>
                </button>
            `;
        }
        return starsHTML;
    }

    /**
     * Bind event listeners
     */
    bindModalEvents() {
        if (!this.modalElement) return;

        // Close button
        const closeBtn = this.modalElement.querySelector('.close');
        closeBtn.addEventListener('click', () => this.close());

        // Cancel button
        const cancelBtn = this.modalElement.querySelector('#feedback-cancel');
        cancelBtn.addEventListener('click', () => this.close());

        // Backdrop click
        this.modalElement.addEventListener('click', (e) => {
            if (e.target === this.modalElement || e.target.classList.contains('modal-backdrop')) {
                this.close();
            }
        });

        // Star rating events
        const ratingStars = this.modalElement.querySelector('#feedback-rating-stars');
        ratingStars?.addEventListener('click', (e) => {
            const starBtn = e.target.closest('.star-rating-btn');
            if (starBtn) {
                const rating = parseInt(starBtn.dataset.rating);
                this.setRating(rating);
            }
        });

        // Form submission
        const submitBtn = this.modalElement.querySelector('#feedback-submit');
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Form validation on all input events
        const form = this.modalElement.querySelector('#feedback-form');
        const inputs = form?.querySelectorAll('textarea, input');
        inputs?.forEach(input => {
            input.addEventListener('input', () => {
                this.validateForm();
            });
        });

        // Escape key to close
        document.addEventListener('keydown', this.handleKeydown.bind(this));

        // NEW: Listen for closeModal event from back button manager
        this.modalElement.addEventListener('closeModal', (event) => {
            if (event.detail.source === 'backButton') {
                this.close();
            }
        });
    }

    handleKeydown(e) {
        if (this.isOpen && e.key === 'Escape') {
            this.close();
        }
    }

    /**
     * Set the rating and update UI
     */
    setRating(rating) {
        this.currentRating = rating;
        this.updateStarDisplay();
        this.updateRatingText();
        this.validateForm();
    }

    /**
     * Update star display based on current rating
     */
    updateStarDisplay() {
        const stars = this.modalElement.querySelectorAll('#feedback-rating-stars .star-icon');
        stars.forEach((star, index) => {
            const starRating = parseInt(star.dataset.rating);
            if (starRating <= this.currentRating) {
                star.textContent = 'star';
                star.style.color = 'var(--warning-color)';
            } else {
                star.textContent = 'star_border';
                star.style.color = 'var(--surface-400)';
            }
        });
    }

    /**
     * Update rating text based on current rating
     */
    updateRatingText() {
        const ratingText = this.modalElement.querySelector('#rating-text');
        const ratings = {
            1: 'Poor - Needs significant improvement',
            2: 'Fair - Has some issues', 
            3: 'Good - Meets expectations',
            4: 'Very Good - Exceeds expectations',
            5: 'Excellent - Outstanding experience'
        };
        ratingText.textContent = ratings[this.currentRating] || 'Tap stars to rate your experience';
        ratingText.style.color = this.currentRating > 0 ? 'var(--on-surface)' : 'var(--on-surface-variant)';
    }

    /**
     * Validate the feedback form
     */
    validateForm() {
        const submitBtn = this.modalElement.querySelector('#feedback-submit');
        const hasRating = this.currentRating > 0;
        const positiveComments = this.modalElement.querySelector('#positive-comments').value.trim();
        const improvementComments = this.modalElement.querySelector('#improvement-comments').value.trim();
        
        // Require at least one comment field to be filled along with rating
        const hasComments = positiveComments.length > 0 || improvementComments.length > 0;
        
        // Update button state
        submitBtn.disabled = !(hasRating && hasComments);
        
        // Update button text based on validation
        if (submitBtn.disabled) {
            submitBtn.textContent = 'Send Feedback';
        } else {
            submitBtn.textContent = `Send ${this.currentRating}★ Feedback`;
        }
    }

    /**
     * Open the feedback modal
     */
    open(context = {}) {
        if (this.isOpen) return;

        this.isOpen = true;
        this.currentRating = 0;
        
        // Set context information
        this.modalElement.querySelector('#page-context').value = context.page || this.getCurrentPage();
        this.modalElement.querySelector('#feature-context').value = context.feature || '';
        
        // Reset form
        this.resetForm();
        
        // Show modal
        this.showModal();

        // NEW: Dispatch modal opened event for back button manager
        this.dispatchModalOpenedEvent();
    }

    /**
     * Show the modal
     */
    showModal() {
        if (!this.modalElement) return;

        this.modalElement.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Add animation class
        setTimeout(() => {
            this.modalElement.classList.add('modal-open');
        }, 10);
    }

    /**
     * Close the feedback modal
     */
    close() {
        if (!this.modalElement || !this.isOpen) return;

        this.modalElement.classList.remove('modal-open');

        setTimeout(() => {
            this.modalElement.style.display = 'none';
            document.body.style.overflow = '';
            this.isOpen = false;
            
            // NEW: Dispatch modal closed event for back button manager
            this.dispatchModalClosedEvent();
        }, 300);
    }

    // NEW: Dispatch modal opened event
    dispatchModalOpenedEvent() {
        const event = new CustomEvent('modalOpened', {
            detail: {
                modalId: this.modalId,
                modalElement: this.modalElement
            }
        });
        document.dispatchEvent(event);
    }

    // NEW: Dispatch modal closed event
    dispatchModalClosedEvent() {
        const event = new CustomEvent('modalClosed', {
            detail: {
                modalId: this.modalId
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Reset the form to initial state
     */
    resetForm() {
        this.currentRating = 0;
        this.updateStarDisplay();
        this.updateRatingText();
        
        const form = this.modalElement.querySelector('#feedback-form');
        if (form) {
            form.reset();
        }
        
        // Force validation after reset to ensure button is disabled
        this.validateForm();
    }

    /**
     * Get current page context
     */
    getCurrentPage() {
        if (window.location.pathname.includes('admin.html')) return 'admin';
        if (document.querySelector('.map-view')) return 'map';
        if (document.querySelector('.favorites-view')) return 'favorites';
        return 'home';
    }

    /**
     * Handle form submission
     */
    async handleSubmit() {
        const submitBtn = this.modalElement.querySelector('#feedback-submit');
        const originalText = submitBtn.textContent;

        try {
            // Disable submit button
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            // Ensure data module is initialized
            await this.dataModule.ensureInitialized();

            // Collect form data
            const feedbackData = {
                rating: this.currentRating,
                positive_comments: this.modalElement.querySelector('#positive-comments').value.trim(),
                improvement_comments: this.modalElement.querySelector('#improvement-comments').value.trim(),
                contact_email: this.modalElement.querySelector('#contact-email').value.trim() || null,
                user_agent: navigator.userAgent,
                app_version: '1.0.0',
                page_context: this.modalElement.querySelector('#page-context').value,
                feature_context: this.modalElement.querySelector('#feature-context').value
            };

            // Submit via DataModule
            const success = await this.dataModule.submitFeedback(feedbackData);

            if (success) {
                showSuccess('Thank you for your feedback! We appreciate your input.');
                this.close();
            } else {
                throw new Error('Failed to submit feedback');
            }

        } catch (error) {
            console.error('Error submitting feedback:', error);
            showError('Sorry, there was an error submitting your feedback. Please try again.');
        } finally {
            // Re-enable submit button only if form is still valid
            this.validateForm();
        }
    }

    /**
     * Set callbacks for external handlers
     */
    on(event, callback) {
        if (this.callbacks.hasOwnProperty(event)) {
            this.callbacks[event] = callback;
        }
    }

    /**
     * Check if modal is open
     */
    isModalOpen() {
        return this.isOpen;
    }

    /**
     * Destroy the modal and clean up
     */
    destroy() {
        if (this.modalElement) {
            document.removeEventListener('keydown', this.handleKeydown.bind(this));
            this.modalElement.remove();
            this.modalElement = null;
        }
        this.isOpen = false;
    }
}