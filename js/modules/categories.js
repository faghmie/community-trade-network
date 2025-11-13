// Categories module - handles category management
const categoriesModule = {
    categories: [],
    listeners: [],

    init() {
        this.loadCategories();
    },

    // Add event listener for category changes
    onCategoriesChanged(callback) {
        this.listeners.push(callback);
    },

    // Notify all listeners that categories have changed
    notifyCategoriesChanged() {
        this.listeners.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('Error in categories changed listener:', error);
            }
        });
    },

    loadCategories() {
        const saved = storage.load('categories');
        if (saved && saved.length > 0) {
            this.categories = saved;
        } else {
            // Default categories
            this.categories = [
                'Plumbing',
                'Electrical',
                'General Contracting',
                'Roofing',
                'HVAC',
                'Landscaping',
                'Painting',
                'Carpentry',
                'Flooring',
                'Concrete'
            ];
            this.saveCategories();
        }
    },

    saveCategories() {
        const success = storage.save('categories', this.categories);
        if (success) {
            this.notifyCategoriesChanged(); // Notify when categories change
        }
        return success;
    },

    getCategories() {
        return this.categories.sort();
    },

    addCategory(categoryName) {
        if (!categoryName || categoryName.trim() === '') {
            utils.showNotification('Category name cannot be empty!', 'error');
            return false;
        }

        const trimmedCategory = categoryName.trim();
        if (this.categories.includes(trimmedCategory)) {
            utils.showNotification('Category already exists!', 'error');
            return false;
        }

        this.categories.push(trimmedCategory);
        const success = this.saveCategories();
        if (success) {
            utils.showNotification('Category added successfully!');
        }
        return success;
    },

    updateCategory(oldName, newName) {
        if (!newName || newName.trim() === '') {
            utils.showNotification('Category name cannot be empty!', 'error');
            return false;
        }

        const trimmedNewName = newName.trim();
        const index = this.categories.findIndex(cat => cat === oldName);
        
        if (index === -1) {
            utils.showNotification('Category not found!', 'error');
            return false;
        }

        if (this.categories.includes(trimmedNewName) && oldName !== trimmedNewName) {
            utils.showNotification('Category already exists!', 'error');
            return false;
        }

        // Update category in categories list
        this.categories[index] = trimmedNewName;
        
        // Update all contractors with this category
        dataModule.updateContractorCategory(oldName, trimmedNewName);
        
        const success = this.saveCategories();
        if (success) {
            utils.showNotification('Category updated successfully!');
        }
        return success;
    },

    deleteCategory(categoryName) {
        // Check if any contractors are using this category
        const contractorsUsingCategory = dataModule.getContractors().filter(
            contractor => contractor.category === categoryName
        );

        if (contractorsUsingCategory.length > 0) {
            utils.showNotification(`Cannot delete category. ${contractorsUsingCategory.length} contractor(s) are using it.`, 'error');
            return false;
        }

        const index = this.categories.findIndex(cat => cat === categoryName);
        if (index === -1) {
            utils.showNotification('Category not found!', 'error');
            return false;
        }

        this.categories.splice(index, 1);
        const success = this.saveCategories();
        if (success) {
            utils.showNotification('Category deleted successfully!');
        }
        return success;
    },

    // Get category statistics
    getCategoryStats() {
        const stats = {};
        const contractors = dataModule.getContractors();
        
        this.categories.forEach(category => {
            const categoryContractors = contractors.filter(c => c.category === category);
            stats[category] = {
                count: categoryContractors.length,
                totalReviews: categoryContractors.reduce((sum, c) => sum + c.reviews.length, 0),
                averageRating: categoryContractors.length > 0 ? 
                    (categoryContractors.reduce((sum, c) => sum + parseFloat(c.rating), 0) / categoryContractors.length).toFixed(1) : '0.0'
            };
        });
        
        return stats;
    }
};