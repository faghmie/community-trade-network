// js/modules/categories.js - ES6 Module for category management (Pure Data Class)
import { generateUUID } from './uuid.js';

export class CategoriesModule {
    constructor(dataModule) {
        this.dataModule = dataModule;
        this.storage = null;
        this.categories = [];
        this.initialized = false;
    }

    async init(storage, dataModule) {
        this.storage = storage;
        this.dataModule = dataModule;
        
        // Load categories from storage
        await this.loadCategories();
        this.initialized = true;
        
        console.log('✅ CategoriesModule initialized with categories:', this.categories.length);
    }

    async loadCategories() {
        try {
            // Use storage.load() which handles Supabase sync
            const loadedCategories = await this.storage.load('categories');
            
            if (loadedCategories && loadedCategories.length > 0) {
                this.categories = loadedCategories;
                console.log('✅ CategoriesModule: Loaded categories from storage:', this.categories.length);
            } else {
                console.warn('⚠️ CategoriesModule: No categories found in storage');
                this.categories = [];
            }
        } catch (error) {
            console.error('❌ CategoriesModule: Error loading categories:', error);
            this.categories = [];
        }
    }

    // Refresh categories from storage
    async refresh() {
        console.log('🔄 CategoriesModule: Refreshing categories...');
        await this.loadCategories();
        return this.categories;
    }

    getCategories() {
        return this.categories;
    }

    getCategoryByName(name) {
        return this.categories.find(cat => cat.name === name);
    }

    async addCategory(name) {
        if (!name || name.trim() === '') {
            throw new Error('Category name cannot be empty');
        }

        // Check if category already exists
        const existingCategory = this.getCategoryByName(name);
        if (existingCategory) {
            throw new Error(`Category "${name}" already exists`);
        }

        // Create new category with UUID
        const newCategory = {
            id: generateUUID(),
            name: name.trim(),
            created_at: new Date().toISOString()
        };

        // Add to local array
        this.categories.push(newCategory);

        // Save to storage (with Supabase sync for admin)
        const success = await this.storage.save('categories', this.categories);
        
        if (success) {
            console.log('✅ Category added:', newCategory);
            return newCategory;
        } else {
            // Rollback on failure
            this.categories = this.categories.filter(cat => cat.id !== newCategory.id);
            throw new Error('Failed to save category');
        }
    }

    async updateCategory(oldName, newName) {
        if (!newName || newName.trim() === '') {
            throw new Error('Category name cannot be empty');
        }

        const categoryIndex = this.categories.findIndex(cat => cat.name === oldName);
        if (categoryIndex === -1) {
            throw new Error(`Category "${oldName}" not found`);
        }

        // Check if new name already exists (and it's not the same category)
        const existingCategory = this.getCategoryByName(newName);
        if (existingCategory && existingCategory.name !== oldName) {
            throw new Error(`Category "${newName}" already exists`);
        }

        // Update the category
        const oldCategory = { ...this.categories[categoryIndex] };
        this.categories[categoryIndex] = {
            ...oldCategory,
            name: newName.trim()
        };

        // Save to storage
        const success = await this.storage.save('categories', this.categories);
        
        if (success) {
            console.log('✅ Category updated:', oldName, '→', newName);
            return this.categories[categoryIndex];
        } else {
            // Rollback on failure
            this.categories[categoryIndex] = oldCategory;
            throw new Error('Failed to update category');
        }
    }

    async deleteCategory(name) {
        const categoryIndex = this.categories.findIndex(cat => cat.name === name);
        if (categoryIndex === -1) {
            throw new Error(`Category "${name}" not found`);
        }

        // Check if category is used by any contractors
        const contractors = this.dataModule.getContractors();
        const contractorsUsingCategory = contractors.filter(contractor => 
            contractor.category === name
        );

        if (contractorsUsingCategory.length > 0) {
            throw new Error(`Cannot delete category "${name}" - it is used by ${contractorsUsingCategory.length} contractor(s)`);
        }

        // Remove category
        const deletedCategory = this.categories.splice(categoryIndex, 1)[0];

        // Save to storage
        const success = await this.storage.save('categories', this.categories);
        
        if (success) {
            console.log('✅ Category deleted:', name);
            return deletedCategory;
        } else {
            // Rollback on failure
            this.categories.splice(categoryIndex, 0, deletedCategory);
            throw new Error('Failed to delete category');
        }
    }

    // Check if category exists
    categoryExists(name) {
        return this.categories.some(cat => cat.name === name);
    }

    // Get category count
    getCategoryCount() {
        return this.categories.length;
    }

    // Get categories for dropdown/select (formatted for UI)
    getCategoriesForDropdown() {
        return this.categories.map(category => ({
            value: category.name,
            text: category.name
        }));
    }

    // Validate category name
    validateCategoryName(name) {
        if (!name || name.trim() === '') {
            return { valid: false, message: 'Category name is required' };
        }
        
        if (name.length > 50) {
            return { valid: false, message: 'Category name must be less than 50 characters' };
        }
        
        return { valid: true };
    }

    // Get category statistics
    getCategoryStats() {
        const contractors = this.dataModule.getContractors();
        const stats = {};
        
        this.categories.forEach(category => {
            const categoryContractors = contractors.filter(contractor => 
                contractor.category === category.name
            );
            
            stats[category.name] = {
                count: categoryContractors.length,
                contractors: categoryContractors
            };
        });
        
        return stats;
    }
}