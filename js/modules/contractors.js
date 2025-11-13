// Contractor data management
const contractorsModule = {
    contractors: [],

    init() {
        this.loadContractors();
    },

    loadContractors() {
        const saved = utils.loadFromStorage('contractors');
        if (saved) {
            this.contractors = saved;
        } else {
            // Use default data
            this.contractors = JSON.parse(JSON.stringify(defaultContractors));
            this.saveContractors();
        }
    },

    saveContractors() {
        utils.saveToStorage('contractors', this.contractors);
    },

    getContractors() {
        return this.contractors;
    },

    getContractor(id) {
        return this.contractors.find(contractor => contractor.id === id);
    },

    addContractor(contractorData) {
        const newContractor = {
            id: utils.generateId(),
            ...contractorData,
            rating: 0,
            reviews: [],
            createdAt: new Date().toISOString()
        };
        
        this.contractors.push(newContractor);
        this.saveContractors();
        utils.showNotification('Contractor added successfully!');
        return newContractor;
    },

    updateContractor(id, updates) {
        const index = this.contractors.findIndex(contractor => contractor.id === id);
        if (index !== -1) {
            this.contractors[index] = { ...this.contractors[index], ...updates };
            this.saveContractors();
            utils.showNotification('Contractor updated successfully!');
            return this.contractors[index];
        }
        return null;
    },

    deleteContractor(id) {
        const index = this.contractors.findIndex(contractor => contractor.id === id);
        if (index !== -1) {
            this.contractors.splice(index, 1);
            this.saveContractors();
            utils.showNotification('Contractor deleted successfully!');
            return true;
        }
        return false;
    },

    addReview(contractorId, reviewData) {
        const contractor = this.getContractor(contractorId);
        if (contractor) {
            const newReview = {
                id: utils.generateId(),
                ...reviewData,
                date: new Date().toISOString()
            };
            
            contractor.reviews.push(newReview);
            contractor.rating = utils.calculateAverageRating(contractor.reviews);
            this.saveContractors();
            return newReview;
        }
        return null;
    }
};