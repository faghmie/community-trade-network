// js/app/views/profileView.js
import { BaseView } from './BaseView.js';
import { createViewHeader } from '../utils/viewHelpers.js';
import { showNotification } from '../../modules/notifications.js';

export class ProfileView extends BaseView {
    constructor(dataModule) {
        super('profileView');
        this.dataModule = dataModule;
        this.favoriteContractors = []; // Array of contractor objects
        this.currentSection = 'favorites'; // 'favorites' or 'feedback'
    }

    /**
     * Render the profile view with tabs for favorites and feedback navigation
     */
    render() {
        const header = createViewHeader(
            'profileView', 
            'Profile', 
            'Manage your favorites and feedback',
            true
        );

        this.container = document.createElement('div');
        this.container.id = 'profileView';
        this.container.className = 'view profile-view';
        this.container.innerHTML = `
            ${header.html}
            
            <div class="profile-content">
                <!-- Profile Tabs -->
                <div class="profile-tabs tabs-navigation">
                    <button class="profile-tab tab-button ${this.currentSection === 'favorites' ? 'active' : ''}" 
                            data-tab="favorites">
                        <i class="material-icons">favorite</i>
                        <span class="tab-text">Favorites</span>
                        <span class="tab-badge" id="profileFavoritesBadge">0</span>
                    </button>
                    <button class="profile-tab tab-button ${this.currentSection === 'feedback' ? 'active' : ''}" 
                            data-tab="feedback">
                        <i class="material-icons">feedback</i>
                        <span class="tab-text">Feedback</span>
                    </button>
                </div>

                <!-- Favorites Section -->
                <div id="profileFavoritesSection" class="profile-section ${this.currentSection === 'favorites' ? 'active' : ''}">
                    <div class="section-header">
                        <h2>Your Favorite Contractors</h2>
                        <p>Contractors you've saved for quick access</p>
                    </div>
                    <div id="profileFavoritesList" class="contractors-list favorites-list">
                        <!-- Favorites will be populated here -->
                    </div>
                    <div id="profileEmptyFavorites" class="empty-state hidden">
                        <i class="material-icons">favorite_border</i>
                        <h3>No favorites yet</h3>
                        <p>Start browsing and add contractors to your favorites!</p>
                        <button class="btn btn-primary" data-action="browse-categories">
                            Browse Categories
                        </button>
                    </div>
                </div>

                <!-- Feedback Navigation Section -->
                <div id="profileFeedbackSection" class="profile-section ${this.currentSection === 'feedback' ? 'active' : ''}">
                    <div class="section-header">
                        <h2>App Feedback</h2>
                        <p>Share your thoughts and suggestions</p>
                    </div>
                    <div class="feedback-navigation-content">
                        <div class="navigation-card">
                            <div class="navigation-card__icon">
                                <i class="material-icons">rate_review</i>
                            </div>
                            <div class="navigation-card__content">
                                <h3>Submit Feedback</h3>
                                <p>Share your experience, report issues, or suggest improvements for the app</p>
                            </div>
                            <button class="btn btn-primary" data-action="navigate-feedback" data-navigation="true">
                                Go to Feedback
                                <i class="material-icons">arrow_forward</i>
                            </button>
                        </div>
                        
                        <div class="info-cards">
                            <div class="info-card">
                                <i class="material-icons">thumb_up</i>
                                <div class="info-card__content">
                                    <h4>Your Feedback Matters</h4>
                                    <p>Help us improve the Community Trade Network by sharing your thoughts</p>
                                </div>
                            </div>
                            <div class="info-card">
                                <i class="material-icons">security</i>
                                <div class="info-card__content">
                                    <h4>Privacy Protected</h4>
                                    <p>Your feedback is anonymous and helps us serve the community better</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add to main view container
        const mainContainer = document.getElementById('mainViewContainer');
        if (mainContainer) {
            mainContainer.appendChild(this.container);
        }

        // Bind event listeners
        this.bindEvents();
        
        // Load initial data
        this.loadFavorites();

        return this.container;
    }

    /**
     * Bind event listeners for the profile view
     */
    bindEvents() {
        // Back button
        const backButton = this.container.querySelector('#profileViewBackBtn');
        if (backButton) {
            backButton.addEventListener('click', () => this.handleBack());
        }

        // Tab switching
        const tabs = this.container.querySelectorAll('.profile-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = tab.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });

        // Favorites actions
        this.container.addEventListener('click', (e) => {
            const favoriteBtn = e.target.closest('[data-action="toggle-favorite"]');
            const contractorCard = e.target.closest('[data-contractor-id]');
            const browseBtn = e.target.closest('[data-action="browse-categories"]');
            const feedbackBtn = e.target.closest('[data-action="navigate-feedback"]');

            if (favoriteBtn) {
                e.preventDefault();
                e.stopPropagation();
                const contractorId = favoriteBtn.closest('[data-contractor-id]').getAttribute('data-contractor-id');
                this.handleToggleFavorite(contractorId);
            } else if (contractorCard) {
                e.preventDefault();
                e.stopPropagation();
                const contractorId = contractorCard.getAttribute('data-contractor-id');
                this.handleContractorSelect(contractorId);
            } else if (browseBtn) {
                e.preventDefault();
                e.stopPropagation();
                this.handleBrowseCategories();
            } else if (feedbackBtn) {
                e.preventDefault();
                e.stopPropagation();
                this.handleNavigateToFeedback();
            }
        });
    }

    /**
     * Switch between favorites and feedback tabs
     */
    switchTab(tabName) {
        this.currentSection = tabName;

        // Update tab active states
        const tabs = this.container.querySelectorAll('.profile-tab');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
        });

        // Update section visibility
        const favoritesSection = this.container.querySelector('#profileFavoritesSection');
        const feedbackSection = this.container.querySelector('#profileFeedbackSection');
        
        if (favoritesSection) {
            favoritesSection.classList.toggle('active', tabName === 'favorites');
        }
        if (feedbackSection) {
            feedbackSection.classList.toggle('active', tabName === 'feedback');
        }

        // Refresh data if needed
        if (tabName === 'favorites') {
            this.loadFavorites();
        }
    }

    /**
     * Load and display user's favorite contractors
     */
    async loadFavorites() {
        try {
            // Get full contractor objects for favorites
            this.favoriteContractors = this.dataModule.getFavoriteContractors();
            this.renderFavoritesList();
            this.updateFavoritesBadge();
        } catch (error) {
            console.error('Error loading favorites:', error);
            showNotification('Error loading favorites', 'error');
        }
    }

    /**
     * Render the favorites list with full contractor data
     */
    renderFavoritesList() {
        const favoritesList = this.container.querySelector('#profileFavoritesList');
        const emptyState = this.container.querySelector('#profileEmptyFavorites');

        if (!favoritesList || !emptyState) return;

        if (this.favoriteContractors.length === 0) {
            favoritesList.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        
        favoritesList.innerHTML = this.favoriteContractors.map(contractor => `
            <div class="contractor-card favorite-card" data-contractor-id="${contractor.id}">
                <div class="card-content">
                    <div class="contractor-info">
                        <h3 class="contractor-name">${this.escapeHtml(contractor.name)}</h3>
                        <div class="contractor-meta">
                            <p class="contractor-category">
                                <i class="material-icons">category</i>
                                ${this.escapeHtml(contractor.category)}
                            </p>
                            ${contractor.location ? `
                                <p class="contractor-location">
                                    <i class="material-icons">location_on</i>
                                    ${this.escapeHtml(contractor.location)}
                                </p>
                            ` : ''}
                        </div>
                        ${contractor.description ? `
                            <p class="contractor-description">${this.escapeHtml(contractor.description)}</p>
                        ` : ''}
                        <div class="contractor-rating">
                            <div class="rating-stars">
                                ${this.renderRatingStars(contractor.rating || contractor.overallRating || 0)}
                            </div>
                            ${contractor.reviewCount ? `
                                <span class="review-count">(${contractor.reviewCount})</span>
                            ` : ''}
                        </div>
                    </div>
                    <div class="contractor-actions">
                        <button class="material-icon-button favorite-btn active" 
                                data-action="toggle-favorite"
                                aria-label="Remove from favorites">
                            <i class="material-icons">favorite</i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render rating stars for contractor
     */
    renderRatingStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let stars = '';
        
        // Full stars
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="material-icons">star</i>';
        }
        
