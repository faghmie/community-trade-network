// Admin Categories Management - UPDATED WITH CONSISTENT STATISTICS
import { showNotification } from './notifications.js';

class AdminCategoriesModule {
    constructor(dataModule) {
        this.dataModule = dataModule;
        this.categoryFormModal = null;
        this.modalEventListeners = [];
    }

    init() {
        this.createCategoryFormModal();
        this.bindEvents();
        this.renderCategories();
    }

    createCategoryFormModal() {
        // Check if modal already exists
        if (this.categoryFormModal) {
            console.log('🔧 AdminCategoriesModule: Modal already exists');
            return;
        }

        console.log('🔧 AdminCategoriesModule: Creating category form modal...');

        const modalHTML = `
            <div class="modal" id="categoryFormModal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 id="formCategoryTitle">Add Category</h2>
                        <button type="button" class="close" id="closeCategoryFormModal" aria-label="Close dialog">
                            <span class="material-icons">close</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="categoryForm" class="material-form" onsubmit="return false;">
                            <input type="hidden" id="categoryId">
                            
                            <div class="material-form-group">
                                <label for="categoryName" class="material-input-label">Category Name</label>
                                <input type="text" id="categoryName" name="name" class="material-input" required>
                                <div class="material-input-helper">Enter a unique category name</div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="material-button text-button" id="cancelCategoryForm">Cancel</button>
                        <button type="button" class="material-button contained" id="saveCategoryBtn">Save Category</button>
                    </div>
                </div>
            </div>
        `;

        try {
            // Insert modal HTML into the DOM
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // Get reference to the modal
            this.categoryFormModal = document.getElementById('categoryFormModal');
            
            if (!this.categoryFormModal) {
                console.error('❌ AdminCategoriesModule: Failed to create modal - element not found after insertion');
                return;
            }
            
            console.log('✅ AdminCategoriesModule: Category form modal created successfully');
            
        } catch (error) {
            console.error('❌ AdminCategoriesModule: Error creating modal:', error);
        }
    }

    bindEvents() {
        console.log('🔧 AdminCategoriesModule: Binding events...');
        
        // Remove any existing event listeners to prevent duplicates
        this.removeEventListeners();
        
        // Category form - bind to dynamically created elements
        const addCategoryBtn = document.getElementById('addCategoryBtn');
        if (addCategoryBtn) {
            const handler = () => {
                console.log('🔧 AdminCategoriesModule: Add category button clicked');
                this.showAddCategoryForm();
            };
            addCategoryBtn.addEventListener('click', handler);
            this.modalEventListeners.push({ element: addCategoryBtn, event: 'click', handler });
        }

        // Use event delegation for dynamically created save button
        const saveButtonHandler = (e) => {
            if (e.target.id === 'saveCategoryBtn' || e.target.closest('#saveCategoryBtn')) {
                console.log('🔧 AdminCategoriesModule: Save category button clicked');
                e.preventDefault();
                e.stopImmediatePropagation();
                this.handleCategorySubmit();
            }
        };
        document.addEventListener('click', saveButtonHandler, true);
        this.modalEventListeners.push({ element: document, event: 'click', handler: saveButtonHandler });

        // Search functionality
        const categorySearch = document.getElementById('categorySearch');
        if (categorySearch) {
            const handler = (e) => {
                this.filterCategories(e.target.value);
            };
            categorySearch.addEventListener('input', handler);
            this.modalEventListeners.push({ element: categorySearch, event: 'input', handler });
        }

        // Direct event listeners for modal close buttons
        const closeButtonHandler = (e) => {
            console.log('🔧 AdminCategoriesModule: Close button clicked');
            e.preventDefault();
            e.stopImmediatePropagation();
            this.closeModal('categoryFormModal');
        };

        const cancelButtonHandler = (e) => {
            console.log('🔧 AdminCategoriesModule: Cancel button clicked');
            e.preventDefault();
            e.stopImmediatePropagation();
            this.closeModal('categoryFormModal');
        };

        // Bind close buttons after a short delay to ensure DOM is ready
        setTimeout(() => {
            const closeBtn = document.getElementById('closeCategoryFormModal');
            const cancelBtn = document.getElementById('cancelCategoryForm');
            
            if (closeBtn && !closeBtn.hasListener) {
                closeBtn.addEventListener('click', closeButtonHandler, true);
                closeBtn.hasListener = true;
                this.modalEventListeners.push({ element: closeBtn, event: 'click', handler: closeButtonHandler });
            }
            
            if (cancelBtn && !cancelBtn.hasListener) {
                cancelBtn.addEventListener('click', cancelButtonHandler, true);
                cancelBtn.hasListener = true;
                this.modalEventListeners.push({ element: cancelBtn, event: 'click', handler: cancelButtonHandler });
            }
        }, 100);

        // Close modal when clicking on backdrop
        const backdropHandler = (e) => {
            if (e.target === this.categoryFormModal) {
                console.log('🔧 AdminCategoriesModule: Backdrop clicked');
                e.preventDefault();
                e.stopImmediatePropagation();
                this.closeModal('categoryFormModal');
            }
        };
        document.addEventListener('click', backdropHandler, true);
        this.modalEventListeners.push({ element: document, event: 'click', handler: backdropHandler });

        // Escape key to close modal
        const escapeHandler = (e) => {
            if (e.key === 'Escape' && this.categoryFormModal?.style.display === 'flex') {
                console.log('🔧 AdminCategoriesModule: Escape key pressed');
                e.preventDefault();
                e.stopImmediatePropagation();
                this.closeModal('categoryFormModal');
            }
        };
        document.addEventListener('keydown', escapeHandler, true);
        this.modalEventListeners.push({ element: document, event: 'keydown', handler: escapeHandler });

        // Prevent form submission
        const formSubmitHandler = (e) => {
            if (e.target.id === 'categoryForm') {
                console.log('🔧 AdminCategoriesModule: Form submission prevented');
                e.preventDefault();
                e.stopImmediatePropagation();
                return false;
            }
        };
        document.addEventListener('submit', formSubmitHandler, true);
        this.modalEventListeners.push({ element: document, event: 'submit', handler: formSubmitHandler });

        console.log('✅ AdminCategoriesModule: Events bound successfully');
    }

