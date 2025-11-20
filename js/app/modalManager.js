// js/app/modalManager.js - SIMPLIFIED WITH DIRECT CALLBACK
import { ContractorModalManager } from './modals/contractorModalManager.js';
import { ReviewModalManager } from './modals/reviewModalManager.js';

export class ModalManager {
    constructor(dataModule, reviewManager, cardManager, onReviewSubmitCallback = null) {
        this.dataModule = dataModule;
        this.reviewManager = reviewManager;
        this.cardManager = cardManager;
        
        // Create review modal with direct callback to main app
        this.reviewModalManager = new ReviewModalManager(
            dataModule, 
            reviewManager,
            onReviewSubmitCallback // Pass direct callback from main app
        );
        
        // Pass reviewModalManager reference to contractorModalManager
        this.contractorModalManager = new ContractorModalManager(
            dataModule, 
            reviewManager, 
            cardManager,
            this.reviewModalManager // Pass the reference for direct communication
        );
        
        // No longer need event handlers since we use direct callbacks
    }

    async init() {
        // No need to bind events anymore - using direct callbacks
    }

    // Public API with fallbacks
    openContractorModal(contractorId) {
        if (this.contractorModalManager && typeof this.contractorModalManager.open === 'function') {
            this.contractorModalManager.open(contractorId);
        } else if (this.contractorModalManager && typeof this.contractorModalManager.openContractorModal === 'function') {
            this.contractorModalManager.openContractorModal(contractorId);
        } else {
            console.error('No open method found on contractorModalManager');
        }
    }

    openReviewModal(contractorId = null) {
        if (this.reviewModalManager && typeof this.reviewModalManager.open === 'function') {
            this.reviewModalManager.open(contractorId);
        } else if (this.reviewModalManager && typeof this.reviewModalManager.openReviewModal === 'function') {
            this.reviewModalManager.openReviewModal(contractorId);
        } else {
            console.error('No open method found on reviewModalManager');
        }
    }

    closeContractorModal() {
        if (this.contractorModalManager && typeof this.contractorModalManager.close === 'function') {
            this.contractorModalManager.close();
        } else if (this.contractorModalManager && typeof this.contractorModalManager.closeContractorModal === 'function') {
            this.contractorModalManager.closeContractorModal();
        }
    }

    closeReviewModal() {
        if (this.reviewModalManager && typeof this.reviewModalManager.close === 'function') {
            this.reviewModalManager.close();
        } else if (this.reviewModalManager && typeof this.reviewModalManager.closeReviewModal === 'function') {
            this.reviewModalManager.closeReviewModal();
        } else if (this.reviewModalManager && typeof this.reviewModalManager.resetForm === 'function') {
            this.reviewModalManager.resetForm();
        }
    }

    closeAllModals() {
        this.closeContractorModal();
        this.closeReviewModal();
    }

    // Utility methods for external access
    getContractorManager() {
        return this.contractorModalManager;
    }

    getReviewManager() {
        return this.reviewModalManager;
    }

    // Cleanup method
    destroy() {
        if (this.contractorModalManager && typeof this.contractorModalManager.destroy === 'function') {
            this.contractorModalManager.destroy();
        }
        if (this.reviewModalManager && typeof this.reviewModalManager.destroy === 'function') {
            this.reviewModalManager.destroy();
        }
    }

    // Compatibility methods
    showModalLoading(modalType) {
        console.warn('showModalLoading may not be supported with independent modals');
    }

    showModalError(modalType, message) {
        console.warn('showModalError may not be supported with independent modals');
    }
}