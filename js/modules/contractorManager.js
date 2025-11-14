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
        // Generate coordinates and service areas based on location
        const { coordinates, serviceAreas } = this.generateMapData(contractorData.location);
        
        const contractor = {
            id: this.generateId(),
            ...contractorData,
            coordinates: coordinates,
            serviceAreas: serviceAreas,
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
            // If location is being updated, regenerate map data
            if (updates.location && updates.location !== contractor.location) {
                const { coordinates, serviceAreas } = this.generateMapData(updates.location);
                updates.coordinates = coordinates;
                updates.serviceAreas = serviceAreas;
            }
            
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
            // Migrate missing map data
            if (!contractor.hasOwnProperty('coordinates') && contractor.location) {
                const { coordinates } = this.generateMapData(contractor.location);
                contractor.coordinates = coordinates;
                migrated = true;
            }
            if (!contractor.hasOwnProperty('serviceAreas') && contractor.location) {
                const { serviceAreas } = this.generateMapData(contractor.location);
                contractor.serviceAreas = serviceAreas;
                migrated = true;
            }
        });
        if (migrated) this.save();
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // NEW: Generate coordinates and service areas based on location
    generateMapData(location) {
        if (!location) {
            return {
                coordinates: null,
                serviceAreas: []
            };
        }

        // Extract area and province from location (format: "Area, Province")
        const [area, province] = location.split(', ').map(part => part.trim());
        
        let coordinates = null;
        let serviceAreas = [];

        // Try to find coordinates for the area
        if (area && southAfricanCityCoordinates) {
            const areaKey = area.toLowerCase();
            coordinates = southAfricanCityCoordinates[areaKey] || null;
        }

        // If no coordinates found for area, try province
        if (!coordinates && province && southAfricanProvinces) {
            const provinceData = southAfricanProvinces[province];
            if (provinceData && provinceData.coordinates) {
                coordinates = provinceData.coordinates;
            }
        }

        // Generate service areas based on province
        if (province && southAfricanProvinces && southAfricanProvinces[province]) {
            const provinceData = southAfricanProvinces[province];
            // Use the first 3-4 cities from the province as service areas
            serviceAreas = provinceData.cities.slice(0, 4);
        } else if (area) {
            // Fallback: just use the area itself
            serviceAreas = [area];
        }

        return {
            coordinates: coordinates,
            serviceAreas: serviceAreas
        };
    }
};