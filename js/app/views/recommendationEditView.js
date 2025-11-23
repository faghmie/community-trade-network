// js/app/views/recommendationEditView.js
import { BaseView } from './BaseView.js';
import { showNotification } from '../../modules/notifications.js';
import { createViewHeader } from '../utils/viewHelpers.js';

export class RecommendationEditView extends BaseView {
    constructor(dataModule, recommendationDataManager, contractorManager) {
        super('recommendation-edit-view');
        this.dataModule = dataModule;
        this.recommendationDataManager = recommendationDataManager;
        this.contractorManager = contractorManager;
        this.currentContractorId = null;
        this.currentContractor = null;
        this.headerHelper = null;

        // Form state
        this.currentRatings = {
            quality: 0,
            timeliness: 0,
            communication: 0,
            value: 0
        };
    }

    render() {
        const mainContainer = document.getElementById('mainViewContainer');
        if (!mainContainer) return;

        if (!this.container) {
            this.container = document.createElement('section');
            this.container.id = this.viewId;
            this.container.className = 'recommendation-edit-view';
            this.container.style.display = 'none';
            mainContainer.appendChild(this.container);
        }

        this.renderForm();
    }

    renderForm() {
        this.headerHelper = createViewHeader(
            this.viewId,
            'Share Your Recommendation',
            'Help your neighbors find trusted service providers'
        );

        this.container.innerHTML = `
            <div class="recommendation-edit-content">
                ${this.headerHelper.html}
                <div class="view-content">
                    <form id="recommendationEditViewForm" class="recommendation-edit-form">
                        <input type="hidden" id="recommendationContractorId" name="contractorId">
                        ${this.createYourInfoSection()}
                        ${this.createServiceDetailsSection()}
                        ${this.createQualityMetricsSection()}
                        ${this.createRecommendationSection()}
                        ${this.createActionsSection()}
                    </form>
                </div>
            </div>
        `;

        this.bindEvents();
        this.resetForm();
    }

