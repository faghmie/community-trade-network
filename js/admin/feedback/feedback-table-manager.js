/**
 * FeedbackTableManager - Handles table rendering, sorting, and row interactions
 * for the feedback admin interface
 * Follows same pattern as CategoryTableManager
 */

import { sanitizeHtml } from '../../modules/utilities.js';

class FeedbackTableManager {
    constructor(dataModule) {
        this.dataModule = dataModule;
        this.feedbackDataManager = dataModule.getFeedbackDataManager();
        this.sortState = {
            field: 'timestamp',
            direction: 'desc'
        };
        this.container = null;
        this.currentFilters = {
            search: '',
            status: 'all',
            rating: 'all'
        };
    }

    /**
     * Initialize the table manager with a container element
     * @param {HTMLElement} container - The DOM element to render the table in
     */
    init(container) {
        this.container = container;
        this.bindTableHeaderEvents();
        this.setupEventListeners();
        this.renderFeedbackStats();
    }

    /**
     * Render the feedback table with optional filtered data
     * @param {Array} feedback - Array of feedback objects to display
     */
    async renderTable(feedback = null) {
        if (!this.container) {
            console.error('FeedbackTableManager: No container element provided');
            return;
        }

        try {
            const feedbackToRender = feedback || await this.getSortedFeedback();

            if (feedbackToRender.length === 0) {
                this.container.innerHTML = this.generateEmptyTableState();
                return;
            }

            this.container.innerHTML = this.generateTableHTML(feedbackToRender);
            this.bindTableHeaderEvents();
        } catch (error) {
            console.error('Error rendering feedback table:', error);
            this.container.innerHTML = this.generateErrorState();
        }
    }

