// js/app/views/contractorView.js
import { BaseView } from './BaseView.js';
import { sanitizeHtml } from '../../modules/utilities.js';
import { createViewHeader } from '../utils/viewHelpers.js';

export class ContractorView extends BaseView {
    constructor(dataModule) { // REMOVED: contractorManager parameter (was unused)
        super('contractor-view');
        this.dataModule = dataModule;
        this.currentContractorId = null;
        this.currentContractor = null;
        this.currentTrustMetrics = null; // ADDED: Cache trust metrics
        this.headerHelper = null;
    }

    render() {
        const mainContainer = document.getElementById('mainViewContainer');
        if (!mainContainer) return;

        if (!this.container) {
            this.container = document.createElement('section');
            this.container.id = this.viewId;
            this.container.className = 'contractor-view';
            this.container.style.display = 'none';
            mainContainer.appendChild(this.container);
        }

        this.renderContent();
    }

    renderContent() {
        this.headerHelper = createViewHeader(
            'contractorView',
            'Service Provider Details',
            '',
            true
        );

        this.container.innerHTML = `
            <div class="contractor-view-content">
                ${this.headerHelper.html}

                <div class="view-content">
                    <div class="contractor-details-content material-details" id="contractorDetailsContent"></div>
                </div>

                <div class="view-footer">
                    <button class="mdc-button mdc-button--raised contractor-review-btn" id="contractorReviewBtn">
                        <span class="mdc-button__label">
                            <i class="material-icons mdc-button__icon">rate_review</i>
                            Leave a Recommendation
                        </span>
                    </button>
                </div>
            </div>
        `;

        this.bindEvents();
    }

    show(contractorId = null) {
        super.show(); // CALL BASE SHOW
        if (contractorId) {
            this.loadContractor(contractorId);
        } else if (this.currentContractorId) {
            this.loadContractor(this.currentContractorId);
        }
    }

    hide() {
        super.hide(); // CALL BASE HIDE
        this.currentContractorId = null;
        this.currentContractor = null;
        this.currentTrustMetrics = null;
    }

    // KEEP: Essential for main.js integration
    open(contractorId) {
        this.show(contractorId);
    }

    // KEEP: Enhanced hide with state cleanup
    close() {
        this.hide();
    }

    bindEvents() {
        if (this.headerHelper) {
            this.headerHelper.bindBackButton(() => this.handleBack());
        }

        document.getElementById('contractorReviewBtn')?.addEventListener('click', () => this.handleReviewClick());
    }

    handleBack() {
        document.dispatchEvent(new CustomEvent('navigationViewChange', {
            detail: { view: 'back' }
        }));
    }

    handleReviewClick() {
        if (this.currentContractorId) {
            document.dispatchEvent(new CustomEvent('navigationViewChange', {
                detail: {
                    view: 'recommendationEdit',
                    context: { contractorId: this.currentContractorId }
                }
            }));
        }
    }

    loadContractor(contractorId) {
        const contractor = this.dataModule.getContractor(contractorId);
        if (!contractor) return;

        this.currentContractorId = contractorId;
        this.currentContractor = contractor;
        this.currentTrustMetrics = contractor.trustMetrics || this.dataModule.getContractorTrustMetrics(contractorId);

        this.updateViewHeader(contractor);
        this.updateContractorDetails(contractor);
    }

    updateViewHeader(contractor) {
        const displayRating = this.currentTrustMetrics?.trustScore ? (this.currentTrustMetrics.trustScore / 20).toFixed(1) : '0.0';
        const recommendationCount = this.currentTrustMetrics?.totalRecommendations || 0;

        if (this.headerHelper) {
            const subtitleHtml = this.createEnhancedSubtitleHTML(contractor.category, displayRating, recommendationCount);
            this.headerHelper.updateHeader(contractor.name, subtitleHtml);
        }
    }

    createEnhancedSubtitleHTML(category, rating, recommendationCount) {
        return `
            <span class="subtitle-badge category-badge">
                <i class="material-icons">work</i>${sanitizeHtml(category)}
            </span>
            <span class="subtitle-badge rating-badge">
                <i class="material-icons">star</i>${rating}
            </span>
            <span class="subtitle-badge recommendations-badge">
                <i class="material-icons">recommend</i>${recommendationCount} recommendation${recommendationCount !== 1 ? 's' : ''}
            </span>
        `;
    }

    updateContractorDetails(contractor) {
        const contentElement = document.getElementById('contractorDetailsContent');
        if (!contentElement) return;

        contentElement.innerHTML = this.createContractorDetailsHTML(contractor);
    }

