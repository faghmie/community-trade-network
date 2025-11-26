/**
 * Admin Recommendations Module - Main Orchestrator
 * Follows the same pattern as admin-categories.js and admin-contractors.js
 */

import { showNotification } from '../../modules/notifications.js';
import { confirmationModal } from '../../modules/confirmationModal.js';
import AdminRecommendationsTableManager from './recommendations-table-manager.js';
import AdminRecommendationModal from './recommendation-modal.js';

class AdminRecommendationsModule {
    constructor(dataModule) {
        this.dataModule = dataModule;
        this.recommendationManager = dataModule.getRecommendationDataManager();
        this.initialized = false;
        
        // Initialize sub-modules following categories/contractors pattern
        this.tableManager = new AdminRecommendationsTableManager(dataModule);
        
        // FIX: Pass 'this' reference to modal so it can call methods directly
        this.modalManager = new AdminRecommendationModal(dataModule, this);
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
            
            console.log('AdminRecommendationsModule initialized successfully');
        } catch (error) {
            console.error('Error initializing admin recommendations module:', error);
            showNotification('Error initializing recommendations module', 'error');
        }
    }

    /**
     * Initialize the table manager with container and action handlers
     */
    initializeTable() {
        const container = document.getElementById('recommendationsList');
        if (!container) {
            console.error('Recommendations table container not found');
            return;
        }

        // Initialize table manager with container
        this.tableManager.init(container);
        
        // FIX: Only pass view callback - modal handles actions directly
        this.tableManager.bindActionEvents(
            (recommendationId) => this.viewRecommendation(recommendationId)
            // Remove approve/reject/delete callbacks - modal handles these directly
        );
        
        // Render the initial table
        this.tableManager.renderTable();
    }

    setupEventListeners() {
        // Handle tab changes
        document.addEventListener('adminTabChanged', (event) => {
            if (event.detail.tab === 'recommendations') {
                this.refresh();
            }
        });

        // Handle search functionality
        const searchInput = document.getElementById('recommendationsSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.tableManager.filterRecommendations(e.target.value);
            });
        }

        // Handle filter changes
        const statusFilter = document.getElementById('recommendationsStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.tableManager.filterByStatus(e.target.value);
            });
        }
    }

    /**
     * View recommendation details
     */
    async viewRecommendation(recommendationId) {
        try {
            this.modalManager.openWithRecommendation(recommendationId);
        } catch (error) {
            console.error('Error viewing recommendation:', error);
            showNotification('Error viewing recommendation details', 'error');
        }
    }

    /**
     * Approve a recommendation - called directly by modal
     */
    async approveRecommendation(recommendationId) {
        try {
            const confirmed = await confirmationModal.show({
                title: 'Approve Recommendation',
                message: 'Are you sure you want to approve this recommendation? It will become visible to users and affect contractor trust metrics.',
                confirmText: 'Approve',
                cancelText: 'Cancel',
                type: 'success',
                icon: 'check_circle'
            });

            if (confirmed) {
                await this.recommendationManager.updateRecommendationStatus(recommendationId, 'approved');
                showNotification('Recommendation approved successfully', 'success');
                this.refresh();
                document.dispatchEvent(new CustomEvent('adminDataUpdated'));
            }
        } catch (error) {
            console.error('Error approving recommendation:', error);
            showNotification('Error approving recommendation', 'error');
        }
    }

    /**
     * Reject a recommendation - called directly by modal
     */
    async rejectRecommendation(recommendationId) {
        try {
            const confirmed = await confirmationModal.show({
                title: 'Reject Recommendation',
                message: 'Are you sure you want to reject this recommendation? It will be hidden from users.',
                confirmText: 'Reject',
                cancelText: 'Cancel',
                type: 'warning',
                icon: 'warning'
            });

            if (confirmed) {
                await this.recommendationManager.updateRecommendationStatus(recommendationId, 'rejected');
                showNotification('Recommendation rejected successfully', 'success');
                this.refresh();
                document.dispatchEvent(new CustomEvent('adminDataUpdated'));
            }
        } catch (error) {
            console.error('Error rejecting recommendation:', error);
            showNotification('Error rejecting recommendation', 'error');
        }
    }

    /**
     * Delete a recommendation - called directly by modal
     */
    async deleteRecommendation(recommendationId) {
        try {
            const confirmed = await confirmationModal.show({
                title: 'Delete Recommendation',
                message: 'Are you sure you want to delete this recommendation? This action cannot be undone.',
                confirmText: 'Delete',
                cancelText: 'Cancel',
                type: 'danger',
                icon: 'delete'
            });

            if (confirmed) {
                await this.recommendationManager.deleteRecommendation(recommendationId);
                showNotification('Recommendation deleted successfully', 'success');
                this.refresh();
                document.dispatchEvent(new CustomEvent('adminDataUpdated'));
            }
        } catch (error) {
            console.error('Error deleting recommendation:', error);
            showNotification('Error deleting recommendation', 'error');
        }
    }

    async refresh() {
        try {
            await this.tableManager.refresh();
        } catch (error) {
            console.error('Error refreshing recommendations module:', error);
            showNotification('Error refreshing recommendations', 'error');
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

export default AdminRecommendationsModule;