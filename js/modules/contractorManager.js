// js/modules/contractorManager.js
const contractorManager = {
    contractors: [],

    init(storage, defaultContractors) {
        this.storage = storage;
        const saved = this.storage.load('contractors');
        
        if (saved && saved.length > 0) {
            this.contractors = saved;
            this.migrateContractorFields();
        } else {
            this.contractors = JSON.parse(JSON.stringify(defaultContractors));
            this.save();
        }
    },

    save() {
        return this.storage.save('contractors', this.contractors);
    },

    getAll() {
        return this.contractors;
    },

    getById(id) {
        return this.contractors.find(contractor => contractor.id === id);
    },

    create(contractorData) {
        const contractor = {
            id: this.generateId(),
            ...contractorData,
            rating: 0,
            reviews: [],
            createdAt: new Date().toISOString()
        };
        this.contractors.push(contractor);
        this.save();
        return contractor;
    },

    update(id, updates) {
        const contractor = this.getById(id);
        if (contractor) {
            Object.assign(contractor, updates);
            this.save();
            return contractor;
        }
        return null;
    },

    delete(id) {
        const index = this.contractors.findIndex(c => c.id === id);
        if (index !== -1) {
            this.contractors.splice(index, 1);
            this.save();
            return true;
        }
        return false;
    },

    search(searchTerm, categoryFilter = '', ratingFilter = '', locationFilter = '') {
        return this.contractors.filter(contractor => {
            const matchesSearch = !searchTerm || 
                contractor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                contractor.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                contractor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (contractor.location && contractor.location.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesCategory = !categoryFilter || contractor.category === categoryFilter;
            const matchesRating = !ratingFilter || parseFloat(contractor.rating) >= parseFloat(ratingFilter);
            const matchesLocation = !locationFilter || contractor.location === locationFilter;
            
            return matchesSearch && matchesCategory && matchesRating && matchesLocation;
        });
    },

    getAllLocations() {
        const locations = [...new Set(this.contractors
            .map(contractor => contractor.location)
            .filter(location => location && location.trim() !== '')
        )].sort();
        return locations;
    },

    migrateContractorFields() {
        let migrated = false;
        this.contractors.forEach(contractor => {
            if (!contractor.hasOwnProperty('website')) {
                contractor.website = '';
                migrated = true;
            }
            if (!contractor.hasOwnProperty('location')) {
                contractor.location = '';
                migrated = true;
            }
        });
        if (migrated) this.save();
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};