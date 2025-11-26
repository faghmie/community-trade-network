/**
 * Admin Feedback Module - Main Orchestrator
 * Refactored to follow the same pattern as admin-recommendations.js
 */

import { showNotification } from '../../modules/notifications.js';
import { confirmationModal } from '../../modules/confirmationModal.js';
import FeedbackTableManager from './feedback-table-manager.js';
import FeedbackModal from './feedback-modal.js';

class AdminFeedbackModule {
    constructor(dataModule) {
        this.dataModule = dataModule;
        this.feedbackDataManager = dataModule.getFeedbackDataManager();
        this.initialized = false;
        
        // Initialize sub-modules following recommendations pattern
        this.tableManager = new FeedbackTableManager(dataModule);
        
        // Pass 'this' reference to modal so it can call methods directly
        this.modalManager = new FeedbackModal(dataModule, this);
    }

    async init() {
        if (this.initialized) return;
        
        try {
            // Initialize sub-modules
            await this.tableManager.init();
            await this.modalManager.init();
            
            // Initialize the table with container and action handlers
            this.initializeTable();
            this.setupEventListeners();
            this.initialized = true;
            
            console.log('AdminFeedbackModule initialized successfully');
        } catch (error) {
            console.error('Error initializing admin feedback module:', error);
            showNotification('Error initializing feedback module', 'error');
        }
    }

    /**
     * Initialize the table manager with container and action handlers
     */
    initializeTable() {
        const container = document.getElementById('feedbackList');
        if (!container) {
            console.error('Feedback table container not found');
            return;
        }

        // Initialize table manager with container
        this.tableManager.init(container);
        
        // Only pass view callback - modal handles actions directly
        this.tableManager.bindActionEvents(
            (feedbackId) => this.viewFeedback(feedbackId)
            // Remove mark reviewed/actioned/delete callbacks - modal handles these directly
        );
        
        // Render the initial table
        this.tableManager.renderTable();
    }

    setupEventListeners() {
        // Handle tab changes
        document.addEventListener('adminTabChanged', (event) => {
            if (event.detail.tab === 'feedback') {
                this.refresh();
            }
        });

        // Handle search functionality
        const searchInput = document.getElementById('feedbackSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.tableManager.filterFeedback(e.target.value);
            });
        }

        // Handle filter changes
        const statusFilter = document.getElementById('feedbackStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.tableManager.filterByStatus(e.target.value);
            });
        }

        const ratingFilter = document.getElementById('feedbackRatingFilter');
        if (ratingFilter) {
            ratingFilter.addEventListener('change', (e) => {
                this.tableManager.filterByRating(e.target.value);
            });
        }

        // Handle bulk actions
        const markAllBtn = document.getElementById('markAllReviewedBtn');
        if (markAllBtn) {
            markAllBtn.addEventListener('click', () => this.handleMarkAllReviewed());
        }

        const exportBtn = document.getElementById('exportFeedbackBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.handleExport());
        }
    }

    /**
     * View feedback details
     */
    async viewFeedback(feedbackId) {
        try {
            this.modalManager.openWithFeedback(feedbackId);
        } catch (error) {
            console.error('Error viewing feedback:', error);
            showNotification('Error viewing feedback details', 'error');
        }
    }

    /**
     * Mark feedback as reviewed - called directly by modal
     */
    async markAsReviewed(feedbackId) {
        try {
            const confirmed = await confirmationModal.show({
                title: 'Mark as Reviewed',
                message: 'Are you sure you want to mark this feedback as reviewed?',
                confirmText: 'Mark Reviewed',
                cancelText: 'Cancel',
                type: 'primary',
                icon: 'check'
            });

            if (confirmed) {
                await this.feedbackDataManager.updateFeedbackStatus(feedbackId, 'reviewed');
                showNotification('Feedback marked as reviewed', 'success');
                this.refresh();
                document.dispatchEvent(new CustomEvent('adminDataUpdated'));
            }
        } catch (error) {
            console.error('Error marking feedback as reviewed:', error);
            showNotification('Error updating feedback status', 'error');
        }
    }

    /**
     * Mark feedback as actioned - called directly by modal
     */
    async markAsActioned(feedbackId) {
        try {
            const confirmed = await confirmationModal.show({
                title: 'Mark as Actioned',
                message: 'Are you sure you want to mark this feedback as actioned?',
                confirmText: 'Mark Actioned',
                cancelText: 'Cancel',
                type: 'primary',
                icon: 'done_all'
            });

            if (confirmed) {
                await this.feedbackDataManager.updateFeedbackStatus(feedbackId, 'actioned');
                showNotification('Feedback marked as actioned', 'success');
                this.refresh();
                document.dispatchEvent(new CustomEvent('adminDataUpdated'));
            }
        } catch (error) {
            console.error('Error marking feedback as actioned:', error);
            showNotification('Error updating feedback status', 'error');
        }
    }

    /**
     * Delete feedback - called directly by modal
     */
    async deleteFeedback(feedbackId) {
        try {
            const confirmed = await confirmationModal.show({
                title: 'Delete Feedback',
                message: 'Are you sure you want to delete this feedback? This action cannot be undone.',
                confirmText: 'Delete',
                cancelText: 'Cancel',
                type: 'danger',
                icon: 'delete'
            });

            if (confirmed) {
                await this.feedbackDataManager.deleteFeedback(feedbackId);
                showNotification('Feedback deleted successfully', 'success');
                this.refresh();
                document.dispatchEvent(new CustomEvent('adminDataUpdated'));
            }
        } catch (error) {
            console.error('Error deleting feedback:', error);
            showNotification('Error deleting feedback', 'error');
        }
    }

    /**
     * Handle mark all as reviewed bulk action
     */
    async handleMarkAllReviewed() {
        try {
            const allFeedback = await this.feedbackDataManager.getAllFeedback();
            const newFeedback = allFeedback.filter(f => f.status === 'new');

            if (newFeedback.length === 0) {
                showNotification('No new feedback to mark as reviewed', 'info');
                return;
            }

            const confirmed = await confirmationModal.show({
                title: 'Mark All as Reviewed',
                message: `Are you sure you want to mark all ${newFeedback.length} new feedback items as reviewed?`,
                confirmText: 'Mark All',
                cancelText: 'Cancel',
                type: 'primary'
            });

            if (confirmed) {
                let count = 0;
                for (const feedback of newFeedback) {
                    await this.feedbackDataManager.updateFeedbackStatus(feedback.id, 'reviewed');
                    count++;
                }

                showNotification(`Marked ${count} feedback items as reviewed`, 'success');
                this.refresh();
                document.dispatchEvent(new CustomEvent('adminDataUpdated'));
            }
        } catch (error) {
            console.error('Error marking all as reviewed:', error);
            showNotification('Error updating feedback', 'error');
        }
    }

    /**
     * Handle export functionality
     */
    async handleExport() {
        try {
            const allFeedback = await this.feedbackDataManager.getAllFeedback();

            if (allFeedback.length === 0) {
                showNotification('No feedback data to export', 'info');
                return;
            }

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

            showNotification('Feedback exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting feedback:', error);
            showNotification('Error exporting feedback', 'error');
        }
    }

    async refresh() {
        try {
            await this.tableManager.refresh();
        } catch (error) {
            console.error('Error refreshing feedback module:', error);
            showNotification('Error refreshing feedback', 'error');
        }
    }

    // Only necessary public method for dashboard stats
    getStats() {
        return this.tableManager.getStats();
    }

    /**
     * Clean up resources when module is destroyed
     */
    destroy() {
        this.initialized = false;
    }
}

export default AdminFeedbackModule;