    createYourInfoSection() {
        return `
            <div class="contractor-form-section">
                <h3 class="material-section-title">
                    <i class="material-icons">person</i>
                    Your Information
                </h3>
                <div class="contractor-form-fields">
                    <div class="material-form-group">
                        <label for="referrerName" class="material-input-label">Your Name *</label>
                        <input type="text" id="referrerName" name="referrerName" class="material-input" required 
                               placeholder="Enter your full name">
                        <div class="material-input-helper">This helps build trust in the community</div>
                    </div>

                    <div class="material-form-group">
                        <label for="referrerPhone" class="material-input-label">Phone Number *</label>
                        <input type="tel" id="referrerPhone" name="referrerPhone" class="material-input" required 
                               placeholder="083 123 4567"
                               pattern="[0-9]{10}">
                        <div class="material-input-helper">For verification - only shared with community moderators</div>
                    </div>

                    <div class="material-form-group">
                        <label for="referrerNeighborhood" class="material-input-label">Your Neighborhood *</label>
                        <input type="text" id="referrerNeighborhood" name="referrerNeighborhood" class="material-input" required 
                               placeholder="e.g., Bonteheuwel, Langa, Athlone">
                    </div>

                    <div class="material-form-group">
                        <label for="referrerType" class="material-input-label">I am a *</label>
                        <select id="referrerType" name="referrerType" class="material-select" required>
                            <option value="">Select your type</option>
                            <option value="homeowner">Homeowner</option>
                            <option value="renter">Renter</option>
                            <option value="business">Business Owner</option>
                        </select>
                    </div>

                    <div class="material-form-group checkbox-group">
                        <label class="material-checkbox">
                            <input type="checkbox" id="isAnonymous" name="isAnonymous">
                            <span class="material-checkbox-checkmark"></span>
                            <span class="material-checkbox-label">Share anonymously (your name won't be shown publicly)</span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    createServiceDetailsSection() {
        return `
            <div class="contractor-form-section">
                <h3 class="material-section-title">
                    <i class="material-icons">handyman</i>
                    Service Details
                </h3>
                <div class="contractor-form-fields">
                    <div class="material-form-group">
                        <label for="serviceUsed" class="material-input-label">Type of Service *</label>
                        <input type="text" id="serviceUsed" name="serviceUsed" class="material-input" required 
                               placeholder="e.g., Garage Door Repair, Plumbing Installation">
                    </div>

                    <div class="material-form-group">
                        <label for="serviceDate" class="material-input-label">When was the service performed? *</label>
                        <input type="month" id="serviceDate" name="serviceDate" class="material-input" required 
                               max="${new Date().toISOString().slice(0, 7)}">
                    </div>
                </div>
            </div>
        `;
    }

    createQualityMetricsSection() {
        return `
            <div class="contractor-form-section">
                <h3 class="material-section-title">
                    <i class="material-icons">assessment</i>
                    Quality Metrics
                </h3>
                <div class="contractor-form-fields">
                    <p class="section-subtitle">Rate your experience (1-5 stars)</p>
                    
                    <div class="category-rating-grid">
                        ${this.createRatingItem('quality', 'handyman', 'Quality of Work')}
                        ${this.createRatingItem('timeliness', 'schedule', 'Timeliness')}
                        ${this.createRatingItem('communication', 'chat', 'Communication')}
                        ${this.createRatingItem('value', 'paid', 'Value for Money')}
                    </div>
                </div>
            </div>
        `;
    }

    createRatingItem(type, icon, label) {
        return `
            <div class="category-rating-item" data-rating-type="${type}">
                <div class="category-info">
                    <span class="material-icons category-icon">${icon}</span>
                    <div class="category-text">
                        <label class="category-label">${label}</label>
                        <div class="rating-label" id="${type}RatingLabel">Not rated</div>
                    </div>
                </div>
                <div class="star-rating-display compact">
                    ${this.createStarRatingHTML(type, 5)}
                </div>
            </div>
        `;
    }

    createRecommendationSection() {
        return `
            <div class="contractor-form-section">
                <h3 class="material-section-title">
                    <i class="material-icons">thumb_up</i>
                    Your Recommendation
                </h3>
                <div class="contractor-form-fields">
                    <div class="material-form-group">
                        <label for="endorsementNote" class="material-input-label">Your Recommendation Note *</label>
                        <textarea id="endorsementNote" name="endorsementNote" class="material-textarea" required 
                                  placeholder="Share why you recommend this service provider... What made your experience positive? How did they help you?"
                                  rows="4"></textarea>
                        <div class="character-count">
                            <span id="endorsementCharacterCount">0</span> characters
                        </div>
                    </div>

                    <div class="material-form-group checkbox-group">
                        <label class="material-checkbox">
                            <input type="checkbox" id="wouldRecommendToNeighbors" name="wouldRecommendToNeighbors" checked>
                            <span class="material-checkbox-checkmark"></span>
                            <span class="material-checkbox-label">I would recommend this provider to my neighbors</span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    createActionsSection() {
        return `
            <div class="form-actions">
                <button type="button" class="mdc-button mdc-button--outlined" id="cancelRecommendationEditView">
                    Cancel
                </button>
                <button type="button" class="mdc-button mdc-button--raised" id="submitRecommendationEditView" disabled>
                    <i class="material-icons mdc-button__icon">send</i>
                    Submit Recommendation
                </button>
            </div>
        `;
    }

    show(contractorId = null, contractor = null) {
        super.show(); // Use BaseView display logic
        this.currentContractorId = contractorId;
        this.currentContractor = contractor;
        this.updateViewHeader(contractor);
        this.populateForm();
    }

    hide() {
        super.hide(); // Use BaseView display logic
        this.currentContractorId = null;
        this.currentContractor = null;
        this.resetForm();
    }

    bindEvents() {
        if (this.headerHelper) {
            this.headerHelper.bindBackButton(() => this.handleCancel());
        }

        document.getElementById('submitRecommendationEditView')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        document.getElementById('cancelRecommendationEditView')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleCancel();
        });

        this.initializeStarRatings();
        this.initializeFormValidation();

