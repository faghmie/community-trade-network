// js/modules/categories.js
// ES6 Module for category management

import { generateId } from './uuid.js';
import { showNotification } from './notifications.js';
import { defaultCategories } from '../data/defaultCategories.js';

export class CategoriesModule {
    constructor(dataModule = null) {
        this.categories = [];
        this.listeners = [];
        this.storage = null;
        this.dataModule = dataModule;
    }

    init(storage = null, dataModule = null) {
        this.storage = storage;
        this.dataModule = dataModule || this.dataModule;
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
        if (!this.storage) {
            console.error('CategoriesModule: storage is undefined!');
            return;
        }
        
        const saved = this.storage.load('categories');
        
        if (saved && saved.length > 0) {
            this.categories = saved;
        } else {
            // Use imported default categories
            this.categories = JSON.parse(JSON.stringify(defaultCategories));
            this.saveCategories();
        }
    }

    saveCategories = () => {
        if (!this.storage) {
            console.error('CategoriesModule: storage is undefined in saveCategories!');
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
            showNotification('Category name cannot be empty!', 'error');
            return false;
        }

        const trimmedCategory = categoryName.trim();
        if (this.categories.some(cat => cat.name === trimmedCategory)) {
            showNotification('Category already exists!', 'error');
            return false;
        }

        const newCategory = {
            id: generateId(),
            name: trimmedCategory,
            created_at: new Date().toISOString()
        };

        this.categories.push(newCategory);
        const success = this.saveCategories();
        if (success) {
            showNotification('Category added successfully!');
        }
        return success;
    }

    updateCategory(oldName, newName) {
        if (!newName || newName.trim() === '') {
            showNotification('Category name cannot be empty!', 'error');
            return false;
        }

        const trimmedNewName = newName.trim();
        const category = this.categories.find(cat => cat.name === oldName);
        
        if (!category) {
            showNotification('Category not found!', 'error');
            return false;
        }

        if (this.categories.some(cat => cat.name === trimmedNewName && cat.id !== category.id)) {
            showNotification('Category already exists!', 'error');
            return false;
        }

        // Update category name
        category.name = trimmedNewName;
        
        // Update all contractors with this category if dataModule is available
        if (this.dataModule && this.dataModule.updateContractorCategory) {
            this.dataModule.updateContractorCategory(oldName, trimmedNewName);
        }
        
        const success = this.saveCategories();
        if (success) {
            showNotification('Category updated successfully!');
        }
        return success;
    }

    deleteCategory(categoryName) {
        // Check if any contractors are using this category if dataModule is available
        if (this.dataModule && this.dataModule.getContractors) {
            const contractorsUsingCategory = this.dataModule.getContractors().filter(
                contractor => contractor.category === categoryName
            );

            if (contractorsUsingCategory.length > 0) {
                showNotification(`Cannot delete category. ${contractorsUsingCategory.length} contractor(s) are using it.`, 'error');
                return false;
            }
        }

        const index = this.categories.findIndex(cat => cat.name === categoryName);
        if (index === -1) {
            showNotification('Category not found!', 'error');
            return false;
        }

        this.categories.splice(index, 1);
        const success = this.saveCategories();
        if (success) {
            showNotification('Category deleted successfully!');
        }
        return success;
    }

    // Get category statistics
    getCategoryStats() {
        const stats = {};
        
        // Only calculate stats if dataModule is available
        if (!this.dataModule || !this.dataModule.getContractors) {
            return stats;
        }
        
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