// js/modules/categoryManager.js
const categoryManager = {
    categories: [],

    init(storage, defaultCategories = []) {
        this.storage = storage;
        const saved = this.storage.load('categories');
        
        if (saved && saved.length > 0) {
            this.categories = saved;
        } else {
            this.categories = defaultCategories.length > 0 ? 
                JSON.parse(JSON.stringify(defaultCategories)) : [];
            this.save();
        }
    },

    save() {
        return this.storage.save('categories', this.categories);
    },

    getAll() {
        return this.categories;
    },

    create(name) {
        // Check if category already exists
        if (this.categories.some(c => c.toLowerCase() === name.toLowerCase())) {
            return null;
        }

        this.categories.push(name);
        this.save();
        return name;
    },

    update(oldName, newName) {
        const index = this.categories.findIndex(c => c === oldName);
        if (index === -1) return false;

        // Check if new name already exists
        if (this.categories.some(c => c.toLowerCase() === newName.toLowerCase())) {
            return false;
        }

        this.categories[index] = newName;
        this.save();
        return true;
    },

    delete(name) {
        const index = this.categories.findIndex(c => c === name);
        if (index === -1) return false;

        this.categories.splice(index, 1);
        this.save();
        return true;
    }
};