    createContractorDetailsHTML(contractor) {
        const recommendations = this.dataModule.getApprovedRecommendationsForContractor(contractor.id);
        const categoryAverages = this.getCategoryAverages();
        const hasCategoryRatings = Object.values(categoryAverages).some(rating => rating > 0);

        return `
            <div class="contact-section">
                <h3 class="material-section-title">
                    <i class="material-icons">contact_page</i>Contact Information
                </h3>
                <div class="material-list contact-list">
                    ${contractor.email ? this.createContactListItem('email', 'Email', contractor.email, 'mailto:' + contractor.email) : ''}
                    ${contractor.phone ? this.createContactListItem('phone', 'Phone', contractor.phone, 'tel:' + contractor.phone) : ''}
                    ${contractor.location ? this.createContactListItem('location_on', 'Service Area', contractor.location) : ''}
                    ${contractor.website ? this.createContactListItem('language', 'Website', this.formatWebsite(contractor.website), contractor.website, true) : ''}
                </div>
            </div>

            ${this.currentTrustMetrics ? this.renderTrustMetricsSection() : ''}

            ${hasCategoryRatings ? this.renderRatingsSection(categoryAverages) : ''}

            ${this.renderRecommendationsSection(recommendations)}
        `;
    }

    // SIMPLIFIED: Use cached trust metrics
    getCategoryAverages() {
        if (!this.currentTrustMetrics) {
            return { quality: 0, communication: 0, timeliness: 0, value: 0 };
        }

        return {
            quality: this.currentTrustMetrics.quality || 0,
            communication: this.currentTrustMetrics.communication || 0,
            timeliness: this.currentTrustMetrics.timeliness || 0,
            value: this.currentTrustMetrics.value || 0
        };
    }

