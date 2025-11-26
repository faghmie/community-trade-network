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
    }

    async loadCategories() {
        try {
            // Use storage.load() which handles Supabase sync
            const loadedCategories = await this.storage.load('categories');
            
            if (loadedCategories && loadedCategories.length > 0) {
                this.categories = loadedCategories;
            } else {
                console.warn('No categories found in storage');
                this.categories = [];
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            this.categories = [];
        }
    }

    // Refresh categories from storage
    async refresh() {
        await this.loadCategories();
        return this.categories;
    }

    // ========== CONSISTENT CONTRACTOR-LIKE METHODS ==========

    /**
     * Get all categories (consistent with contractorManager.getAll())
     */
    getAll() {
        return this.categories;
    }

    /**
     * Get category by ID (consistent with contractorManager.get())
     */
    get(categoryId) {
        return this.categories.find(cat => cat.id === categoryId);
    }

    /**
     * Create new category (consistent with contractorManager.create())
     */
    async create(categoryData) {
        if (!categoryData.name || categoryData.name.trim() === '') {
            throw new Error('Category name cannot be empty');
        }

        // Check if category already exists by name
        const existingCategory = this.categories.find(cat => 
            cat.name.toLowerCase() === categoryData.name.toLowerCase()
        );
        if (existingCategory) {
            throw new Error(`Category "${categoryData.name}" already exists`);
        }

        // Create new category with UUID
        const newCategory = {
            id: generateUUID(),
            name: categoryData.name.trim(),
            type: categoryData.type || '',
            subtype: categoryData.subtype || '',
            description: categoryData.description || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Add to local array
        this.categories.push(newCategory);

        // Save to storage (with Supabase sync for admin)
        const success = await this.storage.save('categories', this.categories);
        
        if (success) {
            return newCategory;
        } else {
            // Rollback on failure
            this.categories = this.categories.filter(cat => cat.id !== newCategory.id);
            throw new Error('Failed to save category');
        }
    }

    /**
     * Update category by ID (consistent with contractorManager.update())
     */
    async update(categoryId, categoryData) {
        const categoryIndex = this.categories.findIndex(cat => cat.id === categoryId);
        if (categoryIndex === -1) {
            throw new Error(`Category with ID "${categoryId}" not found`);
        }

        if (!categoryData.name || categoryData.name.trim() === '') {
            throw new Error('Category name cannot be empty');
        }

        // Check if new name already exists (excluding current category)
        const existingCategory = this.categories.find(cat => 
            cat.name.toLowerCase() === categoryData.name.toLowerCase() && 
            cat.id !== categoryId
        );
        if (existingCategory) {
            throw new Error(`Category "${categoryData.name}" already exists`);
        }

        // Update the category
        const oldCategory = { ...this.categories[categoryIndex] };
        this.categories[categoryIndex] = {
            ...oldCategory,
            ...categoryData,
            name: categoryData.name.trim(),
            updated_at: new Date().toISOString()
        };

        // Save to storage
        const success = await this.storage.save('categories', this.categories);
        
        if (success) {
            return this.categories[categoryIndex];
        } else {
            // Rollback on failure
            this.categories[categoryIndex] = oldCategory;
            throw new Error('Failed to update category');
        }
    }

    /**
     * Delete category by ID (consistent with contractorManager.delete())
     */
    async delete(categoryId) {
        const categoryIndex = this.categories.findIndex(cat => cat.id === categoryId);
        if (categoryIndex === -1) {
            throw new Error(`Category with ID "${categoryId}" not found`);
        }

        const category = this.categories[categoryIndex];

        // Check if category is used by any contractors
        const contractors = this.dataModule.getContractors();
        const contractorsUsingCategory = contractors.filter(contractor => 
            contractor.category === category.name
        );

        if (contractorsUsingCategory.length > 0) {
            throw new Error(`Cannot delete category "${category.name}" - it is used by ${contractorsUsingCategory.length} contractor(s)`);
        }

        // Remove category
        const deletedCategory = this.categories.splice(categoryIndex, 1)[0];

        // Save to storage
        const success = await this.storage.save('categories', this.categories);
        
        if (success) {
            return deletedCategory;
        } else {
            // Rollback on failure
            this.categories.splice(categoryIndex, 0, deletedCategory);
            throw new Error('Failed to delete category');
        }
    }

    // ========== COMPATIBILITY METHODS (keep existing API) ==========

    getCategories() {
        return this.getAll();
    }

    getCategoryByName(name) {
        return this.categories.find(cat => cat.name === name);
    }

    async addCategory(categoryData) {
        return this.create(categoryData);
    }

    async updateCategory(categoryId, categoryData) {
        return this.update(categoryId, categoryData);
    }

    async deleteCategory(categoryId) {
        return this.delete(categoryId);
    }

    // ========== UTILITY METHODS ==========

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

    // Search categories by term
    search(searchTerm) {
        const term = searchTerm.toLowerCase();
        return this.categories.filter(category => 
            category.name.toLowerCase().includes(term) ||
            (category.type && category.type.toLowerCase().includes(term)) ||
            (category.subtype && category.subtype.toLowerCase().includes(term)) ||
            (category.description && category.description.toLowerCase().includes(term))
        );
    }
}