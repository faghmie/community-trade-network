// js/app/modals/baseModalManager.js
// Base modal functionality - open/close, events, core operations

export class BaseModalManager {
    constructor() {
        this.elements = {};
        this.modalStates = new Map();
    }

    cacheElements() {
        this.elements = {
            reviewModal: document.getElementById('reviewModal'),
            contractorModal: document.getElementById('contractorModal'),
            closeModal: document.getElementById('closeModal'),
            closeContractorModal: document.querySelector('.close-contractor-modal')
        };
    }

    bindEvents() {
        const { closeModal, closeContractorModal } = this.elements;
        
        if (closeModal) {
            closeModal.addEventListener('click', () => this.closeReviewModal());
        }
        
        if (closeContractorModal) {
            closeContractorModal.addEventListener('click', () => this.closeContractorModal());
        }

        // Close modals when clicking outside (Material Design backdrop)
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal') || e.target.classList.contains('material-modal')) {
                this.closeAllModals();
            }
        });

        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    openModal(modalElement) {
        if (!modalElement) return;

        // Close other modals first
        this.closeAllModals();
        
        modalElement.style.display = 'flex';
        modalElement.setAttribute('aria-hidden', 'false');
        
        // Add animation class
        setTimeout(() => {
            modalElement.classList.add('modal-visible');
        }, 10);

        // Focus first input for accessibility
        const firstInput = modalElement.querySelector('input, textarea, select');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }

    closeModal(modalElement) {
        if (modalElement) {
            modalElement.style.display = 'none';
            modalElement.setAttribute('aria-hidden', 'true');
            modalElement.classList.remove('modal-visible');
        }
    }

    closeReviewModal() {
        this.closeModal(this.elements.reviewModal);
    }

    closeContractorModal() {
        this.closeModal(this.elements.contractorModal);
    }

    closeAllModals() {
        this.closeContractorModal();
        this.closeReviewModal();
    }

    showModalLoading(modalElement) {
        if (modalElement) {
            const content = modalElement.querySelector('.modal-body') || modalElement;
            content.innerHTML = `
                <div class="modal-loading">
                    <div class="loading-spinner"></div>
                    <p>Loading...</p>
                </div>
            `;
        }
    }

    showModalError(modalElement, message) {
        if (modalElement) {
            const content = modalElement.querySelector('.modal-body') || modalElement;
            content.innerHTML = `
                <div class="modal-error">
                    <i class="material-icons">error</i>
                    <h3>Error</h3>
                    <p>${message}</p>
                    <button class="btn btn-secondary" onclick="this.closeModal(modalElement)">
                        <i class="material-icons">close</i>
                        <span>Close</span>
                    </button>
                </div>
            `;
        }
    }

    // Store and retrieve modal state
    setModalState(modalId, state) {
        this.modalStates.set(modalId, state);
    }

    getModalState(modalId) {
        return this.modalStates.get(modalId);
    }

    clearModalState(modalId) {
        this.modalStates.delete(modalId);
    }
}