    removeEventListeners() {
        console.log('🔧 AdminCategoriesModule: Removing existing event listeners');
        this.modalEventListeners.forEach(({ element, event, handler }) => {
            if (element && handler) {
                element.removeEventListener(event, handler);
            }
        });
        this.modalEventListeners = [];
    }

    renderCategories() {
        this.renderCategoriesList();
        this.renderCategoryStats();
    }

    renderCategoriesList(filteredCategories = null) {
        const categories = filteredCategories || this.dataModule.getCategories();
        const container = document.getElementById('categoriesList');
        
        if (!container) return;

        // Use DataModule methods for consistent statistics calculation
        const categoryStats = this.calculateCategoryStats(categories);
        
        container.innerHTML = categories.map(category => {
            const stats = categoryStats[category.name] || { count: 0, totalReviews: 0, averageRating: '0.0' };
            
            return `
                <div class="category-item">
                    <div class="category-info">
                        <h4>${category.name}</h4>
                        <div class="category-stats">
                            <span class="stat">${stats.count} contractors</span>
                            <span class="stat">${stats.totalReviews} reviews</span>
                            <span class="stat">${stats.averageRating} ⭐ rating</span>
                        </div>
                    </div>
                    <div class="category-actions">
                        <button class="btn btn-small btn-primary" onclick="adminModule.editCategory('${category.name}')">
                            Edit
                        </button>
                        <button class="btn btn-small btn-danger" 
                                onclick="adminModule.deleteCategory('${category.name}')"
                                ${stats.count > 0 ? 'disabled title="Cannot delete category with contractors"' : ''}>
                            Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // FIXED: Use DataModule methods for consistent statistics
    calculateCategoryStats(categories) {
        const stats = {};
        const contractors = this.dataModule.getContractors();
        
        categories.forEach(category => {
            const categoryContractors = contractors.filter(c => c.category === category.name);
            
            // Calculate total approved reviews using DataModule methods
            let totalApprovedReviews = 0;
            let totalRating = 0;
            let contractorsWithRatings = 0;
            
            categoryContractors.forEach(contractor => {
                // Use DataModule to get approved reviews for this contractor
                const approvedReviews = this.dataModule.getReviewsForContractor(contractor.id)
                    .filter(review => review.status === 'approved');
                
                totalApprovedReviews += approvedReviews.length;
                
                // Use the contractor's overall rating (which only includes approved reviews)
                if (contractor.overallRating && contractor.overallRating > 0) {
                    totalRating += parseFloat(contractor.overallRating);
                    contractorsWithRatings++;
                }
            });
            
            // Calculate average rating (only for contractors with ratings)
            const averageRating = contractorsWithRatings > 0 
                ? parseFloat((totalRating / contractorsWithRatings).toFixed(1))
                : 0;
            
            stats[category.name] = {
                count: categoryContractors.length,
                totalReviews: totalApprovedReviews,
                averageRating: averageRating
            };
        });
        
        return stats;
    }

    renderCategoryStats() {
        const categories = this.dataModule.getCategories();
        const contractors = this.dataModule.getContractors();
        
        const totalCategories = categories.length;
        const totalContractors = categories.reduce((sum, category) => {
            return sum + contractors.filter(c => c.category === category.name).length;
        }, 0);
        
        const totalCategoriesEl = document.getElementById('totalCategoriesCount');
        const totalContractorsEl = document.getElementById('totalCategorizedContractors');
        
        if (totalCategoriesEl) totalCategoriesEl.textContent = totalCategories;
        if (totalContractorsEl) totalContractorsEl.textContent = totalContractors;
    }

    showAddCategoryForm(categoryName = null) {
        console.log('🔧 AdminCategoriesModule: showAddCategoryForm called');
        
        // Ensure modal is created
        this.createCategoryFormModal();
        
        if (!this.categoryFormModal) {
            console.error('❌ AdminCategoriesModule: Category form modal not available even after creation attempt');
            showNotification('Failed to open category form. Please refresh the page.', 'error');
            return;
        }

        console.log('✅ AdminCategoriesModule: Modal is available, populating form...');

        if (categoryName) {
            // Edit mode
            document.getElementById('categoryId').value = categoryName;
            document.getElementById('categoryName').value = categoryName;
            document.getElementById('formCategoryTitle').textContent = 'Edit Category';
        } else {
            // Add mode
            const form = document.getElementById('categoryForm');
            if (form) form.reset();
            document.getElementById('categoryId').value = '';
            document.getElementById('formCategoryTitle').textContent = 'Add Category';
        }

        // Show the modal
        console.log('🔧 AdminCategoriesModule: Setting modal display to flex');
        this.categoryFormModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Focus on input for better UX
        setTimeout(() => {
            document.getElementById('categoryName')?.focus();
        }, 100);

        console.log('✅ AdminCategoriesModule: Category form displayed successfully');
    }

    handleCategorySubmit() {
        console.log('🔧 AdminCategoriesModule: handleCategorySubmit called');
        
        const categoryNameInput = document.getElementById('categoryName');
        const existingCategoryInput = document.getElementById('categoryId');
        
        if (!categoryNameInput) return;

        const categoryName = categoryNameInput.value.trim();
        const existingCategory = existingCategoryInput.value;

        if (!categoryName) {
            showNotification('Category name cannot be empty!', 'error');
            return;
        }

        // Check if category already exists (for new categories)
        if (!existingCategory) {
            const existingCategories = this.dataModule.getCategories();
            const categoryExists = existingCategories.some(cat => 
                cat.name.toLowerCase() === categoryName.toLowerCase()
            );
            
            if (categoryExists) {
                showNotification(`Category "${categoryName}" already exists!`, 'error');
                return;
            }
        }

        try {
            if (existingCategory) {
                // Update existing category
                this.dataModule.updateCategory(existingCategory, categoryName);
                showNotification('Category updated successfully', 'success');
            } else {
                // Add new category
                this.dataModule.addCategory(categoryName);
                showNotification('Category added successfully', 'success');
            }

            this.closeModal('categoryFormModal');
            this.renderCategories();
            
            // Update dashboard stats
            if (window.adminModule) {
                adminModule.renderStats();
            }
        } catch (error) {
            console.error('Error saving category:', error);
            showNotification('Failed to save category. Please try again.', 'error');
        }
    }

    editCategory(categoryName) {
        this.showAddCategoryForm(categoryName);
    }

    deleteCategory(categoryName) {
        // Check if any contractors are using this category
        const contractorsUsingCategory = this.dataModule.getContractors().filter(
            contractor => contractor.category === categoryName
        );

        if (contractorsUsingCategory.length > 0) {
            showNotification(`Cannot delete category "${categoryName}". ${contractorsUsingCategory.length} contractor(s) are using it. Please reassign or delete those contractors first.`, 'error');
            return false;
        }

        if (confirm(`Are you sure you want to delete the category "${categoryName}"?`)) {
            try {
                this.dataModule.deleteCategory(categoryName);
                this.renderCategories();
                showNotification('Category deleted successfully', 'success');
                
                // Update dashboard stats
                if (window.adminModule) {
                    adminModule.renderStats();
                }
            } catch (error) {
                console.error('Error deleting category:', error);
                showNotification('Failed to delete category. Please try again.', 'error');
            }
        }
    }

    filterCategories(searchTerm) {
        const categories = this.dataModule.getCategories();
        const filtered = categories.filter(category =>
            category.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderCategoriesList(filtered);
    }

    closeModal(modalId) {
        console.log('🔧 AdminCategoriesModule: closeModal called for:', modalId);
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            console.log('🔧 AdminCategoriesModule: Modal closed successfully');
        }
    }

    // Cleanup method
    destroy() {
        this.removeEventListeners();
        if (this.categoryFormModal) {
            this.categoryFormModal.remove();
            this.categoryFormModal = null;
        }
    }
}

export default AdminCategoriesModule;