// Admin Categories Management
class AdminCategoriesModule {
    constructor(dataModule) {
        this.dataModule = dataModule;
    }

    init() {
        this.bindEvents();
        this.renderCategories();
    }

    bindEvents() {
        // Add category form
        document.getElementById('addCategoryBtn')?.addEventListener('click', () => {
            this.showAddCategoryForm();
        });

        document.getElementById('categoryForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCategorySubmit();
        });

        // Search categories
        document.getElementById('categorySearch')?.addEventListener('input', (e) => {
            this.filterCategories(e.target.value);
        });
    }

    renderCategories() {
        this.renderCategoriesList();
        this.renderCategoryStats();
    }

    renderCategoriesList(filteredCategories = null) {
        const categories = filteredCategories || this.dataModule.getCategories();
        const container = document.getElementById('categoriesList');
        
        if (!container) return;

        const categoryStats = this.dataModule.getCategories().reduce((stats, category) => {
            const contractors = this.dataModule.getContractors().filter(c => c.category === category.name);
            const approvedReviews = contractors.flatMap(c => 
                c.reviews ? c.reviews.filter(r => r.status === 'approved') : []
            );
            
            stats[category.name] = {
                count: contractors.length,
                totalReviews: approvedReviews.length,
                averageRating: contractors.length > 0 ? 
                    parseFloat((contractors.reduce((sum, c) => sum + parseFloat(c.overallRating || 0), 0) / contractors.length).toFixed(1)) : 0
            };
            return stats;
        }, {});
        
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
                                onclick="adminModule.deleteCategory('${category.name}')">
                            Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
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
        const form = document.getElementById('categoryForm');
        const modal = document.getElementById('categoryFormModal');
        
        if (categoryName) {
            // Edit mode
            document.getElementById('categoryId').value = categoryName;
            document.getElementById('categoryName').value = categoryName;
            document.getElementById('formCategoryTitle').textContent = 'Edit Category';
        } else {
            // Add mode
            form.reset();
            document.getElementById('categoryId').value = '';
            document.getElementById('formCategoryTitle').textContent = 'Add Category';
        }
        
        if (modal) modal.style.display = 'block';
    }

    handleCategorySubmit() {
        const categoryNameInput = document.getElementById('categoryName');
        const existingCategoryInput = document.getElementById('categoryId');
        
        if (!categoryNameInput) return;

        const categoryName = categoryNameInput.value.trim();
        const existingCategory = existingCategoryInput.value;

        if (!categoryName) {
            alert('Category name cannot be empty!');
            return;
        }

        if (existingCategory) {
            // Update existing category
            this.dataModule.updateCategory(existingCategory, categoryName);
        } else {
            // Add new category
            this.dataModule.addCategory(categoryName);
        }

        this.closeModal('categoryFormModal');
        this.renderCategories();
        
        // Update dashboard stats
        if (window.adminModule) {
            adminModule.renderStats();
        }
    }

    editCategory(categoryName) {
        this.showAddCategoryForm(categoryName);
    }

    deleteCategory(categoryName) {
        if (confirm(`Are you sure you want to delete the category "${categoryName}"?`)) {
            this.dataModule.deleteCategory(categoryName);
            this.renderCategories();
            
            // Update dashboard stats
            if (window.adminModule) {
                adminModule.renderStats();
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
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }
}

// Export the class but don't create global instance
// The instance will be created in admin.js after dataModule is available