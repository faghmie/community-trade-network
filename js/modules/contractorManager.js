// js/modules/contractorManager.js
// ES6 Module for contractor management

import { generateId } from './uuid.js';
import { southAfricanCityCoordinates, southAfricanProvinces } from '../data/defaultLocations.js';

export class ContractorManager {
    constructor() {
        this.contractors = [];
        this.storage = null;
        this.locationData = {
            southAfricanCityCoordinates,
            southAfricanProvinces
        };
    }

    async init(storage) {
        this.storage = storage;
        
        // Load contractors from storage - dataModule handles default data setup
        const saved = await this.storage.load('contractors');
        
        console.log('🔧 ContractorManager.init(): Loading contractors from storage...');
        console.log('🔧 Saved data from storage:', saved);
        
        // FIX: Only use data from storage, dataModule handles defaults
        if (saved && saved !== "undefined" && saved.length > 0) {
            this.contractors = saved;
            console.log('🔧 Loaded contractors from storage:', this.contractors.length);
        } else {
            // If no data in storage, start with empty array
            // dataModule will handle populating with defaults
            this.contractors = [];
            console.log('🔧 No contractors in storage, starting with empty array');
        }
    }

    save = () => {
        console.log('🔧 ContractorManager.save(): Saving contractors to storage...');
        console.log('🔧 Current contractors count:', this.contractors.length);
        const result = this.storage.save('contractors', this.contractors);
        console.log('🔧 Save result:', result);
        return result;
    }

    getAll = () => this.contractors;

    getById = (id) => this.contractors.find(contractor => contractor.id === id);

    create(contractorData) {
        console.log('🔧 ContractorManager.create(): Creating new contractor...');
        console.log('🔧 Contractor data:', contractorData);
        
        // Generate coordinates and service areas based on location
        const { coordinates, serviceAreas } = this.generateMapData(contractorData.location);
        
        const contractor = {
            id: generateId(), // Use imported generateId
            ...contractorData,
            coordinates: coordinates,
            serviceAreas: serviceAreas,
            rating: 0,
            reviewCount: 0,
            overallRating: 0,
            reviews: [],
            createdAt: new Date().toISOString()
        };
        
        console.log('🔧 Created contractor object:', contractor);
        
        this.contractors.push(contractor);
        console.log('🔧 Contractors array after push:', this.contractors.length);
        
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
    async refresh() {
        const saved = await this.storage.load('contractors');
        // FIX: Also handle "undefined" string in refresh method
        if (saved && saved !== "undefined" && saved.length > 0) {
            this.contractors = saved;
        }
    }
}