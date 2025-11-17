// js/app/modalManager.js - REFACTORED
// Main modal orchestrator - combines all modal functionality

import { BaseModalManager } from './modals/baseModalManager.js';
import { ContractorModalManager } from './modals/contractorModalManager.js';
import { ReviewModalManager } from './modals/reviewModalManager.js';

export class ModalManager {
    constructor(dataModule, reviewManager, cardManager) {
        this.dataModule = dataModule;
        this.reviewManager = reviewManager;
        this.cardManager = cardManager;
        
        // Initialize specialized modal managers
        this.baseModalManager = new BaseModalManager();
        this.contractorModalManager = new ContractorModalManager(dataModule, reviewManager, cardManager, this.baseModalManager);
        this.reviewModalManager = new ReviewModalManager(dataModule, reviewManager, this.baseModalManager);
        
        this.eventHandlers = {
            onReviewRequest: null,
            onReviewSubmit: null
        };
    }

    async init(dataModule, favoritesManager) {
        this.baseModalManager.cacheElements();
        this.baseModalManager.bindEvents();
        await this.bindSpecializedEvents();
    }

    async bindSpecializedEvents() {
        // Bind contractor modal events
        this.contractorModalManager.bindContractorModalEvents((contractorId) => {
            if (this.eventHandlers.onReviewRequest) {
                this.eventHandlers.onReviewRequest(contractorId);
            }
        });

        // FIXED: Use the new onReviewSubmit method instead of bindReviewFormEvents
        this.reviewModalManager.onReviewSubmit((reviewData, contractorId) => {
            if (this.eventHandlers.onReviewSubmit) {
                // Ensure contractor ID is included in the review data
                const completeReviewData = {
                    ...reviewData,
                    contractorId: contractorId || reviewData.contractorId
                };
                this.eventHandlers.onReviewSubmit(completeReviewData);
            }
        });
    }

    // Event handler registration
    onReviewRequest(callback) {
        this.eventHandlers.onReviewRequest = callback;
    }

    onReviewSubmit(callback) {
        this.eventHandlers.onReviewSubmit = callback;
    }

    // Public API - delegate to specialized managers
    openContractorModal(contractorId) {
        this.contractorModalManager.openContractorModal(contractorId);
    }

    openReviewModal(contractorId = null) {
        this.reviewModalManager.openReviewModal(contractorId);
    }

    closeContractorModal() {
        this.baseModalManager.closeContractorModal();
    }

    closeReviewModal() {
        this.baseModalManager.closeReviewModal();
        this.reviewModalManager.resetForm();
    }

    closeAllModals() {
        this.baseModalManager.closeAllModals();
        this.reviewModalManager.resetForm();
    }

    // Utility methods for external access
    getBaseManager() {
        return this.baseModalManager;
    }

    getContractorManager() {
        return this.contractorModalManager;
    }

    getReviewManager() {
        return this.reviewModalManager;
    }

    // Compatibility methods for existing code
    showModalLoading(modalType) {
        const modalElement = this.baseModalManager.elements[modalType];
        if (modalElement) {
            this.baseModalManager.showModalLoading(modalElement);
        }
    }

    showModalError(modalType, message) {
        const modalElement = this.baseModalManager.elements[modalType];
        if (modalElement) {
            this.baseModalManager.showModalError(modalElement, message);
        }
    }
}