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
        this.reviewManager = null; // Add reference to review manager
    }

    async init(storage) {
        this.storage = storage;
        
        // Load contractors from storage - dataModule handles default data setup
        const saved = await this.storage.load('contractors');
        
        // FIX: Only use data from storage, dataModule handles defaults
        if (saved && saved !== "undefined" && saved.length > 0) {
            this.contractors = saved;
        } else {
            // If no data in storage, start with empty array
            // dataModule will handle populating with defaults
            this.contractors = [];
        }
    }

    // Set review manager reference for cleanup operations
    setReviewManager(reviewManager) {
        this.reviewManager = reviewManager;
    }

    save = () => {
        return this.storage.save('contractors', this.contractors);
    }

    getAll = () => this.contractors;

    getById = (id) => this.contractors.find(contractor => contractor.id === id);

    create(contractorData) {
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
            
            // Clean up reviews for this contractor
            this.cleanupContractorReviews(id);
            
            return true;
        }
        return false;
    }

    // Clean up all reviews for a deleted contractor
    async cleanupContractorReviews(contractorId) {
        try {
            // Load current reviews from storage
            const currentReviews = await this.storage.load('reviews');
            
            if (currentReviews && Array.isArray(currentReviews)) {
                // Filter out reviews for the deleted contractor
                const updatedReviews = currentReviews.filter(review => review.contractor_id !== contractorId);
                
                // Save the filtered reviews back to storage WITH Supabase sync
                await this.storage.save('reviews', updatedReviews, { syncToSupabase: true });
                
                // Wait for Supabase sync to complete before refreshing
                await this.waitForSupabaseSync();
                
                // Force refresh the review manager to update its cache
                await this.forceRefreshReviewManager();
            }
        } catch (error) {
            console.error('Error cleaning up contractor reviews:', error);
        }
    }

    // Wait for Supabase sync to complete
    async waitForSupabaseSync() {
        return new Promise((resolve) => {
            // Check if Supabase is available and has pending sync
            if (this.storage.supabase && this.storage.supabase.hasPendingSync) {
                // Wait a moment for sync to complete
                setTimeout(resolve, 500);
            } else {
                resolve();
            }
        });
    }

    // Force refresh the review manager to ensure it has the latest data
    async forceRefreshReviewManager() {
        try {
            // First, force a sync from Supabase to localStorage
            if (this.storage && this.storage.forceRefreshAll) {
                await this.storage.forceRefreshAll();
            }
            
            // Method 1: Use global dataModule if available
            if (window.dataModule && window.dataModule.getReviewManager) {
                const reviewManager = window.dataModule.getReviewManager();
                if (reviewManager && typeof reviewManager.refresh === 'function') {
                    await reviewManager.refresh();
                }
            }
            
            // Method 2: Use the stored review manager reference
            else if (this.reviewManager && typeof this.reviewManager.refresh === 'function') {
                await this.reviewManager.refresh();
            }
            
            // Dispatch event to notify UI components to refresh
            document.dispatchEvent(new CustomEvent('reviewsUpdated'));
            
        } catch (error) {
            console.error('Error refreshing review manager:', error);
        }
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