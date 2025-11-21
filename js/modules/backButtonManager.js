/**
 * Back Button Manager for Modal Handling
 * Prevents PWA exit when back button is pressed with open modals
 */

class BackButtonManager {
    constructor() {
        this.modalStack = [];
        this.isInitialized = false;
        this.originalPopStateHandler = null;
    }

    init() {
        if (this.isInitialized) return;
        
        // Store original popstate handler if it exists
        this.originalPopStateHandler = window.onpopstate;
        
        // Add event listeners
        window.addEventListener('popstate', this.handlePopState.bind(this));
        document.addEventListener('modalOpened', this.handleModalOpened.bind(this));
        document.addEventListener('modalClosed', this.handleModalClosed.bind(this));
        
        this.isInitialized = true;
        console.log('BackButtonManager initialized');
    }

    handlePopState(event) {
        // If there are open modals, close the top one instead of navigating back
        if (this.modalStack.length > 0) {
            event.preventDefault();
            event.stopPropagation();
            
            const topModal = this.modalStack[this.modalStack.length - 1];
            this.closeTopModal(topModal);
            
            // Prevent default back navigation
            return false;
        }
        
        // If no modals are open, allow default behavior (call original handler if exists)
        if (this.originalPopStateHandler) {
            this.originalPopStateHandler.call(window, event);
        }
    }

    handleModalOpened(event) {
        const { modalId, modalElement } = event.detail;
        
        if (modalId && modalElement) {
            // FIXED: Check if modal is already in stack to prevent duplicates
            const existingModal = this.modalStack.find(modal => modal.id === modalId);
            if (existingModal) {
                console.log(`Modal ${modalId} already in stack, skipping`);
                return;
            }
            
            this.modalStack.push({
                id: modalId,
                element: modalElement,
                timestamp: Date.now()
            });
            
            // Push a state to the history stack when modal opens
            if (this.modalStack.length === 1) {
                window.history.pushState({ modalOpen: true, modalId }, '', window.location.href);
            }
            
            console.log(`Modal opened: ${modalId}, Stack size: ${this.modalStack.length}`);
        }
    }

    handleModalClosed(event) {
        const { modalId } = event.detail;
        
        // Remove the modal from stack
        this.modalStack = this.modalStack.filter(modal => modal.id !== modalId);
        
        // If this was the last modal, pop the state we added
        if (this.modalStack.length === 0) {
            if (window.history.state && window.history.state.modalOpen) {
                window.history.back();
            }
        }
        
        console.log(`Modal closed: ${modalId}, Stack size: ${this.modalStack.length}`);
    }

    closeTopModal(modalInfo) {
        if (!modalInfo || !modalInfo.element) return;
        
        // Dispatch close event to the modal
        const closeEvent = new CustomEvent('closeModal', {
            detail: { modalId: modalInfo.id, source: 'backButton' }
        });
        
        modalInfo.element.dispatchEvent(closeEvent);
        
        // Also trigger the modal's close mechanism directly
        const closeBtn = modalInfo.element.querySelector('.close');
        if (closeBtn) {
            closeBtn.click();
        } else {
            // Fallback: hide the modal
            modalInfo.element.style.display = 'none';
            modalInfo.element.classList.remove('active');
        }
    }

    // Method to manually register a modal (for modals that don't use the event system)
    registerModal(modalId, modalElement) {
        // FIXED: Don't dispatch modalOpened event here - that would cause recursion
        // Instead, directly add to stack and handle history
        const existingModal = this.modalStack.find(modal => modal.id === modalId);
        if (existingModal) {
            console.log(`Modal ${modalId} already registered, skipping`);
            return;
        }
        
        this.modalStack.push({
            id: modalId,
            element: modalElement,
            timestamp: Date.now()
        });
        
        // Push a state to the history stack when modal opens
        if (this.modalStack.length === 1) {
            window.history.pushState({ modalOpen: true, modalId }, '', window.location.href);
        }
        
        console.log(`Modal registered: ${modalId}, Stack size: ${this.modalStack.length}`);
    }

    // Method to manually unregister a modal
    unregisterModal(modalId) {
        // FIXED: Don't dispatch modalClosed event here - that would cause recursion
        // Instead, directly remove from stack and handle history
        this.modalStack = this.modalStack.filter(modal => modal.id !== modalId);
        
        // If this was the last modal, pop the state we added
        if (this.modalStack.length === 0) {
            if (window.history.state && window.history.state.modalOpen) {
                window.history.back();
            }
        }
        
        console.log(`Modal unregistered: ${modalId}, Stack size: ${this.modalStack.length}`);
    }

    // Get current stack for debugging
    getStack() {
        return [...this.modalStack];
    }

    // Cleanup method
    destroy() {
        window.removeEventListener('popstate', this.handlePopState.bind(this));
        document.removeEventListener('modalOpened', this.handleModalOpened.bind(this));
        document.removeEventListener('modalClosed', this.handleModalClosed.bind(this));
        
        window.onpopstate = this.originalPopStateHandler;
        this.modalStack = [];
        this.isInitialized = false;
    }
}

// Create singleton instance
const backButtonManager = new BackButtonManager();

export default backButtonManager;