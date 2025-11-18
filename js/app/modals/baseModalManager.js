// js/app/modals/baseModalManager.js
// Base modal functionality - open/close, events, core operations

export class BaseModalManager {
    constructor() {
        this.elements = {};
        this.modalStates = new Map();
    }

    cacheElements() {
        console.log('BaseModalManager: Caching modal elements');
        
        this.elements = {
            reviewModal: document.getElementById('reviewModal'),
            contractorModal: document.getElementById('contractorModal'),
            // FIXED: Handle potential duplicate close buttons
            closeModal: document.getElementById('closeModal') || document.querySelector('.close-contractor-modal'),
            closeContractorModal: document.querySelector('.close-contractor-modal')
        };

        console.log('BaseModalManager: Cached elements:', {
            reviewModal: !!this.elements.reviewModal,
            contractorModal: !!this.elements.contractorModal,
            closeModal: !!this.elements.closeModal,
            closeContractorModal: !!this.elements.closeContractorModal
        });
    }

    bindEvents() {
        const { closeModal, closeContractorModal } = this.elements;
        
        console.log('BaseModalManager: Binding events', {
            closeModal: !!closeModal,
            closeContractorModal: !!closeContractorModal
        });
        
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                console.log('Close modal button clicked');
                this.closeReviewModal();
            });
        }
        
        if (closeContractorModal) {
            closeContractorModal.addEventListener('click', () => {
                console.log('Close contractor modal button clicked');
                this.closeContractorModal();
            });
        }

        // Close modals when clicking outside (Material Design backdrop)
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal') || e.target.classList.contains('material-modal')) {
                console.log('Backdrop clicked, closing modals');
                this.closeAllModals();
            }
        });

        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                console.log('ESC key pressed, closing modals');
                this.closeAllModals();
            }
        });

        console.log('BaseModalManager: Events bound successfully');
    }

    openModal(modalElement) {
        if (!modalElement) {
            console.error('BaseModalManager: Cannot open modal - element not found');
            return;
        }

        console.log('BaseModalManager: Opening modal', modalElement.id);

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

        console.log('BaseModalManager: Modal opened successfully');
    }

    closeModal(modalElement) {
        if (modalElement) {
            console.log('BaseModalManager: Closing modal', modalElement.id);
            modalElement.style.display = 'none';
            modalElement.setAttribute('aria-hidden', 'true');
            modalElement.classList.remove('modal-visible');
        } else {
            console.warn('BaseModalManager: Cannot close modal - element not found');
        }
    }

    closeReviewModal() {
        console.log('BaseModalManager: Closing review modal');
        this.closeModal(this.elements.reviewModal);
    }

    closeContractorModal() {
        console.log('BaseModalManager: Closing contractor modal');
        this.closeModal(this.elements.contractorModal);
    }

    closeAllModals() {
        console.log('BaseModalManager: Closing all modals');
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