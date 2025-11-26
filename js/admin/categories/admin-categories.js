// js/admin/categories/admin-categories.js

/**
 * Admin Categories Module - Main orchestrator for category management
 * Now using extracted CategoryTableManager and CategoriesModal
 */

import { showNotification } from '../../modules/notifications.js';
import { confirmationModal } from '../../modules/confirmationModal.js';
import CategoryTableManager from './categories-table-manager.js';
import CategoriesModal from './categories-modal.js';

class AdminCategoriesModule {
    constructor(dataModule) {
        this.dataModule = dataModule;
        this.tableManager = new CategoryTableManager(dataModule);
        this.modal = new CategoriesModal(dataModule);
        this.currentSearchTerm = '';
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        try {
            this.modal.init();
            this.setupEventListeners();
            this.initializeTable();
            this.initialized = true;
        } catch (error) {
            console.error('Error initializing admin categories module:', error);
            showNotification('Error initializing categories module', 'error');
        }
    }

    /**
     * Initialize the table manager and render initial data
     */
    initializeTable() {
        const container = document.getElementById('categoriesList');
        if (!container) {
            console.error('Categories list container not found');
            return;
        }

        this.tableManager.init(container);
        this.tableManager.bindActionEvents(
            (categoryId) => this.editCategory(categoryId),
            (categoryId, categoryName) => this.deleteCategory(categoryId, categoryName)
        );
        this.tableManager.renderTable();
    }

    setupEventListeners() {
        this.bindActionEvents();
        this.bindFilterEvents();
    }

    bindActionEvents() {
        const addCategoryBtn = document.getElementById('addCategoryBtn');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', () => this.showAddCategoryForm());
        }
    }

    bindFilterEvents() {
        const categorySearch = document.getElementById('categorySearch');
        if (categorySearch) {
            categorySearch.addEventListener('input', (e) => {
                this.currentSearchTerm = e.target.value;
                this.filterCategories(this.currentSearchTerm);
            });
        }
    }

    filterCategories(searchTerm) {
        try {
            const categories = this.dataModule.getCategories();
            const filtered = categories.filter(category => {
                const searchLower = searchTerm.toLowerCase();

                // Safely check each field with fallbacks for undefined values
                const nameMatch = category.name?.toLowerCase().includes(searchLower) || false;
                const typeMatch = (category.type || '').toLowerCase().includes(searchLower);
                const subtypeMatch = (category.subtype || '').toLowerCase().includes(searchLower);
                const descriptionMatch = (category.description || '').toLowerCase().includes(searchLower);

                return nameMatch || typeMatch || subtypeMatch || descriptionMatch;
            });
            this.tableManager.renderTable(filtered);
        } catch (error) {
            console.error('Error filtering categories:', error);
            showNotification('Error filtering categories', 'error');
        }
    }

    clearSearch() {
        this.currentSearchTerm = '';
        const categorySearch = document.getElementById('categorySearch');
        if (categorySearch) categorySearch.value = '';
        this.tableManager.renderTable();
    }

    showAddCategoryForm() {
        this.modal.openWithCategory(null, (formData, error) => {
            if (error) {
                showNotification(error.message, 'error');
                return;
            }
            this.handleCategorySubmit(formData);
        });
    }

    async editCategory(categoryId) {
        try {
            this.modal.openWithCategory(categoryId, (formData, error) => {
                if (error) {
                    showNotification(error.message, 'error');
                    return;
                }
                this.handleCategorySubmit(formData);
            });
        } catch (error) {
            console.error('Error editing category:', error);
            showNotification('Error editing category', 'error');
        }
    }

    async handleCategorySubmit(formData) {
        try {
            // FIX: Use the same pattern as contractors - access categoriesModule directly
            if (formData.id) {
                // Update existing category
                await this.dataModule.categoriesModule.update(formData.id, formData);
                showNotification('Category updated successfully', 'success');
            } else {
                // Create new category
                await this.dataModule.categoriesModule.create(formData);
                showNotification('Category added successfully', 'success');
            }

            this.tableManager.renderTable();
            document.dispatchEvent(new CustomEvent('adminDataUpdated'));
        } catch (error) {
            console.error('Error saving category:', error);
            showNotification('Failed to save category: ' + error.message, 'error');
        }
    }

    async deleteCategory(categoryId, categoryName) {
        try {
            const confirmed = await confirmationModal.show({
                title: 'Delete Category',
                message: `Are you sure you want to delete "${categoryName}"?`,
                confirmText: 'Delete',
                cancelText: 'Cancel',
                type: 'danger'
            });

            if (confirmed) {
                // FIX: Use the same pattern as contractors - access categoriesModule directly
                await this.dataModule.categoriesModule.delete(categoryId);
                showNotification('Category deleted successfully', 'success');
                this.tableManager.renderTable();
                document.dispatchEvent(new CustomEvent('adminDataUpdated'));
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            showNotification('Failed to delete category: ' + error.message, 'error');
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

export default AdminCategoriesModule;