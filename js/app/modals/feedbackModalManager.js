/**
 * Feedback Modal Manager
 * Handles user feedback collection and submission to Supabase
 */
class FeedbackModalManager {
    constructor() {
        this.isOpen = false;
        this.currentRating = 0;
        this.modalId = 'feedback-modal';
        this.overlayId = 'feedback-modal-overlay';
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
        this.bindEvents();
        console.log('FeedbackModalManager initialized');
    }

    /**
     * Create the modal HTML structure
     */
    createModal() {
        // Remove existing modal if present
        const existingModal = document.getElementById(this.modalId);
        if (existingModal) {
            existingModal.remove();
        }

        const modalHTML = `
            <div id="${this.overlayId}" class="modal-overlay feedback-overlay" style="display: none;">
                <div id="${this.modalId}" class="modal feedback-modal" role="dialog" aria-labelledby="feedback-modal-title" aria-modal="true">
                    <div class="modal-header">
                        <h2 id="feedback-modal-title">Send Feedback</h2>
                        <button class="modal-close" aria-label="Close feedback form">
                            <span class="material-icons">close</span>
                        </button>
                    </div>
                    
                    <div class="modal-content">
                        <form id="feedback-form" class="feedback-form">
                            <!-- Rating Section -->
                            <div class="feedback-section">
                                <label class="feedback-label">Overall Experience</label>
                                <div class="rating-stars" id="feedback-rating-stars">
                                    ${this.generateStarRatingHTML()}
                                </div>
                                <div class="rating-text" id="rating-text">Tap to rate</div>
                            </div>

                            <!-- Positive Comments -->
                            <div class="feedback-section">
                                <label for="positive-comments" class="feedback-label">
                                    What's working well?
                                </label>
                                <textarea 
                                    id="positive-comments" 
                                    class="feedback-textarea" 
                                    placeholder="What do you like about the app? What features are most useful?"
                                    rows="3"
                                ></textarea>
                            </div>

                            <!-- Improvement Comments -->
                            <div class="feedback-section">
                                <label for="improvement-comments" class="feedback-label">
                                    What can be improved?
                                </label>
                                <textarea 
                                    id="improvement-comments" 
                                    class="feedback-textarea" 
                                    placeholder="Any issues, bugs, or features you'd like to see?"
                                    rows="3"
                                ></textarea>
                            </div>

                            <!-- Optional Contact -->
                            <div class="feedback-section">
                                <label for="contact-email" class="feedback-label">
                                    Email (optional - for follow up)
                                </label>
                                <input 
                                    type="email" 
                                    id="contact-email" 
                                    class="feedback-input" 
                                    placeholder="your.email@example.com"
                                >
                            </div>

                            <!-- Context Information (hidden) -->
                            <input type="hidden" id="page-context" value="">
                            <input type="hidden" id="feature-context" value="">

                            <!-- Form Actions -->
                            <div class="feedback-actions">
                                <button type="button" class="btn-secondary" id="feedback-cancel">
                                    Cancel
                                </button>
                                <button type="submit" class="btn-primary" id="feedback-submit" disabled>
                                    Send Feedback
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * Generate star rating HTML
     */
    generateStarRatingHTML() {
        let starsHTML = '';
        for (let i = 1; i <= 5; i++) {
            starsHTML += `
                <button type="button" class="star-rating-btn" data-rating="${i}" aria-label="Rate ${i} star${i !== 1 ? 's' : ''}">
                    <span class="star-icon" data-rating="${i}">☆</span>
                </button>
            `;
        }
        return starsHTML;
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        const overlay = document.getElementById(this.overlayId);
        const modal = document.getElementById(this.modalId);
        const closeBtn = modal?.querySelector('.modal-close');
        const cancelBtn = document.getElementById('feedback-cancel');
        const form = document.getElementById('feedback-form');
        const ratingStars = document.getElementById('feedback-rating-stars');

        // Close modal events
        [overlay, closeBtn, cancelBtn].forEach(element => {
            element?.addEventListener('click', (e) => {
                if (e.target === overlay || e.target === closeBtn || e.target === cancelBtn || 
                    e.target.closest('.modal-close') || e.target.closest('#feedback-cancel')) {
                    this.close();
                }
            });
        });

        // Star rating events
        ratingStars?.addEventListener('click', (e) => {
            const starBtn = e.target.closest('.star-rating-btn');
            if (starBtn) {
                const rating = parseInt(starBtn.dataset.rating);
                this.setRating(rating);
            }
        });

        // Keyboard navigation for stars
        ratingStars?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const starBtn = e.target.closest('.star-rating-btn');
                if (starBtn) {
                    e.preventDefault();
                    const rating = parseInt(starBtn.dataset.rating);
                    this.setRating(rating);
                }
            }
        });

        // Form submission
        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Form validation
        form?.addEventListener('input', () => {
            this.validateForm();
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
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
        const stars = document.querySelectorAll('#feedback-rating-stars .star-icon');
        stars.forEach((star, index) => {
            const starRating = parseInt(star.dataset.rating);
            if (starRating <= this.currentRating) {
                star.textContent = '★';
                star.style.color = '#ffc107';
            } else {
                star.textContent = '☆';
                star.style.color = '#e0e0e0';
            }
        });
    }

    /**
     * Update rating text based on current rating
     */
    updateRatingText() {
        const ratingText = document.getElementById('rating-text');
        const ratings = {
            1: 'Poor',
            2: 'Fair', 
            3: 'Good',
            4: 'Very Good',
            5: 'Excellent'
        };
        ratingText.textContent = ratings[this.currentRating] || 'Tap to rate';
    }

    /**
     * Validate the feedback form
     */
    validateForm() {
        const submitBtn = document.getElementById('feedback-submit');
        const hasRating = this.currentRating > 0;
        const positiveComments = document.getElementById('positive-comments').value.trim();
        const improvementComments = document.getElementById('improvement-comments').value.trim();
        
        // Require at least one comment field to be filled
        const hasComments = positiveComments.length > 0 || improvementComments.length > 0;
        
        submitBtn.disabled = !(hasRating && hasComments);
    }

    /**
     * Open the feedback modal
     */
    open(context = {}) {
        if (this.isOpen) return;

        this.isOpen = true;
        this.currentRating = 0;
        
        // Set context information
        document.getElementById('page-context').value = context.page || this.getCurrentPage();
        document.getElementById('feature-context').value = context.feature || '';
        
        // Reset form
        this.resetForm();
        
        // Show modal
        const overlay = document.getElementById(this.overlayId);
        const modal = document.getElementById(this.modalId);
        
        overlay.style.display = 'block';
        modal.style.display = 'block';
        
        // Focus first element
        setTimeout(() => {
            document.getElementById('feedback-rating-stars')?.focus();
        }, 100);

        // Trigger callback
        if (this.callbacks.onOpen) {
            this.callbacks.onOpen();
        }
    }

    /**
     * Close the feedback modal
     */
    close() {
        if (!this.isOpen) return;

        this.isOpen = false;
        const overlay = document.getElementById(this.overlayId);
        const modal = document.getElementById(this.modalId);
        
        overlay.style.display = 'none';
        modal.style.display = 'none';

        // Trigger callback
        if (this.callbacks.onClose) {
            this.callbacks.onClose();
        }
    }

    /**
     * Reset the form to initial state
     */
    resetForm() {
        this.currentRating = 0;
        this.updateStarDisplay();
        this.updateRatingText();
        
        document.getElementById('feedback-form').reset();
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
        const submitBtn = document.getElementById('feedback-submit');
        const originalText = submitBtn.textContent;

        try {
            // Disable submit button
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            // Collect form data
            const feedbackData = {
                rating: this.currentRating,
                positive_comments: document.getElementById('positive-comments').value.trim(),
                improvement_comments: document.getElementById('improvement-comments').value.trim(),
                contact_email: document.getElementById('contact-email').value.trim() || null,
                user_agent: navigator.userAgent,
                app_version: '1.0.0', // Could be dynamic from manifest
                page_context: document.getElementById('page-context').value,
                feature_context: document.getElementById('feature-context').value,
                timestamp: new Date().toISOString()
            };

            // Submit to Supabase
            const success = await this.submitToSupabase(feedbackData);

            if (success) {
                this.showSuccessMessage();
                this.close();
                
                // Trigger callback
                if (this.callbacks.onSubmit) {
                    this.callbacks.onSubmit(feedbackData);
                }
            } else {
                throw new Error('Failed to submit feedback');
            }

        } catch (error) {
            console.error('Error submitting feedback:', error);
            this.showErrorMessage();
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    /**
     * Submit feedback data to Supabase
     */
    async submitToSupabase(feedbackData) {
        try {
            // Check if Supabase is available
            if (typeof window.supabaseClient === 'undefined') {
                throw new Error('Supabase client not available');
            }

            const { data, error } = await window.supabaseClient
                .from('user_feedback')
                .insert([
                    { 
                        feedback_data: feedbackData,
                        status: 'new'
                    }
                ]);

            if (error) {
                console.error('Supabase error:', error);
                return false;
            }

            console.log('Feedback submitted successfully:', data);
            return true;

        } catch (error) {
            console.error('Error submitting to Supabase:', error);
            return false;
        }
    }

    /**
     * Show success message
     */
    showSuccessMessage() {
        if (typeof window.showSuccess === 'function') {
            window.showSuccess('Thank you for your feedback! We appreciate your input.');
        } else {
            alert('Thank you for your feedback! We appreciate your input.');
        }
    }

    /**
     * Show error message
     */
    showErrorMessage() {
        if (typeof window.showError === 'function') {
            window.showError('Sorry, there was an error submitting your feedback. Please try again.');
        } else {
            alert('Sorry, there was an error submitting your feedback. Please try again.');
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
     * Destroy the modal and clean up
     */
    destroy() {
        const overlay = document.getElementById(this.overlayId);
        const modal = document.getElementById(this.modalId);
        
        if (overlay) overlay.remove();
        if (modal) modal.remove();
        
        document.removeEventListener('keydown', this.handleKeydown);
        this.isOpen = false;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FeedbackModalManager;
}