    /**
     * Generate the complete table HTML structure
     * @param {Array} feedback - Feedback to render
     * @returns {string} Table HTML
     */
    generateTableHTML(feedback) {
        return `
            <div class="table-container">
                <table id="feedbackTable" class="table">
                    <thead>
                        <tr>
                            <th data-sort="status" class="sortable ${this.getSortClass('status')}">
                                Status
                                ${this.getSortIndicator('status')}
                            </th>
                            <th data-sort="timestamp" class="sortable ${this.getSortClass('timestamp')}">
                                Date
                                ${this.getSortIndicator('timestamp')}
                            </th>
                            <th data-sort="positive_comments" class="sortable ${this.getSortClass('positive_comments')}">
                                Positive
                                ${this.getSortIndicator('positive_comments')}
                            </th>
                            <th data-sort="improvement_comments" class="sortable ${this.getSortClass('improvement_comments')}">
                                Improvement
                                ${this.getSortIndicator('improvement_comments')}
                            </th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${feedback.map(item => this.generateTableRow(item)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Generate a single table row for feedback
     * @param {Object} feedback - Feedback object
     * @returns {string} Table row HTML
     */
    generateTableRow(feedback) {
        const date = new Date(feedback.timestamp).toLocaleDateString();
        const statusClass = this.getStatusClass(feedback.status);
        const statusLabel = this.getStatusLabel(feedback.status);

        // Truncate text for table display
        const positivePreview = feedback.positive_comments ? 
            this.truncateText(feedback.positive_comments, 100) : '—';
        
        const improvePreview = feedback.improvement_comments ? 
            this.truncateText(feedback.improvement_comments, 80) : '—';

        return `
            <tr class="feedback-row" data-feedback-id="${feedback.id}">
                <td class="feedback-status">
                    <span class="status-badge ${statusClass}">${statusLabel}</span>
                </td>
                <td class="feedback-date">
                    ${date}
                </td>
                <td class="feedback-positive">
                    <div class="feedback-comment" title="${sanitizeHtml(feedback.positive_comments || '')}">
                        ${sanitizeHtml(positivePreview)}
                    </div>
                </td>
                <td class="feedback-improve">
                    <div class="feedback-comment" title="${sanitizeHtml(feedback.improvement_comments || '')}">
                        ${sanitizeHtml(improvePreview)}
                    </div>
                </td>
                <td class="feedback-actions">
                    <button class="btn btn-icon btn-small btn-primary view-feedback" 
                            data-feedback-id="${feedback.id}"
                            title="View Details">
                        <span class="material-icons">visibility</span>
                    </button>
                </td>
            </tr>
        `;
    }

    /**
     * Get feedback sorted according to current sort state
     * @returns {Array} Sorted feedback
     */
    async getSortedFeedback() {
        const allFeedback = await this.feedbackDataManager.getAllFeedback();
        
        if (!Array.isArray(allFeedback)) {
            console.error('getAllFeedback did not return an array:', allFeedback);
            return [];
        }

        const filteredFeedback = this.applyFiltersToFeedback(allFeedback);
        
        return filteredFeedback.sort((a, b) => {
            let aValue = a[this.sortState.field] || '';
            let bValue = b[this.sortState.field] || '';

            // Handle date sorting specially
            if (this.sortState.field === 'timestamp') {
                aValue = new Date(aValue).getTime();
                bValue = new Date(bValue).getTime();
            } else {
                aValue = String(aValue).toLowerCase();
                bValue = String(bValue).toLowerCase();
            }

            if (this.sortState.direction === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });
    }

    /**
     * Handle sort when a table header is clicked
     * @param {string} field - Field name to sort by
     * @param {Function} onSortChange - Callback when sort changes
     */
    handleSort(field, onSortChange = null) {
        if (this.sortState.field === field) {
            this.sortState.direction = this.sortState.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortState.field = field;
            this.sortState.direction = 'asc';
        }

        this.renderTable();

        if (onSortChange && typeof onSortChange === 'function') {
            onSortChange(this.sortState);
        }
    }

    /**
     * Get CSS class for sortable column header
     * @param {string} field - Field name
     * @returns {string} CSS class
     */
    getSortClass(field) {
        return this.sortState.field === field ? `sort-${this.sortState.direction}` : '';
    }

    /**
     * Get sort indicator HTML for column header
     * @param {string} field - Field name
     * @returns {string} Sort indicator HTML
     */
    getSortIndicator(field) {
        if (this.sortState.field !== field) {
            return '<span class="sort-indicator"></span>';
        }

        return this.sortState.direction === 'asc'
            ? '<span class="sort-indicator asc">↑</span>'
            : '<span class="sort-indicator desc">↓</span>';
    }

    /**
     * Bind events to table headers for sorting
     */
    bindTableHeaderEvents() {
        if (!this.container) return;

        const tableHeaders = this.container.querySelectorAll('thead th[data-sort]');
        tableHeaders.forEach(header => {
            // Remove existing listeners to prevent duplicates
            header.replaceWith(header.cloneNode(true));
        });

        // Re-query after clone
        const freshHeaders = this.container.querySelectorAll('thead th[data-sort]');
        freshHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const field = header.getAttribute('data-sort');
                this.handleSort(field);
            });
        });
    }

    /**
     * Bind action events for view buttons
     * @param {Function} onView - View button callback
     */
    bindActionEvents(onView) {
        if (!this.container) return;

        this.container.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            const feedbackId = target.getAttribute('data-feedback-id');

            if (!feedbackId) return;

            if (target.classList.contains('view-feedback') && onView) {
                onView(feedbackId);
            }
        });
    }

    /**
     * Apply filters to feedback data
     */
    applyFiltersToFeedback(feedback) {
        let filtered = [...feedback];

        if (this.currentFilters.status !== 'all') {
            filtered = filtered.filter(f => f.status === this.currentFilters.status);
        }

        if (this.currentFilters.rating !== 'all') {
            filtered = filtered.filter(f => f.rating === parseInt(this.currentFilters.rating));
        }

        if (this.currentFilters.search) {
            const searchTerm = this.currentFilters.search.toLowerCase();
            filtered = filtered.filter(f =>
                (f.positive_comments && f.positive_comments.toLowerCase().includes(searchTerm)) ||
                (f.improvement_comments && f.improvement_comments.toLowerCase().includes(searchTerm)) ||
                (f.contact_email && f.contact_email.toLowerCase().includes(searchTerm)) ||
                (f.page_context && f.page_context.toLowerCase().includes(searchTerm)) ||
                (f.feature_context && f.feature_context.toLowerCase().includes(searchTerm))
            );
        }

        return filtered;
    }

    /**
     * Setup event listeners for filters
     */
    setupEventListeners() {
        this.bindFilterEvents();
    }

    /**
     * Bind filter events
     */
    bindFilterEvents() {
        const searchInput = document.getElementById('feedbackSearch');
        const statusFilter = document.getElementById('feedbackStatusFilter');
        const ratingFilter = document.getElementById('feedbackRatingFilter');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentFilters.search = e.target.value;
                this.applyFilters();
            });
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.currentFilters.status = e.target.value;
                this.applyFilters();
            });
        }

        if (ratingFilter) {
            ratingFilter.addEventListener('change', (e) => {
                this.currentFilters.rating = e.target.value;
                this.applyFilters();
            });
        }
    }

    /**
     * Apply filters and refresh the table
     */
    async applyFilters() {
        await this.renderTable();
    }

    /**
     * Filter by status (for external calls)
     */
    async filterByStatus(status) {
        this.currentFilters.status = status;
        await this.applyFilters();
    }

    /**
     * Filter by rating (for external calls)
     */
    async filterByRating(rating) {
        this.currentFilters.rating = rating;
        await this.applyFilters();
    }

    /**
     * Filter by search term (for external calls)
     */
    async filterFeedback(searchTerm = '') {
        this.currentFilters.search = searchTerm;
        await this.applyFilters();
    }

    /**
     * Render feedback stats
     */
    async renderFeedbackStats() {
        try {
            const allFeedback = await this.feedbackDataManager.getAllFeedback();
            
            if (!Array.isArray(allFeedback)) {
                console.error('getAllFeedback did not return an array for stats:', allFeedback);
                return;
            }

            const stats = {
                total: allFeedback.length,
                new: allFeedback.filter(f => f.status === 'new').length,
                reviewed: allFeedback.filter(f => f.status === 'reviewed').length,
                actioned: allFeedback.filter(f => f.status === 'actioned').length
            };

            // Update DOM elements
            const totalEl = document.getElementById('totalFeedbackCount');
            const newEl = document.getElementById('newFeedbackCount');
            const reviewedEl = document.getElementById('reviewedFeedbackCount');
            const actionedEl = document.getElementById('actionedFeedbackCount');

            if (totalEl) totalEl.textContent = stats.total;
            if (newEl) newEl.textContent = stats.new;
            if (reviewedEl) reviewedEl.textContent = stats.reviewed;
            if (actionedEl) actionedEl.textContent = stats.actioned;
        } catch (error) {
            console.error('Error rendering feedback stats:', error);
        }
    }

    /**
     * Generate empty state HTML for when no feedback is available
     * @returns {string} Empty state HTML
     */
    generateEmptyTableState() {
        const hasActiveFilters = this.currentFilters.status !== 'all' ||
            this.currentFilters.rating !== 'all' ||
            this.currentFilters.search !== '';

        return `
            <div class="empty-state">
                <span class="material-icons empty-icon">feedback</span>
                <h3>No Feedback Found</h3>
                <p>${hasActiveFilters ? 'No feedback matches your current filters.' : 'No feedback has been submitted yet.'}</p>
                ${hasActiveFilters ? `
                    <button class="btn btn-text" onclick="this.closest('.feedback-table-manager')?.clearFilters()">
                        <span class="material-icons">refresh</span>
                        Reset Filters
                    </button>
                ` : ''}
            </div>
        `;
    }

    /**
     * Generate error state HTML
     * @returns {string} Error state HTML
     */
    generateErrorState() {
        return `
            <div class="empty-state error-state">
                <span class="material-icons empty-icon">error</span>
                <h3>Error Loading Feedback</h3>
                <p>There was a problem loading the feedback data.</p>
                <button class="btn btn-contained" onclick="location.reload()">
                    <span class="material-icons">refresh</span>
                    Try Again
                </button>
            </div>
        `;
    }

    /**
     * Refresh the table with current data
     */
    async refresh() {
        await this.renderTable();
        await this.renderFeedbackStats();
    }

    /**
     * Clear all filters
     */
    async clearFilters() {
        this.currentFilters = {
            search: '',
            status: 'all',
            rating: 'all'
        };

        const searchInput = document.getElementById('feedbackSearch');
        const statusFilter = document.getElementById('feedbackStatusFilter');
        const ratingFilter = document.getElementById('feedbackRatingFilter');

        if (searchInput) searchInput.value = '';
        if (statusFilter) statusFilter.value = 'all';
        if (ratingFilter) ratingFilter.value = 'all';

        await this.applyFilters();
    }

    /**
     * Update sort state externally
     * @param {string} field - Field to sort by
     * @param {string} direction - Sort direction ('asc' or 'desc')
     */
    setSortState(field, direction) {
        this.sortState.field = field;
        this.sortState.direction = direction;
        this.renderTable();
    }

    /**
     * Get current sort state
     * @returns {Object} Current sort state
     */
    getSortState() {
        return { ...this.sortState };
    }

    /**
     * Helper methods
     */
    getStatusClass(status) {
        switch (status) {
            case 'new': return 'status-new';
            case 'reviewed': return 'status-reviewed';
            case 'actioned': return 'status-actioned';
            default: return '';
        }
    }

    getStatusLabel(status) {
        switch (status) {
            case 'new': return 'New';
            case 'reviewed': return 'Reviewed';
            case 'actioned': return 'Actioned';
            default: return status;
        }
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
}

export default FeedbackTableManager;