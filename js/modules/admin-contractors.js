// Admin Contractors Management - REFACTORED with ContractorEditModalManager
import { showNotification } from './notifications.js';
import { ContractorModalManager } from '../app/modals/contractorModalManager.js';
import ContractorEditModalManager from '../app/modals/contractorEditModalManager.js';

class AdminContractorsModule {
    constructor(dataModule, categoriesModule, locationData) {
        this.dataModule = dataModule;
        this.categoriesModule = categoriesModule;
        this.locationData = locationData;
        this.contractorModalManager = null;
        this.contractorEditModalManager = null;
        this.modalEventListeners = [];

        // Bind methods
        this.init = this.init.bind(this);
        this.bindEvents = this.bindEvents.bind(this);
        this.renderContractorsTable = this.renderContractorsTable.bind(this);
        this.showContractorForm = this.showContractorForm.bind(this);
        this.viewContractor = this.viewContractor.bind(this);
        this.editContractor = this.editContractor.bind(this);
        this.deleteContractor = this.deleteContractor.bind(this);
        this.filterContractors = this.filterContractors.bind(this);
        this.removeEventListeners = this.removeEventListeners.bind(this);
        this.bindTableActionEvents = this.bindTableActionEvents.bind(this);
    }

    async init() {
        console.log('🔧 AdminContractorsModule: Initializing...');
        
        this.bindEvents();
        this.renderContractorsTable();

        // Initialize modal managers
        this.contractorModalManager = new ContractorModalManager(
            this.dataModule,
            this.dataModule.reviewManager,
            this.dataModule.cardManager,
            null // No review modal manager in admin context
        );

        this.contractorEditModalManager = new ContractorEditModalManager(
            this.dataModule.contractorManager,
            this.categoriesModule,
            this.locationData
        );
        this.contractorEditModalManager.init();

        // Listen for contractor updates
        document.addEventListener('contractorsUpdated', () => {
            this.renderContractorsTable();
            if (window.adminModule) {
                adminModule.renderStats();
            }
        });

        console.log('✅ AdminContractorsModule: Initialized successfully');
    }

    bindEvents() {
        console.log('🔧 AdminContractorsModule: Binding events...');

        // Remove any existing event listeners to prevent duplicates
        this.removeEventListeners();

        // Add contractor button
        const addContractorBtn = document.getElementById('addContractorBtn');
        if (addContractorBtn) {
            const handler = () => {
                console.log('🔧 AdminContractorsModule: Add contractor button clicked');
                this.showContractorForm();
            };
            addContractorBtn.addEventListener('click', handler);
            this.modalEventListeners.push({ element: addContractorBtn, event: 'click', handler });
        }

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            const handler = (e) => {
                this.filterContractors(e.target.value);
            };
            searchInput.addEventListener('input', handler);
            this.modalEventListeners.push({ element: searchInput, event: 'input', handler });
        }

        // Bind table action events
        this.bindTableActionEvents();

