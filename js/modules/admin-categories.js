// Admin Categories Management - UPDATED WITH CONSISTENT STATISTICS
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
        // Check if any contractors are using this category
        const contractorsUsingCategory = this.dataModule.getContractors().filter(
            contractor => contractor.category === categoryName
        );

        if (contractorsUsingCategory.length > 0) {
            alert(`Cannot delete category "${categoryName}". ${contractorsUsingCategory.length} contractor(s) are using it. Please reassign or delete those contractors first.`);
            return false;
        }

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

export default AdminCategoriesModule;