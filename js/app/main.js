// js/app/main.js
class ContractorReviewApp {
    constructor(uiManager, modalManager, filterManager, formManager) {
        this.uiManager = uiManager;
        this.modalManager = modalManager;
        this.filterManager = filterManager;
        this.formManager = formManager;
        
        this.currentContractor = null;
        this.filteredContractors = [];
    }

    async init() {
        try {
            // Initialize data first
            dataModule.init();
            
            // Initialize all managers
            await this.uiManager.init();
            await this.modalManager.init();
            await this.filterManager.init();
            await this.formManager.init();
            
            // Set up cross-manager communication
            this.setupManagers();
            
            // Render initial state
            this.renderDashboard();
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    }

    setupManagers() {
        // When filters change, update UI
        this.filterManager.onFiltersChange((filters) => {
            this.filteredContractors = this.filterManager.applyFilters(filters);
            this.uiManager.renderContractors(this.filteredContractors);
            this.uiManager.updateStats(this.filteredContractors);
        });

        // When modal actions occur
        this.modalManager.onReviewRequest((contractorId) => {
            this.currentContractor = contractorId;
            this.modalManager.openReviewModal();
        });

        // When form is submitted
        this.formManager.onReviewSubmit((reviewData) => {
            this.handleReviewSubmit(reviewData);
        });
    }

    renderDashboard() {
        this.uiManager.refreshFilters();
        this.uiManager.renderStats();
        this.uiManager.renderContractors();
    }

    handleReviewSubmit(reviewData) {
        const review = dataModule.addReview(this.currentContractor, reviewData);
        if (review) {
            this.modalManager.closeReviewModal();
            this.renderDashboard();
        }
    }

    // Public API for HTML onclick handlers
    showContractorDetails(contractorId) {
        this.modalManager.openContractorModal(contractorId);
    }

    showReviewForm(contractorId) {
        this.modalManager.openReviewModal(contractorId);
    }

    searchContractors() {
        this.filterManager.applyCurrentFilters();
    }

    filterContractors() {
        this.filterManager.applyCurrentFilters();
    }

    sortContractors() {
        const sortedContractors = this.filterManager.applySorting();
        this.uiManager.renderContractors(sortedContractors);
    }

    // ADD THESE MISSING METHODS FOR HTML COMPATIBILITY
    closeModal(modalId) {
        if (modalId === 'reviewModal') {
            this.modalManager.closeReviewModal();
        } else if (modalId === 'contractorModal') {
            this.modalManager.closeContractorModal();
        }
    }

    setRating(rating) {
        this.formManager.setRating(rating);
    }
}