        console.log('✅ AdminContractorsModule: Events bound successfully');
    }

    removeEventListeners() {
        console.log('🔧 AdminContractorsModule: Removing existing event listeners');
        this.modalEventListeners.forEach(({ element, event, handler, observer }) => {
            if (observer) {
                observer.disconnect();
            } else if (element && handler) {
                element.removeEventListener(event, handler);
            }
        });
        this.modalEventListeners = [];
    }

    renderContractorsTable(filteredContractors = null) {
        const contractors = filteredContractors || this.dataModule.getContractors();
        const tbody = document.getElementById('contractorsTableBody');

        if (!tbody) {
            console.error('❌ AdminContractorsModule: Contractors table body not found');
            return;
        }

        if (!contractors || contractors.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-xl">
                        <div class="empty-state">
                            <span class="material-icons">business_center</span>
                            <p>No contractors found</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = contractors.map(contractor => {
            const reviews = this.dataModule.getReviewsForContractor(contractor.id);
            const reviewCount = reviews.length;
            const rating = contractor.rating || 0;

            return `
            <tr>
                <td>${contractor.name}</td>
                <td>${contractor.category}</td>
                <td>
                    <span class="rating-stars">${'⭐'.repeat(Math.floor(rating))}</span>
                    <small class="text-secondary">(${rating})</small>
                </td>
                <td>${reviewCount}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-icon btn-small btn-secondary view-contractor" data-id="${contractor.id}" title="View Details">
                            <span class="material-icons">visibility</span>
                        </button>
                        <button class="btn btn-icon btn-small btn-primary edit-contractor" data-id="${contractor.id}" title="Edit Service Provider">
                            <span class="material-icons">edit</span>
                        </button>
                        <button class="btn btn-icon btn-small btn-danger delete-contractor" data-id="${contractor.id}" title="Delete Service Provider">
                            <span class="material-icons">delete</span>
                        </button>
                    </div>
                </td>
            </tr>
        `}).join('');

        // Re-bind table action events after rendering
        this.bindTableActionEvents();
    }

    /**
     * Bind event listeners to table action buttons
     */
    bindTableActionEvents() {
        // Remove existing table event listeners first
        const tableListeners = this.modalEventListeners.filter(listener => 
            listener.element?.classList?.contains('view-contractor') ||
            listener.element?.classList?.contains('edit-contractor') || 
            listener.element?.classList?.contains('delete-contractor')
        );
        
        tableListeners.forEach(({ element, event, handler }) => {
            if (element && handler) {
                element.removeEventListener(event, handler);
            }
        });

        // Filter out the table listeners from main array
        this.modalEventListeners = this.modalEventListeners.filter(listener => 
            !tableListeners.includes(listener)
        );

        // View contractor buttons
        const viewButtons = document.querySelectorAll('.view-contractor');
        viewButtons.forEach(button => {
            const handler = () => {
                const contractorId = button.getAttribute('data-id');
                this.viewContractor(contractorId);
            };
            button.addEventListener('click', handler);
            this.modalEventListeners.push({ element: button, event: 'click', handler });
        });

        // Edit contractor buttons
        const editButtons = document.querySelectorAll('.edit-contractor');
        editButtons.forEach(button => {
            const handler = () => {
                const contractorId = button.getAttribute('data-id');
                this.editContractor(contractorId);
            };
            button.addEventListener('click', handler);
            this.modalEventListeners.push({ element: button, event: 'click', handler });
        });

        // Delete contractor buttons
        const deleteButtons = document.querySelectorAll('.delete-contractor');
        deleteButtons.forEach(button => {
            const handler = () => {
                const contractorId = button.getAttribute('data-id');
                this.deleteContractor(contractorId);
            };
            button.addEventListener('click', handler);
            this.modalEventListeners.push({ element: button, event: 'click', handler });
        });
    }

    showContractorForm(contractor = null) {
        console.log('🔧 AdminContractorsModule: Opening contractor form');
        this.contractorEditModalManager.open(contractor);
    }

    viewContractor(id) {
        console.log('🔧 AdminContractorsModule: View contractor called with ID:', id);
        if (this.contractorModalManager) {
            this.contractorModalManager.open(id);
        } else {
            console.error('🔧 AdminContractorsModule: ContractorModalManager not initialized');
            showNotification('Failed to view contractor details', 'error');
        }
    }

    editContractor(id) {
        console.log('🔧 AdminContractorsModule: Edit contractor called with ID:', id);
        const contractor = this.dataModule.getContractor(id);
        if (contractor) {
            this.showContractorForm(contractor);
        } else {
            console.error('🔧 AdminContractorsModule: Contractor not found with ID:', id);
            showNotification('Contractor not found', 'error');
        }
    }

    deleteContractor(id) {
        console.log('🔧 AdminContractorsModule: Delete contractor called with ID:', id);
        
        if (confirm('Are you sure you want to delete this contractor? This action cannot be undone.')) {
            try {
                this.dataModule.deleteContractor(id);
                this.renderContractorsTable();
                showNotification('Service Provider deleted successfully', 'success');

                // Update stats in main admin module
                if (window.adminModule) {
                    adminModule.renderStats();
                }

                // Dispatch event for other components
                document.dispatchEvent(new CustomEvent('contractorsUpdated', {
                    detail: { action: 'deleted', contractorId: id }
                }));

            } catch (error) {
                console.error('🔧 AdminContractorsModule: Error deleting contractor:', error);
                showNotification('Failed to delete contractor', 'error');
            }
        }
    }

    filterContractors(searchTerm) {
        console.log('🔧 AdminContractorsModule: Filtering contractors with term:', searchTerm);
        const contractors = this.dataModule.getContractors();
        const filtered = contractors.filter(contractor =>
            contractor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contractor.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contractor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contractor.location.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderContractorsTable(filtered);
    }

    // Cleanup method
    destroy() {
        this.removeEventListeners();
        if (this.contractorEditModalManager) {
            this.contractorEditModalManager.destroy();
        }
    }
}

export default AdminContractorsModule;