        document.getElementById('recommendationEditViewForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
        });
    }

    handleCancel() {
        document.dispatchEvent(new CustomEvent('navigationViewChange', {
            detail: { view: 'back' }
        }));
    }

    updateViewHeader(contractor) {
        if (!this.headerHelper) return;

        if (contractor) {
            this.headerHelper.updateHeader(
                `Recommend ${contractor.name}`,
                `Share your experience with ${contractor.name}`
            );
        } else {
            this.headerHelper.updateHeader(
                'Share Your Recommendation',
                'Help your neighbors find trusted service providers'
            );
        }
    }

    populateForm() {
        if (this.currentContractorId) {
            const contractorIdInput = document.getElementById('recommendationContractorId');
            if (contractorIdInput) {
                contractorIdInput.value = this.currentContractorId;
            }
        }

        this.resetRatings();

        const characterCount = document.getElementById('endorsementCharacterCount');
        if (characterCount) {
            characterCount.textContent = '0';
        }

        const serviceDateInput = document.getElementById('serviceDate');
        if (serviceDateInput) {
            serviceDateInput.value = new Date().toISOString().slice(0, 7);
        }

        const submitBtn = document.getElementById('submitRecommendationEditView');
        if (submitBtn) {
            submitBtn.disabled = true;
        }
    }

    createStarRatingHTML(type, maxStars) {
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

    initializeStarRatings() {
        this.container?.addEventListener('click', (e) => {
            const starButton = e.target.closest('.material-star-button');
            if (starButton) {
                e.preventDefault();
                const type = starButton.getAttribute('data-type');
                this.handleStarClick(starButton, type);
            }
        });

        this.container?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const starButton = e.target.closest('.material-star-button');
                if (starButton) {
                    e.preventDefault();
                    const type = starButton.getAttribute('data-type');
                    this.handleStarClick(starButton, type);
                }
            }
        });

        this.setRating(0, 'quality');
        this.setRating(0, 'timeliness');
        this.setRating(0, 'communication');
        this.setRating(0, 'value');
    }

    initializeFormValidation() {
        const endorsementTextarea = document.getElementById('endorsementNote');
        const characterCount = document.getElementById('endorsementCharacterCount');

        if (endorsementTextarea && characterCount) {
            endorsementTextarea.addEventListener('input', () => {
                const count = endorsementTextarea.value.length;
                characterCount.textContent = count;
                this.validateForm();
            });
        }

        const phoneInput = document.getElementById('referrerPhone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 10) value = value.slice(0, 10);
                
                if (value.length >= 3) {
                    value = value.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
                }
                e.target.value = value;
                this.validateForm();
            });
        }

        const inputs = this.container.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.validateForm());
            input.addEventListener('blur', () => this.handleInputBlur(input));
            input.addEventListener('focus', () => this.handleInputFocus(input));
        });
    }

    handleInputFocus(input) {
        const container = input.closest('.material-input-container, .material-textarea-container, .material-select-container');
        container?.classList.add('focused');
    }

    handleInputBlur(input) {
        const container = input.closest('.material-input-container, .material-textarea-container, .material-select-container');
        if (container) {
            container.classList.remove('focused');
            container.classList.toggle('has-value', !!input.value);
        }
    }

    validateForm() {
        const submitBtn = document.getElementById('submitRecommendationEditView');
        if (!submitBtn) return false;

        const referrerName = document.getElementById('referrerName')?.value?.trim() || '';
        const referrerPhone = document.getElementById('referrerPhone')?.value?.replace(/\s/g, '') || '';
        const referrerNeighborhood = document.getElementById('referrerNeighborhood')?.value?.trim() || '';
        const referrerType = document.getElementById('referrerType')?.value || '';
        const serviceUsed = document.getElementById('serviceUsed')?.value?.trim() || '';
        const serviceDate = document.getElementById('serviceDate')?.value || '';
        const endorsementNote = document.getElementById('endorsementNote')?.value?.trim() || '';
        
        const hasAllRatings = this.currentRatings.quality > 0 && 
                            this.currentRatings.timeliness > 0 && 
                            this.currentRatings.communication > 0 && 
                            this.currentRatings.value > 0;

        const isValid = referrerName && 
                       referrerPhone.length >= 10 && 
                       referrerNeighborhood && 
                       referrerType && 
                       serviceUsed && 
                       serviceDate && 
                       endorsementNote && 
                       hasAllRatings;

        submitBtn.disabled = !isValid;
        return isValid;
    }

    handleStarClick(star, ratingType) {
        const rating = parseInt(star.getAttribute('data-rating'));
        this.setRating(rating, ratingType);
        this.validateForm();
    }

    setRating(rating, type) {
        this.currentRatings[type] = rating;

        const starButtons = this.container.querySelectorAll(`.material-star-button[data-type="${type}"]`);
        starButtons.forEach((button, index) => {
            const starValue = index + 1;
            const icon = button.querySelector('.material-icons');
            const isActive = starValue <= rating;

            if (icon) {
                icon.textContent = isActive ? 'star' : 'star_border';
                icon.style.color = isActive ? '#ffb300' : '#e0e0e0';
                button.classList.toggle('active', isActive);
                button.setAttribute('aria-pressed', isActive.toString());
            }

            if (starValue === rating) {
                button.classList.add('star-pulse');
                setTimeout(() => button.classList.remove('star-pulse'), 300);
            }
        });

        this.updateRatingLabel(type, rating);
    }

    updateRatingLabel(type, rating) {
        const labelMap = {
            quality: 'qualityRatingLabel',
            timeliness: 'timelinessRatingLabel',
            communication: 'communicationRatingLabel',
            value: 'valueRatingLabel'
        };

        const labelId = labelMap[type];
        const ratingLabel = document.getElementById(labelId);
        
        if (ratingLabel) {
            if (rating > 0) {
                const ratingText = this.getRatingText(rating);
                ratingLabel.textContent = `${rating}/5 - ${ratingText}`;
                ratingLabel.classList.add('has-rating');
            } else {
                ratingLabel.textContent = 'Not rated';
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

    resetRatings() {
        this.currentRatings = {
            quality: 0,
            timeliness: 0,
            communication: 0,
            value: 0
        };

        this.setRating(0, 'quality');
        this.setRating(0, 'timeliness');
        this.setRating(0, 'communication');
        this.setRating(0, 'value');
    }

    resetForm() {
        const form = document.getElementById('recommendationEditViewForm');
        form?.reset();

        this.resetRatings();

        const characterCount = document.getElementById('endorsementCharacterCount');
        if (characterCount) {
            characterCount.textContent = '0';
        }

        const inputs = this.container?.querySelectorAll('.material-input-container, .material-select-container, .material-textarea-container');
        inputs?.forEach(container => {
            container.classList.remove('focused', 'has-value');
        });

        const wouldRecommend = document.getElementById('wouldRecommendToNeighbors');
        if (wouldRecommend) {
            wouldRecommend.checked = true;
        }

        const submitBtn = document.getElementById('submitRecommendationEditView');
        if (submitBtn) {
            submitBtn.disabled = true;
        }
    }

    async handleSubmit() {
        if (!this.validateForm()) {
            this.showError('Please complete all required fields.');
            return;
        }

        const recommendationData = {
            referrerName: document.getElementById('referrerName')?.value?.trim() || '',
            referrerPhone: document.getElementById('referrerPhone')?.value?.replace(/\s/g, '') || '',
            referrerNeighborhood: document.getElementById('referrerNeighborhood')?.value?.trim() || '',
            referrerType: document.getElementById('referrerType')?.value || '',
            serviceUsed: document.getElementById('serviceUsed')?.value?.trim() || '',
            serviceDate: document.getElementById('serviceDate')?.value || '',
            endorsementNote: document.getElementById('endorsementNote')?.value?.trim() || '',
            wouldRecommendToNeighbors: document.getElementById('wouldRecommendToNeighbors')?.checked || false,
            isAnonymous: document.getElementById('isAnonymous')?.checked || false,
            metrics: {
                quality: this.currentRatings.quality,
                timeliness: this.currentRatings.timeliness,
                communication: this.currentRatings.communication,
                value: this.currentRatings.value
            }
        };

        const errors = this.validateRecommendation(recommendationData);
        if (errors.length > 0) {
            this.showError(errors.join('\n'));
            return;
        }

        try {
            const submitBtn = document.getElementById('submitRecommendationEditView');
            submitBtn.innerHTML = '<i class="material-icons mdc-button__icon">hourglass_empty</i>Submitting...';
            submitBtn.disabled = true;

            const savedRecommendation = await this.recommendationDataManager.addRecommendation(
                this.currentContractorId,
                recommendationData
            );

            showNotification('Thank you for your recommendation! It will help your neighbors find trusted providers.', 'success');

            this.handleCancel();

            document.dispatchEvent(new CustomEvent('recommendationsUpdated', {
                detail: { action: 'created', recommendation: savedRecommendation }
            }));

        } catch (error) {
            console.error('RecommendationEditView: Error submitting recommendation:', error);
            this.showError('Failed to submit recommendation. Please try again.');

            const submitBtn = document.getElementById('submitRecommendationEditView');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="material-icons mdc-button__icon">send</i>Submit Recommendation';
                submitBtn.disabled = false;
            }
        }
    }

    validateRecommendation(recommendationData) {
        const errors = [];

        if (!recommendationData.referrerName) {
            errors.push('• Please enter your name');
        }

        if (!recommendationData.referrerPhone || recommendationData.referrerPhone.length < 10) {
            errors.push('• Please enter a valid 10-digit phone number');
        }

        if (!recommendationData.referrerNeighborhood) {
            errors.push('• Please enter your neighborhood');
        }

        if (!recommendationData.referrerType) {
            errors.push('• Please select your relationship to the property');
        }

        if (!recommendationData.serviceUsed) {
            errors.push('• Please enter the type of service used');
        }

        if (!recommendationData.serviceDate) {
            errors.push('• Please select when the service was performed');
        }

        if (!recommendationData.endorsementNote) {
            errors.push('• Please write your recommendation note');
        }

        const { quality, timeliness, communication, value } = recommendationData.metrics;
        if (quality === 0 || timeliness === 0 || communication === 0 || value === 0) {
            errors.push('• Please rate all quality metrics (Quality, Timeliness, Communication, Value)');
        }

        return errors;
    }

    showError(message) {
        showNotification(message, 'error');
    }
}

export default RecommendationEditView;