        // Half star
        if (hasHalfStar) {
            stars += '<i class="material-icons">star_half</i>';
        }
        
        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="material-icons">star_border</i>';
        }
        
        return stars;
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Update the favorites badge in the tab
     */
    updateFavoritesBadge() {
        const badge = this.container.querySelector('#profileFavoritesBadge');
        if (badge) {
            badge.textContent = this.favoriteContractors.length;
            badge.classList.toggle('hidden', this.favoriteContractors.length === 0);
        }
    }

    /**
     * Handle favorite toggling
     */
    async handleToggleFavorite(contractorId) {
        try {
            const success = await this.dataModule.toggleFavorite(contractorId);
            
            if (success) {
                // Reload favorites to reflect changes
                await this.loadFavorites();
                
                const contractor = this.dataModule.getContractor(contractorId);
                const isFavorite = this.dataModule.isFavorite(contractorId);
                const action = isFavorite ? 'added to' : 'removed from';
                
                showNotification(`${contractor?.name || 'Contractor'} ${action} favorites!`, 'success');
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            showNotification('Error updating favorites', 'error');
        }
    }

    /**
     * Handle contractor selection from favorites
     */
    handleContractorSelect(contractorId) {
        document.dispatchEvent(new CustomEvent('navigationViewChange', {
            detail: {
                view: 'contractor',
                context: { contractorId }
            }
        }));
    }

    /**
     * Handle browse categories action
     */
    handleBrowseCategories() {
        document.dispatchEvent(new CustomEvent('navigationViewChange', {
            detail: {
                view: 'home'
            }
        }));
    }

    /**
     * Handle navigation to feedback view
     */
    handleNavigateToFeedback() {
        document.dispatchEvent(new CustomEvent('navigationViewChange', {
            detail: {
                view: 'feedback'
            }
        }));
    }

    /**
     * Handle back navigation
     */
    handleBack() {
        document.dispatchEvent(new CustomEvent('navigationViewChange', {
            detail: {
                view: 'back'
            }
        }));
    }

    /**
     * Refresh the view when shown
     */
    show() {
        super.show();
        // Refresh data when view becomes visible
        if (this.currentSection === 'favorites') {
            this.loadFavorites();
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        super.destroy();
    }
}