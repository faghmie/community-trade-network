// Admin Feedback Manager Module
// ES6 module for admin feedback management interface using existing FeedbackDataManager

import AdminFeedbackModalManager from '../app/modals/adminFeedbackModalManager.js';

class AdminFeedbackManager {
    constructor(feedbackDataManager) {
        this.feedbackDataManager = feedbackDataManager;
        this.adminFeedbackModalManager = new AdminFeedbackModalManager();
        this.currentFilter = 'all';
        this.currentRatingFilter = 'all';
        this.searchTerm = '';
        this.initialized = false;
    }

    async init() {
        if (!this.feedbackDataManager || !this.feedbackDataManager.isInitialized()) {
            console.warn('FeedbackDataManager not initialized yet');
            // Wait a bit and try again
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (!this.feedbackDataManager || !this.feedbackDataManager.isInitialized()) {
                console.error('FeedbackDataManager still not initialized');
                return;
            }
        }

        try {
            // Force load feedback data
            await this.feedbackDataManager.getAllFeedback();
            this.initialized = true;
            
            this.renderFeedbackList();
            this.setupEventListeners();
            this.updateStats();
            this.setupGlobalEventListeners();
            
            console.log('✅ AdminFeedbackManager initialized');
        } catch (error) {
            console.error('Error initializing AdminFeedbackManager:', error);
        }
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('feedbackSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.renderFeedbackList();
            });
        }

        // Status filter
        const statusFilter = document.getElementById('feedbackStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.renderFeedbackList();
            });
        }

        // Rating filter
        const ratingFilter = document.getElementById('feedbackRatingFilter');
        if (ratingFilter) {
            ratingFilter.addEventListener('change', (e) => {
                this.currentRatingFilter = e.target.value;
                this.renderFeedbackList();
            });
        }

        // Action buttons
        const markAllReviewedBtn = document.getElementById('markAllReviewedBtn');
        if (markAllReviewedBtn) {
            markAllReviewedBtn.addEventListener('click', () => this.handleMarkAllReviewed());
        }

        const exportBtn = document.getElementById('exportFeedbackBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.handleExport());
        }
    }

    setupGlobalEventListeners() {
        // Delegate events for dynamic content
        document.addEventListener('click', (e) => {
            if (e.target.closest('.view-feedback-btn')) {
                const feedbackId = e.target.closest('.view-feedback-btn').dataset.feedbackId;
                this.showFeedbackDetails(feedbackId);
            }

            if (e.target.closest('.mark-reviewed-btn')) {
                const feedbackId = e.target.closest('.mark-reviewed-btn').dataset.feedbackId;
                this.handleMarkAsReviewed(feedbackId);
            }

            if (e.target.closest('.mark-actioned-btn')) {
                const feedbackId = e.target.closest('.mark-actioned-btn').dataset.feedbackId;
                this.handleMarkAsActioned(feedbackId);
            }

            if (e.target.closest('.delete-feedback-btn')) {
                const feedbackId = e.target.closest('.delete-feedback-btn').dataset.feedbackId;
                this.handleDelete(feedbackId);
            }
        });

        // Listen for feedback updates
        document.addEventListener('feedbackSubmitted', () => {
            this.renderFeedbackList();
            this.updateStats();
        });

        document.addEventListener('feedbackUpdated', () => {
            this.renderFeedbackList();
            this.updateStats();
        });

        document.addEventListener('feedbackDeleted', () => {
            this.renderFeedbackList();
            this.updateStats();
        });

        document.addEventListener('feedbackBulkUpdated', () => {
            this.renderFeedbackList();
            this.updateStats();
        });
    }

    async renderFeedbackList() {
        const container = document.getElementById('feedbackList');
        if (!container) return;

        try {
            const allFeedback = await this.feedbackDataManager.getAllFeedback();
            console.log('📊 Feedback data loaded:', allFeedback);
            
            const filteredFeedback = this.filterFeedback(allFeedback);

            if (filteredFeedback.length === 0) {
                container.innerHTML = this.generateEmptyState();
                return;
            }

            // Sort by timestamp (newest first)
            filteredFeedback.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            container.innerHTML = filteredFeedback.map(item => this.generateFeedbackItem(item)).join('');
        } catch (error) {
            console.error('Error rendering feedback list:', error);
            container.innerHTML = this.generateErrorState();
        }
    }

    filterFeedback(feedback) {
        let filtered = [...feedback];

        // Status filter
        if (this.currentFilter && this.currentFilter !== 'all') {
            filtered = filtered.filter(f => f.status === this.currentFilter);
        }

        // Rating filter
        if (this.currentRatingFilter && this.currentRatingFilter !== 'all') {
            filtered = filtered.filter(f => f.rating === parseInt(this.currentRatingFilter));
        }

        // Search filter
        if (this.searchTerm) {
            filtered = filtered.filter(f => 
                (f.positive_comments && f.positive_comments.toLowerCase().includes(this.searchTerm)) ||
                (f.improvement_comments && f.improvement_comments.toLowerCase().includes(this.searchTerm)) ||
                (f.contact_email && f.contact_email.toLowerCase().includes(this.searchTerm)) ||
                (f.page_context && f.page_context.toLowerCase().includes(this.searchTerm)) ||
                (f.feature_context && f.feature_context.toLowerCase().includes(this.searchTerm))
            );
        }

        return filtered;
    }

    generateFeedbackItem(feedback) {
        const date = new Date(feedback.timestamp).toLocaleDateString();
        const time = new Date(feedback.timestamp).toLocaleTimeString();
        const ratingStars = '★'.repeat(feedback.rating) + '☆'.repeat(5 - feedback.rating);
        
        return `
            <div class="feedback-item status-${feedback.status}" data-feedback-id="${feedback.id}">
                <div class="feedback-header">
                    <div class="feedback-info">
                        <div class="feedback-meta">
                            <span class="feedback-rating" title="Rating: ${feedback.rating}/5">
                                ${ratingStars}
                            </span>
                            <span class="status-badge ${feedback.status}">${feedback.status}</span>
                            ${feedback.contact_email ? `
                                <span class="feedback-user">
                                    <span class="material-icons">email</span>
                                    ${this.escapeHtml(feedback.contact_email)}
                                </span>
                            ` : ''}
                            ${feedback.page_context ? `
                                <span class="feedback-context">
                                    <span class="material-icons">place</span>
                                    ${this.escapeHtml(feedback.page_context)}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    <div class="feedback-meta-right">
                        <span class="feedback-date">${date} at ${time}</span>
                        <div class="feedback-actions">
                            <button class="material-button outlined view-feedback-btn" data-feedback-id="${feedback.id}">
                                <span class="material-icons">visibility</span>
                                View
                            </button>
                            ${feedback.status === 'new' ? `
                                <button class="material-button contained mark-reviewed-btn" data-feedback-id="${feedback.id}">
                                    <span class="material-icons">check</span>
                                    Reviewed
                                </button>
                            ` : feedback.status === 'reviewed' ? `
                                <button class="material-button contained mark-actioned-btn" data-feedback-id="${feedback.id}">
                                    <span class="material-icons">done_all</span>
                                    Actioned
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <div class="feedback-preview">
                    <strong>Positive:</strong> ${this.escapeHtml(feedback.positive_comments.substring(0, 150))}
                    ${feedback.positive_comments.length > 150 ? '...' : ''}
                    ${feedback.improvement_comments ? `
                        <br><strong>Improvements:</strong> ${this.escapeHtml(feedback.improvement_comments.substring(0, 100))}
                        ${feedback.improvement_comments.length > 100 ? '...' : ''}
                    ` : ''}
                </div>
            </div>
        `;
    }

    generateEmptyState() {
        return `
            <div class="empty-state" id="emptyFeedbackState">
                <span class="material-icons empty-icon">feedback</span>
                <h3>No Feedback Found</h3>
                <p>No feedback matches your current filters.</p>
                <button class="material-button outlined" onclick="this.closest('.admin-feedback-manager')?.resetFilters()">
                    <span class="material-icons">refresh</span>
                    Reset Filters
                </button>
            </div>
        `;
    }

    generateErrorState() {
        return `
            <div class="empty-state error-state">
                <span class="material-icons empty-icon">error</span>
                <h3>Error Loading Feedback</h3>
                <p>There was a problem loading the feedback data.</p>
                <button class="material-button contained" onclick="location.reload()">
                    <span class="material-icons">refresh</span>
                    Try Again
                </button>
            </div>
        `;
    }

    async showFeedbackDetails(feedbackId) {
        try {
            const allFeedback = await this.feedbackDataManager.getAllFeedback();
            const feedback = allFeedback.find(f => f.id === feedbackId);
            
            if (!feedback) {
                throw new Error('Feedback not found');
            }

            // Show admin modal with callbacks
            this.adminFeedbackModalManager.show(feedback, {
                onStatusChange: (id, status) => this.handleStatusChange(id, status),
                onDelete: (id) => this.handleDelete(id)
            });
        } catch (error) {
            console.error('Error showing feedback details:', error);
            this.showNotification('Error loading feedback details', 'error');
        }
    }

    async handleStatusChange(feedbackId, newStatus) {
        try {
            if (newStatus === 'reviewed') {
                await this.feedbackDataManager.updateFeedbackStatus(feedbackId, 'reviewed');
                this.showNotification('Feedback marked as reviewed', 'success');
            } else if (newStatus === 'actioned') {
                await this.feedbackDataManager.updateFeedbackStatus(feedbackId, 'actioned');
                this.showNotification('Feedback marked as actioned', 'success');
            }
            
            this.renderFeedbackList();
            this.updateStats();
        } catch (error) {
            console.error('Error updating feedback status:', error);
            this.showNotification('Error updating feedback', 'error');
        }
    }

    async handleMarkAsReviewed(feedbackId) {
        await this.handleStatusChange(feedbackId, 'reviewed');
    }

    async handleMarkAsActioned(feedbackId) {
        await this.handleStatusChange(feedbackId, 'actioned');
    }

    async handleMarkAllReviewed() {
        try {
            const allFeedback = await this.feedbackDataManager.getAllFeedback();
            const newFeedback = allFeedback.filter(f => f.status === 'new');
            
            let count = 0;
            for (const feedback of newFeedback) {
                await this.feedbackDataManager.updateFeedbackStatus(feedback.id, 'reviewed');
                count++;
            }

            this.showNotification(`Marked ${count} feedback items as reviewed`, 'success');
            this.renderFeedbackList();
            this.updateStats();
        } catch (error) {
            console.error('Error marking all as reviewed:', error);
            this.showNotification('Error updating feedback', 'error');
        }
    }

    async handleDelete(feedbackId) {
        if (!confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) {
            return;
        }

        try {
            await this.feedbackDataManager.deleteFeedback(feedbackId);
            this.showNotification('Feedback deleted successfully', 'success');
            this.renderFeedbackList();
            this.updateStats();
        } catch (error) {
            console.error('Error deleting feedback:', error);
            this.showNotification('Error deleting feedback', 'error');
        }
    }

    async handleExport() {
        try {
            const allFeedback = await this.feedbackDataManager.getAllFeedback();
            const dataStr = JSON.stringify(allFeedback, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `feedback_export_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            this.showNotification('Feedback exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting feedback:', error);
            this.showNotification('Error exporting feedback', 'error');
        }
    }

    async updateStats() {
        try {
            const stats = await this.feedbackDataManager.getFeedbackStats();
            console.log('📊 Feedback stats:', stats);
            
            if (!stats) {
                console.warn('No feedback stats returned');
                return;
            }

            // Update main dashboard stats
            const unreadElement = document.getElementById('unreadFeedback');
            if (unreadElement) {
                unreadElement.textContent = stats.byStatus?.new || 0;
            }

            // Update feedback tab stats
            const totalElement = document.getElementById('totalFeedbackCount');
            const newCountElement = document.getElementById('newFeedbackCount');
            const reviewedCountElement = document.getElementById('reviewedFeedbackCount');
            const actionedCountElement = document.getElementById('actionedFeedbackCount');

            if (totalElement) totalElement.textContent = stats.total || 0;
            if (newCountElement) newCountElement.textContent = stats.byStatus?.new || 0;
            if (reviewedCountElement) reviewedCountElement.textContent = stats.byStatus?.reviewed || 0;
            if (actionedCountElement) actionedCountElement.textContent = stats.byStatus?.actioned || 0;

            // Update notification badge
            const badge = document.getElementById('feedbackBadge');
            if (badge) {
                const newCount = stats.byStatus?.new || 0;
                if (newCount > 0) {
                    badge.textContent = newCount;
                    badge.style.display = 'inline-flex';
                } else {
                    badge.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Error updating feedback stats:', error);
        }
    }

    resetFilters() {
        this.currentFilter = 'all';
        this.currentRatingFilter = 'all';
        this.searchTerm = '';
        
        const searchInput = document.getElementById('feedbackSearch');
        const statusFilter = document.getElementById('feedbackStatusFilter');
        const ratingFilter = document.getElementById('feedbackRatingFilter');
        
        if (searchInput) searchInput.value = '';
        if (statusFilter) statusFilter.value = 'all';
        if (ratingFilter) ratingFilter.value = 'all';
        
        this.renderFeedbackList();
    }

    showNotification(message, type = 'info') {
        // Use existing notification system or create simple alert
        const event = new CustomEvent('showNotification', {
            detail: { message, type }
        });
        document.dispatchEvent(event);
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Check if manager is initialized
    isInitialized() {
        return this.initialized;
    }

    // Cleanup method
    destroy() {
        if (this.adminFeedbackModalManager) {
            this.adminFeedbackModalManager.destroy();
        }
    }
}

// Export as ES6 module
export default AdminFeedbackManager;