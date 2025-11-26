/**
 * Admin Recommendations Table Manager
 * Handles table rendering, filtering, and row interactions for recommendations
 */

import { showNotification } from '../../modules/notifications.js';
import { sanitizeHtml } from '../../modules/utilities.js';

class AdminRecommendationsTableManager {
    constructor(dataModule) {
        this.dataModule = dataModule;
        this.recommendationManager = dataModule.getRecommendationDataManager();
        this.initialized = false;
        this.currentFilters = {
            search: '',
            status: 'all',
            contractor: 'all'
        };
        this.container = null;
    }

    /**
     * Initialize with container (consistent with other table managers)
     */
    init(container) {
        this.container = container;
        this.setupEventListeners();
        this.renderRecommendationStats();
    }

    async initializeFull() {
        if (this.initialized) return;

        try {
            await this.renderContractorFilter();
            await this.renderRecommendationsList();
            this.initialized = true;
        } catch (error) {
            console.error('Error initializing recommendations table manager:', error);
            showNotification('Error initializing recommendations table', 'error');
        }
    }

    setupEventListeners() {
        this.bindFilterEvents();
    }

    bindFilterEvents() {
        const recommendationSearch = document.getElementById('recommendationSearch');
        const contractorFilter = document.getElementById('recommendationContractorFilter');
        const statusFilter = document.getElementById('recommendationStatusFilter');

        if (recommendationSearch) {
            recommendationSearch.addEventListener('input', (e) => {
                this.currentFilters.search = e.target.value;
                this.filterRecommendations();
            });
        }

        if (contractorFilter) {
            contractorFilter.addEventListener('change', (e) => {
                this.currentFilters.contractor = e.target.value;
                this.filterRecommendations();
            });
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.currentFilters.status = e.target.value;
                this.filterRecommendations();
            });
        }
    }

    /**
     * Bind action events for view only - modal handles approve/reject/delete directly
     */
    bindActionEvents(onView) {
        if (!this.container) return;

        this.container.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            const recommendationId = target.getAttribute('data-id');
            if (!recommendationId) return;

            // Only handle view actions - modal handles approve/reject/delete directly
            if (target.classList.contains('view-recommendation') && onView) {
                onView(recommendationId);
            }
        });
    }

    async renderContractorFilter() {
        const contractorFilter = document.getElementById('recommendationContractorFilter');
        if (!contractorFilter) return;

        try {
            await this.dataModule.ensureInitialized();
            const contractors = this.dataModule.getContractors();
            const currentValue = contractorFilter.value;

            contractorFilter.innerHTML = '<option value="all">All Service Providers</option>';

            contractors.forEach(contractor => {
                if (contractor && contractor.id && contractor.name) {
                    contractorFilter.innerHTML += `<option value="${contractor.id}">${sanitizeHtml(contractor.name)}</option>`;
                }
            });

            if (currentValue && contractors.some(c => c && c.id === currentValue)) {
                contractorFilter.value = currentValue;
            }
        } catch (error) {
            console.error('Error rendering contractor filter:', error);
        }
    }

    /**
     * Render recommendations table (consistent method name)
     */
    async renderTable(filteredRecommendations = null) {
        return this.renderRecommendationsList(filteredRecommendations);
    }

    async renderRecommendationsList(filteredRecommendations = null) {
        try {
            await this.dataModule.ensureInitialized();

            const recommendations = filteredRecommendations || this.recommendationManager.getRecommendationsWithContractorInfo();

            if (!this.container) return;

            recommendations.sort((a, b) => new Date(b.submissionDate) - new Date(a.submissionDate));

            if (recommendations.length === 0) {
                this.container.innerHTML = `
                    <div class="no-recommendations">
                        <p>No recommendations found matching your criteria.</p>
                    </div>
                `;
                return;
            }

            this.container.innerHTML = recommendations.map(recommendation => this.renderRecommendationItem(recommendation)).join('');
        } catch (error) {
            console.error('Error rendering recommendations list:', error);
            showNotification('Error loading recommendations', 'error');
        }
    }

    renderRecommendationItem(recommendation) {
        const statusClass = this.getStatusClass(recommendation.moderationStatus);
        const statusLabel = this.getStatusLabel(recommendation.moderationStatus);
        const contractorName = recommendation.contractorName || 'Unknown Service Provider';
        const contractorCategory = recommendation.contractorCategory || 'Unknown Category';
        const avgRating = this.calculateAverageRating(recommendation.metrics);

        return `
        <div class="recommendation-item ${statusClass}" data-recommendation-id="${recommendation.id}">
            <div class="recommendation-header">
                <div class="referrer-info">
                    <span class="referrer-name">${sanitizeHtml(recommendation.referrerName)}</span>
                    <span class="rating">${this.generateStarIcons(avgRating)}</span>
                    <span class="referrer-type">${this.formatReferrerType(recommendation.referrerType)}</span>
                </div>
                <div class="recommendation-meta">
                    <span class="submission-date">${this.formatDate(recommendation.submissionDate)}</span>
                    <span class="recommendation-status ${statusClass}">${statusLabel}</span>
                </div>
            </div>
            <div class="recommendation-contractor">
                <strong>Service Provider:</strong> ${sanitizeHtml(contractorName)} (${sanitizeHtml(contractorCategory)})
                <br><strong>Service Type:</strong> ${sanitizeHtml(recommendation.serviceUsed || 'Not specified')}
                <br><strong>Neighborhood:</strong> ${sanitizeHtml(recommendation.referrerNeighborhood || 'Not specified')}
            </div>
            <div class="category-ratings-preview">
                <strong>Quality Metrics:</strong>
                Quality: ${this.generateStarIcons(recommendation.metrics.quality)} | 
                Timeliness: ${this.generateStarIcons(recommendation.metrics.timeliness)} | 
                Communication: ${this.generateStarIcons(recommendation.metrics.communication)} | 
                Value: ${this.generateStarIcons(recommendation.metrics.value)}
            </div>
            <p class="recommendation-comment-preview">${this.truncateText(recommendation.endorsementNote, 100)}</p>
            <div class="recommendation-actions">
                <button class="btn btn-small btn-primary view-recommendation" 
                        data-id="${recommendation.id}" title="View Details & Actions">
                    <span class="material-icons">visibility</span>
                    View Details
                </button>
            </div>
        </div>
    `;
    }

    renderRecommendationStats() {
        try {
            const allRecommendations = this.recommendationManager.getAllRecommendations();

            const stats = {
                total: allRecommendations.length,
                approved: allRecommendations.filter(r => r.moderationStatus === 'approved').length,
                pending: allRecommendations.filter(r => r.moderationStatus === 'pending').length,
                rejected: allRecommendations.filter(r => r.moderationStatus === 'rejected').length
            };

            // Update DOM elements
            const totalEl = document.getElementById('totalRecommendationsCount');
            const approvedEl = document.getElementById('approvedRecommendationsCount');
            const pendingEl = document.getElementById('pendingRecommendationsCount');
            const rejectedEl = document.getElementById('rejectedRecommendationsCount');

            if (totalEl) totalEl.textContent = stats.total;
            if (approvedEl) approvedEl.textContent = stats.approved;
            if (pendingEl) pendingEl.textContent = stats.pending;
            if (rejectedEl) rejectedEl.textContent = stats.rejected;
        } catch (error) {
            console.error('Error rendering recommendation stats:', error);
        }
    }

    async filterRecommendations() {
        try {
            const searchTerm = this.currentFilters.search;
            const statusFilter = this.currentFilters.status;
            const contractorFilter = this.currentFilters.contractor;

            await this.dataModule.ensureInitialized();
            let filteredRecommendations = this.recommendationManager.searchRecommendations(
                searchTerm,
                statusFilter,
                contractorFilter
            );

            await this.renderRecommendationsList(filteredRecommendations);
        } catch (error) {
            console.error('Error filtering recommendations:', error);
            showNotification('Error filtering recommendations', 'error');
        }
    }

    /**
     * Filter by status (for external calls)
     */
    filterByStatus(status) {
        this.currentFilters.status = status;
        this.filterRecommendations();
    }

    /**
     * Filter by search term (for external calls)
     */
    filterRecommendations(searchTerm = '') {
        this.currentFilters.search = searchTerm;
        this.filterRecommendations();
    }

    async refresh() {
        try {
            await this.recommendationManager.refresh();
            await this.renderRecommendationsList();
            this.renderRecommendationStats();
        } catch (error) {
            console.error('Error refreshing recommendations:', error);
            showNotification('Error refreshing recommendations', 'error');
        }
    }

    // Only necessary public method for stats
    getStats() {
        const allRecommendations = this.recommendationManager.getAllRecommendations();
        return {
            total: allRecommendations.length,
            approved: allRecommendations.filter(r => r.moderationStatus === 'approved').length,
            pending: allRecommendations.filter(r => r.moderationStatus === 'pending').length,
            rejected: allRecommendations.filter(r => r.moderationStatus === 'rejected').length
        };
    }

    // Helper methods
    getStatusClass(status) {
        switch (status) {
            case 'approved': return 'status-approved';
            case 'pending': return 'status-pending';
            case 'rejected': return 'status-rejected';
            default: return '';
        }
    }

    getStatusLabel(status) {
        switch (status) {
            case 'approved': return 'Approved';
            case 'pending': return 'Pending Review';
            case 'rejected': return 'Rejected';
            default: return status;
        }
    }

    formatReferrerType(type) {
        switch (type) {
            case 'homeowner': return 'Homeowner';
            case 'renter': return 'Renter';
            case 'business': return 'Business';
            default: return type;
        }
    }

    calculateAverageRating(metrics) {
        return (metrics.quality + metrics.timeliness + metrics.communication + metrics.value) / 4;
    }

    generateStarIcons(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        let stars = '⭐'.repeat(fullStars);
        if (hasHalfStar) stars += '⭐';
        return stars;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return sanitizeHtml(text);
        return sanitizeHtml(text.substring(0, maxLength)) + '...';
    }
}

export default AdminRecommendationsTableManager;