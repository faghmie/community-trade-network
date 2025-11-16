// js/modules/categories.js
class CategoriesModule {
    constructor() {
        this.categories = [];
        this.listeners = [];
        this.storage = null;
        this.utils = null;
        this.dataModule = null;
        this.defaultCategories = [];
    }

    init(storage, utils, dataModule, defaultCategories = []) {
        console.log('🔧 CategoriesModule.init() called with:', {
            storage: storage,
            utils: utils,
            dataModule: dataModule,
            defaultCategories: defaultCategories
        });
        
        this.storage = storage;
        this.utils = utils;
        this.dataModule = dataModule;
        this.defaultCategories = defaultCategories;
        
        console.log('🔧 CategoriesModule properties after init:', {
            storage: this.storage,
            utils: this.utils,
            dataModule: this.dataModule,
            defaultCategories: this.defaultCategories
        });
        
        this.loadCategories();
    }

    // Add event listener for category changes
    onCategoriesChanged(callback) {
        this.listeners.push(callback);
    }

    // Notify all listeners that categories have changed
    notifyCategoriesChanged() {
        this.listeners.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('Error in categories changed listener:', error);
            }
        });
    }

    loadCategories() {
        console.log('🔧 CategoriesModule.loadCategories() - this.storage:', this.storage);
        
        if (!this.storage) {
            console.error('❌ CategoriesModule: storage is undefined!');
            return;
        }
        
        const saved = this.storage.load('categories');
        console.log('🔧 CategoriesModule.loadCategories() - saved data:', saved);
        
        if (saved && saved.length > 0) {
            this.categories = saved;
        } else {
            // Use default categories instead of hardcoding
            this.categories = JSON.parse(JSON.stringify(this.defaultCategories));
            this.saveCategories();
        }
        
        console.log('🔧 CategoriesModule.loadCategories() - final categories:', this.categories);
    }

    saveCategories = () => {
        if (!this.storage) {
            console.error('❌ CategoriesModule: storage is undefined in saveCategories!');
            return false;
        }
        
        const success = this.storage.save('categories', this.categories);
        if (success) {
            this.notifyCategoriesChanged();
        }
        return success;
    }

    getCategories = () => this.categories
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name));

    getCategoryNames = () => this.categories.map(cat => cat.name);

    getCategoryById = (id) => this.categories.find(cat => cat.id === id);

    getCategoryByName = (name) => this.categories.find(cat => cat.name === name);

    addCategory(categoryName) {
        if (!categoryName || categoryName.trim() === '') {
            this.utils.showNotification('Category name cannot be empty!', 'error');
            return false;
        }

        const trimmedCategory = categoryName.trim();
        if (this.categories.some(cat => cat.name === trimmedCategory)) {
            this.utils.showNotification('Category already exists!', 'error');
            return false;
        }

        const newCategory = {
            id: this.utils.generateId(),
            name: trimmedCategory,
            created_at: new Date().toISOString()
        };

        this.categories.push(newCategory);
        const success = this.saveCategories();
        if (success) {
            this.utils.showNotification('Category added successfully!');
        }
        return success;
    }

    updateCategory(oldName, newName) {
        if (!newName || newName.trim() === '') {
            this.utils.showNotification('Category name cannot be empty!', 'error');
            return false;
        }

        const trimmedNewName = newName.trim();
        const category = this.categories.find(cat => cat.name === oldName);
        
        if (!category) {
            this.utils.showNotification('Category not found!', 'error');
            return false;
        }

        if (this.categories.some(cat => cat.name === trimmedNewName && cat.id !== category.id)) {
            this.utils.showNotification('Category already exists!', 'error');
            return false;
        }

        // Update category name
        category.name = trimmedNewName;
        
        // Update all contractors with this category
        this.dataModule.updateContractorCategory(oldName, trimmedNewName);
        
        const success = this.saveCategories();
        if (success) {
            this.utils.showNotification('Category updated successfully!');
        }
        return success;
    }

    deleteCategory(categoryName) {
        // Check if any contractors are using this category
        const contractorsUsingCategory = this.dataModule.getContractors().filter(
            contractor => contractor.category === categoryName
        );

        if (contractorsUsingCategory.length > 0) {
            this.utils.showNotification(`Cannot delete category. ${contractorsUsingCategory.length} contractor(s) are using it.`, 'error');
            return false;
        }

        const index = this.categories.findIndex(cat => cat.name === categoryName);
        if (index === -1) {
            this.utils.showNotification('Category not found!', 'error');
            return false;
        }

        this.categories.splice(index, 1);
        const success = this.saveCategories();
        if (success) {
            this.utils.showNotification('Category deleted successfully!');
        }
        return success;
    }

    // Get category statistics
    getCategoryStats() {
        const stats = {};
        const contractors = this.dataModule.getContractors();
        
        this.categories.forEach(category => {
            const categoryContractors = contractors.filter(c => c.category === category.name);
            const approvedReviews = categoryContractors.flatMap(c => 
                c.reviews ? c.reviews.filter(r => r.status === 'approved') : []
            );
            
            stats[category.name] = {
                id: category.id,
                count: categoryContractors.length,
                totalReviews: approvedReviews.length,
                averageRating: categoryContractors.length > 0 ? 
                    parseFloat((categoryContractors.reduce((sum, c) => sum + parseFloat(c.overallRating || 0), 0) / categoryContractors.length).toFixed(1)) : 0
            };
        });
        
        return stats;
    }

    // Refresh categories data from storage
    refresh() {
        this.loadCategories();
    }
}

// Create singleton instance
const categoriesModule = new CategoriesModule();