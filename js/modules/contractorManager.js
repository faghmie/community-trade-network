// js/modules/contractorManager.js
class ContractorManager {
    constructor() {
        this.contractors = [];
        this.storage = null;
        this.utils = null;
        this.locationData = null;
    }

    init(storage, defaultContractors, utils, locationData) {
        this.storage = storage;
        this.utils = utils;
        this.locationData = locationData;
        const saved = this.storage.load('contractors');
        
        // FIX: Handle the case where storage returns the string "undefined"
        if (saved && saved !== "undefined" && saved.length > 0) {
            this.contractors = saved;
        } else {
            this.contractors = JSON.parse(JSON.stringify(defaultContractors));
            this.save();
        }
    }

    save = () => this.storage.save('contractors', this.contractors);

    getAll = () => this.contractors;

    getById = (id) => this.contractors.find(contractor => contractor.id === id);

    create(contractorData) {
        // Generate coordinates and service areas based on location
        const { coordinates, serviceAreas } = this.generateMapData(contractorData.location);
        
        const contractor = {
            id: this.utils.generateId(), // Use injected utils
            ...contractorData,
            coordinates: coordinates,
            serviceAreas: serviceAreas,
            rating: 0,
            reviewCount: 0,
            overallRating: 0,
            reviews: [],
            createdAt: new Date().toISOString()
        };
        this.contractors.push(contractor);
        this.save();
        return contractor;
    }

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
    }

    delete(id) {
        const index = this.contractors.findIndex(c => c.id === id);
        if (index !== -1) {
            this.contractors.splice(index, 1);
            this.save();
            return true;
        }
        return false;
    }

    search(searchTerm, categoryFilter = '', ratingFilter = '', locationFilter = '') {
        return this.contractors.filter(contractor => {
            const matchesSearch = !searchTerm || 
                contractor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                contractor.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                contractor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (contractor.location && contractor.location.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesCategory = !categoryFilter || contractor.category === categoryFilter;
            const matchesRating = !ratingFilter || parseFloat(contractor.overallRating) >= parseFloat(ratingFilter);
            const matchesLocation = !locationFilter || contractor.location === locationFilter;
            
            return matchesSearch && matchesCategory && matchesRating && matchesLocation;
        });
    }

    getAllLocations = () => {
        const locations = [...new Set(this.contractors
            .map(contractor => contractor.location)
            .filter(location => location && location.trim() !== '')
        )].sort();
        return locations;
    }

    // Generate coordinates and service areas based on location
    generateMapData(location) {
        if (!location || !this.locationData) {
            return {
                coordinates: null,
                serviceAreas: []
            };
        }

        const { southAfricanCityCoordinates, southAfricanProvinces } = this.locationData;
        
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

    // Refresh contractor data from storage
    refresh() {
        const saved = this.storage.load('contractors');
        // FIX: Also handle "undefined" string in refresh method
        if (saved && saved !== "undefined" && saved.length > 0) {
            this.contractors = saved;
        }
    }
}

// Create singleton instance
const contractorManager = new ContractorManager();