    // EXTRACTED: Trust metrics section
    renderTrustMetricsSection() {
        return `
            <div class="trust-metrics-section">
                <h3 class="material-section-title">
                    <i class="material-icons">verified</i>Community Trust Metrics
                </h3>
                <div class="material-card trust-metrics-card">
                    <div class="trust-score-display">
                        <div class="trust-score-circle">
                            <span class="trust-score-value">${this.currentTrustMetrics.trustScore || 0}</span>
                            <span class="trust-score-label">Trust Score</span>
                        </div>
                        <div class="trust-metrics-details">
                            <div class="trust-metric">
                                <span class="metric-label">Recommendation Rate</span>
                                <span class="metric-value">${this.currentTrustMetrics.recommendationRate || 0}%</span>
                            </div>
                            <div class="trust-metric">
                                <span class="metric-label">Verified Neighbors</span>
                                <span class="metric-value">${this.currentTrustMetrics.verifiedNeighborCount || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // EXTRACTED: Ratings section
    renderRatingsSection(categoryAverages) {
        return `
            <div class="ratings-section">
                <h3 class="material-section-title">
                    <i class="material-icons">assessment</i>Rating Breakdown
                </h3>
                <div class="material-card ratings-card">
                    <div class="ratings-grid">
                        ${categoryAverages.quality > 0 ? this.createMaterialRatingItem('Quality of Work', categoryAverages.quality, 'handyman') : ''}
                        ${categoryAverages.communication > 0 ? this.createMaterialRatingItem('Communication', categoryAverages.communication, 'chat') : ''}
                        ${categoryAverages.timeliness > 0 ? this.createMaterialRatingItem('Timeliness', categoryAverages.timeliness, 'schedule') : ''}
                        ${categoryAverages.value > 0 ? this.createMaterialRatingItem('Value for Money', categoryAverages.value, 'payments') : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // EXTRACTED: Recommendations section
    renderRecommendationsSection(recommendations) {
        return `
            <div class="recommendations-section">
                <h3 class="material-section-title">
                    <i class="material-icons">rate_review</i>Community Recommendations
                    <span class="recommendations-count-badge">${recommendations.length}</span>
                </h3>
                
                <div class="recommendations-list material-list">
                    ${recommendations.length > 0 ?
                recommendations.map(recommendation => this.createMaterialRecommendationItem(recommendation)).join('') :
                this.createNoRecommendationsState()
            }
                </div>
            </div>
        `;
    }

    createContactListItem(icon, label, value, href = null, external = false) {
        const isClickable = href !== null;
        const tagName = isClickable ? 'a' : 'div';
        const attributes = isClickable ? `href="${href}" ${external ? 'target="_blank" rel="noopener"' : ''}` : '';
        const className = `material-list-item ${isClickable ? 'clickable' : ''}`;

        return `
            <${tagName} class="${className}" ${attributes}>
                <div class="list-item-icon">
                    <i class="material-icons">${icon}</i>
                </div>
                <div class="list-item-content">
                    <div class="list-item-primary">${label}</div>
                    <div class="list-item-secondary">${sanitizeHtml(value)}</div>
                </div>
                ${isClickable ? `
                <div class="list-item-trailing">
                    <i class="material-icons">${external ? 'open_in_new' : 'chevron_right'}</i>
                </div>
                ` : ''}
            </${tagName}>
        `;
    }

    createMaterialRatingItem(label, rating, icon) {
        const percentage = (rating / 5) * 100;

        return `
            <div class="material-rating-item">
                <div class="rating-item-header">
                    <div class="rating-item-info">
                        <i class="material-icons rating-item-icon">${icon}</i>
                        <span class="rating-item-label">${label}</span>
                    </div>
                    <div class="rating-item-value">
                        <span class="rating-number">${rating.toFixed(1)}</span>
                        <i class="material-icons">star</i>
                    </div>
                </div>
                <div class="material-rating-bar">
                    <div class="rating-bar-track"></div>
                    <div class="rating-bar-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }

    createMaterialRecommendationItem(recommendation) {
        const metrics = recommendation.metrics || {};
        const hasMetrics = Object.values(metrics).some(rating => rating);

        return `
            <div class="material-recommendation-item material-card">
                <div class="recommendation-header">
                    <div class="referrer-avatar-small">${recommendation.referrerName.charAt(0).toUpperCase()}</div>
                    <div class="referrer-info">
                        <div class="referrer-main">
                            <span class="referrer-name">${sanitizeHtml(recommendation.referrerName)}</span>
                            <div class="recommendation-neighborhood">
                                <i class="material-icons">location_on</i>${sanitizeHtml(recommendation.referrerNeighborhood)}
                            </div>
                        </div>
                        <div class="recommendation-meta">
                            <span class="recommendation-date">
                                <i class="material-icons">schedule</i>${this.dataModule.formatDate(recommendation.submissionDate)}
                            </span>
                            <span class="service-type-chip material-chip">
                                <i class="material-icons">handyman</i>${sanitizeHtml(recommendation.serviceUsed)}
                            </span>
                            ${recommendation.isVerified ? `
                                <span class="verified-chip material-chip verified">
                                    <i class="material-icons">verified</i>Verified
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                ${hasMetrics ? `
                <div class="recommendation-metrics">
                    <div class="metrics-mini">
                        ${this.createMetricsPills(metrics)}
                    </div>
                </div>
                ` : ''}
                
                <div class="recommendation-content">
                    <p class="recommendation-note">${sanitizeHtml(recommendation.endorsementNote)}</p>
                </div>

                ${recommendation.wouldRecommendToNeighbors ? `
                <div class="recommendation-footer">
                    <div class="would-recommend-badge">
                        <i class="material-icons">thumb_up</i>
                        <span>Would recommend to neighbors</span>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    createMetricsPills(metrics) {
        const metricTypes = [
            { key: 'quality', label: 'Quality', icon: 'handyman' },
            { key: 'communication', label: 'Communication', icon: 'chat' },
            { key: 'timeliness', label: 'Timeliness', icon: 'schedule' },
            { key: 'value', label: 'Value', icon: 'payments' }
        ];

        return metricTypes
            .filter(metric => metrics[metric.key])
            .map(metric => `
                <div class="metric-pill">
                    <i class="material-icons">${metric.icon}</i>
                    <span class="metric-label">${metric.label}</span>
                    <span class="metric-stars">${this.createStarDisplay(metrics[metric.key])}</span>
                </div>
            `).join('');
    }

    // SIMPLIFIED: Renamed from createMaterialNoRecommendationsState
    createNoRecommendationsState() {
        return `
            <div class="material-empty-state">
                <div class="empty-state-icon">
                    <i class="material-icons">recommend</i>
                </div>
                <div class="empty-state-content">
                    <h4>No recommendations yet</h4>
                    <p>Be the first to share your experience with this contractor!</p>
                </div>
            </div>
        `;
    }

    formatWebsite(website) {
        return website.replace(/^https?:\/\//, '').replace(/\/$/, '');
    }

    // SIMPLIFIED: Renamed from createFallbackStarDisplay
    createStarDisplay(rating) {
        return `
            <i class="rating-number">${rating.toFixed(0)}</i>
            <i class="material-icons star-icon">star</i>
        `;
    }
}

export default ContractorView;