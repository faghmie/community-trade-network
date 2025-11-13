// Admin Categories Management
const adminCategoriesModule = {
    init() {
        this.bindEvents();
        this.renderCategories();
    },

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
    },

    renderCategories() {
        this.renderCategoriesList();
        this.renderCategoryStats();
    },

    renderCategoriesList(filteredCategories = null) {
        const categories = filteredCategories || categoriesModule.getCategories();
        const container = document.getElementById('categoriesList');
        
        if (!container) return;

        const categoryStats = categoriesModule.getCategoryStats();
        
        container.innerHTML = categories.map(category => {
            const stats = categoryStats[category] || { count: 0, totalReviews: 0, averageRating: '0.0' };
            
            return `
                <div class="category-item">
                    <div class="category-info">
                        <h4>${category}</h4>
                        <div class="category-stats">
                            <span class="stat">${stats.count} contractors</span>
                            <span class="stat">${stats.totalReviews} reviews</span>
                            <span class="stat">${stats.averageRating} ⭐ rating</span>
                        </div>
                    </div>
                    <div class="category-actions">
                        <button class="btn btn-small btn-primary" onclick="adminCategoriesModule.editCategory('${category}')">
                            Edit
                        </button>
                        <button class="btn btn-small" style="background: var(--accent-color); color: white;" 
                                onclick="adminCategoriesModule.deleteCategory('${category}')">
                            Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderCategoryStats() {
        const stats = categoriesModule.getCategoryStats();
        const totalCategories = categoriesModule.getCategories().length;
        const totalContractors = Object.values(stats).reduce((sum, stat) => sum + stat.count, 0);
        
        document.getElementById('totalCategoriesCount').textContent = totalCategories;
        document.getElementById('totalCategorizedContractors').textContent = totalContractors;
    },

    showAddCategoryForm(category = null) {
        const form = document.getElementById('categoryForm');
        const modal = document.getElementById('categoryFormModal');
        
        if (category) {
            // Edit mode
            document.getElementById('categoryId').value = category;
            document.getElementById('categoryName').value = category;
            document.getElementById('formCategoryTitle').textContent = 'Edit Category';
        } else {
            // Add mode
            form.reset();
            document.getElementById('categoryId').value = '';
            document.getElementById('formCategoryTitle').textContent = 'Add Category';
        }
        
        modal.style.display = 'block';
    },

    handleCategorySubmit() {
        const categoryName = document.getElementById('categoryName').value;
        const existingCategory = document.getElementById('categoryId').value;
        
        if (existingCategory) {
            // Update existing category
            categoriesModule.updateCategory(existingCategory, categoryName);
        } else {
            // Add new category
            categoriesModule.addCategory(categoryName);
        }

        this.closeModal('categoryFormModal');
        this.renderCategories();
        
        // Also update contractors tab stats if it's visible
        if (typeof adminModule !== 'undefined') {
            adminModule.renderStats();
        }
    },

    editCategory(categoryName) {
        this.showAddCategoryForm(categoryName);
    },

    deleteCategory(categoryName) {
        if (confirm(`Are you sure you want to delete the category "${categoryName}"?`)) {
            categoriesModule.deleteCategory(categoryName);
            this.renderCategories();
            
            // Also update contractors tab stats if it's visible
            if (typeof adminModule !== 'undefined') {
                adminModule.renderStats();
            }
        }
    },

    filterCategories(searchTerm) {
        const categories = categoriesModule.getCategories();
        const filtered = categories.filter(category =>
            category.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderCategoriesList(filtered);
    },

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }
};