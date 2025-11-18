// js/app/modalManager.js - SIMPLIFIED WITH DIRECT CALLBACK
import { ContractorModalManager } from './modals/contractorModalManager.js';
import { ReviewModalManager } from './modals/reviewModalManager.js';

export class ModalManager {
    constructor(dataModule, reviewManager, cardManager, onReviewSubmitCallback = null) {
        console.log('🔧 ModalManager: Constructor called');
        this.dataModule = dataModule;
        this.reviewManager = reviewManager;
        this.cardManager = cardManager;
        
        console.log('🔧 Creating modal managers...');
        
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
        
        console.log('🔧 ModalManager: ContractorModalManager created:', !!this.contractorModalManager);
        console.log('🔧 ModalManager: ReviewModalManager created:', !!this.reviewModalManager);
        
        // No longer need event handlers since we use direct callbacks
    }

    async init() {
        console.log('🔧 ModalManager: Initializing...');
        // No need to bind events anymore - using direct callbacks
        console.log('🔧 ModalManager: Initialization complete');
    }

    // Public API with fallbacks
    openContractorModal(contractorId) {
        console.log('🔧 ModalManager: Opening contractor modal for:', contractorId);
        if (this.contractorModalManager && typeof this.contractorModalManager.open === 'function') {
            this.contractorModalManager.open(contractorId);
        } else if (this.contractorModalManager && typeof this.contractorModalManager.openContractorModal === 'function') {
            this.contractorModalManager.openContractorModal(contractorId);
        } else {
            console.error('❌ No open method found on contractorModalManager');
        }
    }

    openReviewModal(contractorId = null) {
        console.log('🔧 ModalManager: Opening review modal for contractor:', contractorId);
        if (this.reviewModalManager && typeof this.reviewModalManager.open === 'function') {
            this.reviewModalManager.open(contractorId);
        } else if (this.reviewModalManager && typeof this.reviewModalManager.openReviewModal === 'function') {
            this.reviewModalManager.openReviewModal(contractorId);
        } else {
            console.error('❌ No open method found on reviewModalManager');
        }
    }

    closeContractorModal() {
        console.log('🔧 ModalManager: Closing contractor modal');
        if (this.contractorModalManager && typeof this.contractorModalManager.close === 'function') {
            this.contractorModalManager.close();
        } else if (this.contractorModalManager && typeof this.contractorModalManager.closeContractorModal === 'function') {
            this.contractorModalManager.closeContractorModal();
        }
    }

    closeReviewModal() {
        console.log('🔧 ModalManager: Closing review modal');
        if (this.reviewModalManager && typeof this.reviewModalManager.close === 'function') {
            this.reviewModalManager.close();
        } else if (this.reviewModalManager && typeof this.reviewModalManager.closeReviewModal === 'function') {
            this.reviewModalManager.closeReviewModal();
        } else if (this.reviewModalManager && typeof this.reviewModalManager.resetForm === 'function') {
            this.reviewModalManager.resetForm();
        }
    }

    closeAllModals() {
        console.log('🔧 ModalManager: Closing all modals');
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
        console.log('🔧 ModalManager: Cleaning up');
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