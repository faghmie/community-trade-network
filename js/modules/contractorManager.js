// js/modules/contractorManager.js
// ES6 Module for contractor management - UPDATED to preserve geocoded coordinates

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
        await this.refresh();
    }

    save = () => {
        return this.storage.save('contractors', this.contractors);
    }

    getAll = () => this.contractors;

    getById = (id) => this.contractors.find(contractor => contractor.id === id);

    create(contractorData) {
        console.log('📝 ContractorManager.create() called with data:', {
            location: contractorData.location,
            hasCoordinates: !!contractorData.coordinates,
            coordinates: contractorData.coordinates
        });

        // Use provided coordinates if available, otherwise generate from location
        const { coordinates, serviceAreas } = contractorData.coordinates 
            ? { 
                coordinates: contractorData.coordinates, 
                serviceAreas: contractorData.serviceAreas || [] 
              }
            : this.generateMapData(contractorData.location);
        
        const contractor = {
            id: generateId(),
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
        
        console.log('✅ Contractor created with coordinates:', contractor.coordinates);
        return contractor;
    }

    update(id, updates) {
        const contractor = this.getById(id);
        if (contractor) {
            console.log('📝 ContractorManager.update() called with:', {
                id: id,
                location: updates.location,
                hasCoordinates: !!updates.coordinates,
                coordinates: updates.coordinates
            });

            if (updates.location && updates.location !== contractor.location) {
                // If coordinates are provided in updates, use them (from geocoding)
                if (updates.coordinates) {
                    console.log('📍 Using provided coordinates from updates:', updates.coordinates);
                    // Keep the provided coordinates and serviceAreas
                } else {
                    // No coordinates provided, generate from location
                    console.log('📍 No coordinates provided, generating from location');
                    const { coordinates, serviceAreas } = this.generateMapData(updates.location);
                    updates.coordinates = coordinates;
                    updates.serviceAreas = serviceAreas;
                }
            } else if (updates.coordinates) {
                // Coordinates provided without location change, use them
                console.log('📍 Using provided coordinates without location change:', updates.coordinates);
            }
            
            Object.assign(contractor, updates);
            this.save();
            
            console.log('✅ Contractor updated with coordinates:', contractor.coordinates);
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

    generateMapData(location) {
        if (!location || !this.locationData) {
            return {
                coordinates: null,
                serviceAreas: []
            };
        }

        const { southAfricanCityCoordinates, southAfricanProvinces } = this.locationData;
        const [area, province] = location.split(', ').map(part => part.trim());
        
        let coordinates = null;
        let serviceAreas = [];

        if (area && southAfricanCityCoordinates) {
            const areaKey = area.toLowerCase();
            coordinates = southAfricanCityCoordinates[areaKey] || null;
        }

        if (!coordinates && province && southAfricanProvinces) {
            const provinceData = southAfricanProvinces[province];
            if (provinceData && provinceData.coordinates) {
                coordinates = provinceData.coordinates;
            }
        }

        if (province && southAfricanProvinces && southAfricanProvinces[province]) {
            const provinceData = southAfricanProvinces[province];
            serviceAreas = provinceData.cities.slice(0, 4);
        } else if (area) {
            serviceAreas = [area];
        }

        console.log('🗺️ Generated map data for location:', location, {
            coordinates: coordinates,
            serviceAreas: serviceAreas
        });

        return {
            coordinates: coordinates,
            serviceAreas: serviceAreas
        };
    }

    async refresh() {
        const saved = await this.storage.load('contractors');
        
        if (saved && saved !== "undefined" && Array.isArray(saved) && saved.length > 0) {
            this.contractors = saved;
        } else {
            this.contractors = [];
        }
        
        return this.contractors;
    }

    getContractorCount() {
        return this.contractors.length;
    }
}