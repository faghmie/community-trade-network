/**
 * Admin Contractors Module - Main orchestrator for contractor management
 * Following the same pattern as admin-categories.js
 */

import { showNotification } from '../../modules/notifications.js';
import { confirmationModal } from '../../modules/confirmationModal.js'; // Fixed import
import ContractorsTableManager from './contractors-table-manager.js';
import ContractorModal from './contractor-modal.js';

class AdminContractorsModule {
    constructor(dataModule, categoriesModule, locationData) {
        this.dataModule = dataModule;
        this.categoriesModule = categoriesModule;
        this.locationData = locationData;
        this.tableManager = new ContractorsTableManager(dataModule);
        this.modal = new ContractorModal(dataModule.contractorManager, categoriesModule, locationData);
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        try {
            this.modal.init();
            this.setupSearch();
            this.setupAddButton();
            this.initializeTable();
            this.initialized = true;
        } catch (error) {
            console.error('Error initializing admin contractors module:', error);
            showNotification('Error initializing contractors module', 'error');
        }
    }

    /**
     * Initialize the table manager and render initial data
     */
    initializeTable() {
        const container = document.getElementById('contractorsTableBody');
        if (!container) {
            console.error('Contractors table body not found');
            return;
        }

        this.tableManager.init(container);
        this.tableManager.bindActionEvents(
            (contractorId) => this.editContractor(contractorId),
            (contractorId) => this.deleteContractor(contractorId)
        );
        this.tableManager.renderTable();
    }

    /**
     * Set up search functionality
     */
    setupSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.tableManager.filterContractors(e.target.value);
            });
        }
    }

    /**
     * Set up add contractor button
     */
    setupAddButton() {
        const addContractorBtn = document.getElementById('addContractorBtn');
        if (addContractorBtn) {
            addContractorBtn.addEventListener('click', () => {
                this.showAddContractorForm();
            });
        } else {
            console.error('Add contractor button not found');
        }
    }

    showAddContractorForm() {
        this.modal.openForCreate((contractorData, error) => {
            if (error) {
                showNotification(error.message, 'error');
                return;
            }
            this.handleContractorSubmit(contractorData);
        });
    }

    async editContractor(contractorId) {
        try {
            const contractor = this.dataModule.getContractor(contractorId);
            if (contractor) {
                this.modal.openForEdit(contractor, (contractorData, error) => {
                    if (error) {
                        showNotification(error.message, 'error');
                        return;
                    }
                    this.handleContractorSubmit(contractorData);
                });
            } else {
                showNotification('Contractor not found', 'error');
            }
        } catch (error) {
            console.error('Error editing contractor:', error);
            showNotification('Error editing contractor', 'error');
        }
    }

    async deleteContractor(contractorId) {
        try {
            const contractor = this.dataModule.getContractor(contractorId);
            if (!contractor) {
                showNotification('Contractor not found', 'error');
                return;
            }

            const confirmed = await confirmationModal.show({
                title: 'Delete Contractor',
                message: `Are you sure you want to delete "${contractor.name}"? This action cannot be undone.`,
                confirmText: 'Delete',
                cancelText: 'Cancel',
                type: 'danger'
            });

            if (confirmed) {
                // FIX: Use the correct method name 'delete' instead of 'deleteContractor'
                await this.dataModule.contractorManager.delete(contractorId);
                showNotification('Contractor deleted successfully', 'success');
                this.tableManager.renderTable();
                document.dispatchEvent(new CustomEvent('adminDataUpdated'));
            }
        } catch (error) {
            console.error('Error deleting contractor:', error);
            showNotification('Error deleting contractor', 'error');
        }
    }

    async handleContractorSubmit(contractorData) {
        try {
            if (contractorData.id) {
                // Update existing contractor
                await this.dataModule.contractorManager.update(contractorData.id, contractorData);
                showNotification('Contractor updated successfully', 'success');
            } else {
                // Create new contractor
                await this.dataModule.contractorManager.create(contractorData);
                showNotification('Contractor added successfully', 'success');
            }

            this.tableManager.renderTable();
            document.dispatchEvent(new CustomEvent('adminDataUpdated'));
        } catch (error) {
            console.error('Error saving contractor:', error);
            showNotification('Failed to save contractor', 'error');
        }
    }

    refresh() {
        this.tableManager.renderTable();
    }

    /**
     * Clean up resources when module is destroyed
     */
    destroy() {
        this.modal.destroy();
        this.initialized = false;
    }
}

export default AdminContractorsModule;