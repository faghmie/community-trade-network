// js/modules/geocodingService.js
// ES6 Module for geocoding with self-contained Cache API persistence

/**
 * @typedef {Object} Coordinates
 * @property {number} lat - Latitude
 * @property {number} lng - Longitude
 */

/**
 * @typedef {Object} GeocodingResult
 * @property {Coordinates|null} coordinates - Geocoded coordinates
 * @property {string[]} serviceAreas - Extracted service areas
 * @property {string} [source] - Source of the coordinates ('geocoding' | 'cache' | 'fallback')
 * @property {number} [timestamp] - When the result was cached
 */

/**
 * @typedef {Object} AreaSuggestionOptions
 * @property {number} [limit=5] - Maximum number of suggestions
 * @property {number} [debounceMs=300] - Debounce delay in milliseconds
 */

/**
 * @typedef {Object} CacheEntry
 * @property {any} data - The cached data
 * @property {number} timestamp - When the entry was cached
 * @property {number} [expiry] - Optional expiry timestamp
 */

export class GeocodingService {
    constructor() {
        /** @type {Map<string, GeocodingResult>} */
        this.cache = new Map();
        
        /** @type {Map<string, string[]>} */
        this.areaSuggestionsCache = new Map();
        
        /** @type {Map<string, number>} */
        this.debounceTimeouts = new Map();
        
        this.useGeocoding = true;
        
        // Cache API persistence
        this.cacheName = 'geocoding-cache-v1';
        this.cacheStorage = null;
        this.persistentCacheEnabled = false;
        this.cacheExpiryHours = 24 * 7; // 1 week default
        
        // Initialize cache persistence
        this.initCachePersistence();
    }

    /**
     * Initialize Cache API for persistent caching
     * @returns {Promise<void>}
     */
    async initCachePersistence() {
        if (!('caches' in window)) {
            console.log('🗄️ Cache API not available, using in-memory cache only');
            return;
        }

        try {
            this.cacheStorage = await caches.open(this.cacheName);
            this.persistentCacheEnabled = true;
            await this.loadPersistentCache();
            console.log('🗄️ Cache API initialized successfully');
        } catch (error) {
            console.warn('❌ Cache API initialization failed, using in-memory cache:', error);
            this.persistentCacheEnabled = false;
        }
    }

    /**
     * Load cache from persistent storage into memory
     * @returns {Promise<void>}
     */
    async loadPersistentCache() {
        if (!this.persistentCacheEnabled || !this.cacheStorage) return;

        try {
            const requests = await this.cacheStorage.keys();
            let loadedCount = 0;

            for (const request of requests) {
                try {
                    const response = await this.cacheStorage.match(request);
                    if (response) {
                        /** @type {CacheEntry} */
                        const cacheEntry = await response.json();
                        const cacheKey = this.urlToCacheKey(request.url);
                        
                        // Check if cache entry is expired
                        if (this.isCacheEntryExpired(cacheEntry)) {
                            await this.cacheStorage.delete(request);
                            continue;
                        }
                        
                        if (cacheKey.startsWith('geocoding_')) {
                            /** @type {GeocodingResult} */
                            const geocodingResult = cacheEntry.data;
                            const locationKey = cacheKey.replace('geocoding_', '');
                            this.cache.set(locationKey, geocodingResult);
                            loadedCount++;
                        } else if (cacheKey.startsWith('suggestions_')) {
                            /** @type {string[]} */
                            const suggestions = cacheEntry.data;
                            const suggestionKey = cacheKey.replace('suggestions_', '');
                            this.areaSuggestionsCache.set(suggestionKey, suggestions);
                            loadedCount++;
                        }
                    }
                } catch (error) {
                    console.warn('Failed to load cache entry:', request.url, error);
                }
            }
            
            console.log(`🗄️ Loaded ${loadedCount} cache entries from persistent storage`);
        } catch (error) {
            console.warn('Failed to load persistent cache:', error);
        }
    }

    /**
     * Check if a cache entry has expired
     * @param {CacheEntry} cacheEntry 
     * @returns {boolean}
     */
    isCacheEntryExpired(cacheEntry) {
        if (!cacheEntry.expiry) return false;
        return Date.now() > cacheEntry.expiry;
    }

    /**
     * Geocode a location string to coordinates
     * @param {string} location - Location string (e.g., "Cape Town, Western Cape")
     * @returns {Promise<GeocodingResult>}
     */
    async geocodeLocation(location) {
        if (!location || typeof location !== 'string') {
            return { 
                coordinates: null, 
                serviceAreas: [],
                source: 'invalid_input'
            };
        }

        const cacheKey = location.toLowerCase().trim();
        
        // Check memory cache first (fastest)
        if (this.cache.has(cacheKey)) {
            const cachedResult = this.cache.get(cacheKey);
            return {
                ...cachedResult,
                source: 'memory_cache'
            };
        }

        // Check persistent cache
        const persistentResult = await this.getFromPersistentCache('geocoding', cacheKey);
        if (persistentResult) {
            this.cache.set(cacheKey, persistentResult); // Populate memory cache
            return {
                ...persistentResult,
                source: 'persistent_cache'
            };
        }

        // Call geocoding API
        const result = await this.callGeocodingAPI(location);
        
        // Cache the result
        await this.cacheGeocodingResult(cacheKey, result);
        
        return {
            ...result,
            source: 'geocoding_api'
        };
    }

    /**
     * Call the actual geocoding API
     * @param {string} location 
     * @returns {Promise<GeocodingResult>}
     */
    async callGeocodingAPI(location) {
        let coordinates = null;
        let serviceAreas = [];

        try {
            const cleanLocation = this.cleanLocationString(location);
            
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanLocation)}&countrycodes=za&limit=1`,
                {
                    headers: {
                        'Accept-Language': 'en',
                        'User-Agent': 'CommunityTradeNetwork/1.0'
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0) {
                    const result = data[0];
                    coordinates = {
                        lat: parseFloat(result.lat),
                        lng: parseFloat(result.lon)
                    };
                    serviceAreas = this.generateServiceAreas(location);
                }
            }
        } catch (error) {
            console.warn('Geocoding failed for location:', location, error);
        }

        return { 
            coordinates, 
            serviceAreas,
            timestamp: Date.now()
        };
    }

    /**
     * Cache a geocoding result
     * @param {string} cacheKey 
     * @param {GeocodingResult} result 
     */
    async cacheGeocodingResult(cacheKey, result) {
        // Cache in memory
        this.cache.set(cacheKey, result);
        
        // Cache persistently if available
        await this.saveToPersistentCache('geocoding', cacheKey, result);
    }

    /**
     * Get area suggestions for a province with smart caching and debouncing
     * @param {string} province 
     * @param {string} areaPrefix 
     * @param {AreaSuggestionOptions} [options]
     * @returns {Promise<string[]>}
     */
    async getAreaSuggestions(province, areaPrefix, options = {}) {
        if (!province || !areaPrefix || areaPrefix.length < 2) {
            return [];
        }

        const cacheKey = `${province.toLowerCase()}_${areaPrefix.toLowerCase()}`;
        
        // Check memory cache first
        if (this.areaSuggestionsCache.has(cacheKey)) {
            return this.areaSuggestionsCache.get(cacheKey);
        }

        // Check persistent cache
        const persistentSuggestions = await this.getFromPersistentCache('suggestions', cacheKey);
        if (persistentSuggestions) {
            this.areaSuggestionsCache.set(cacheKey, persistentSuggestions);
            return persistentSuggestions;
        }

        // Debounce rapid requests
        if (this.debounceTimeouts.has(cacheKey)) {
            clearTimeout(this.debounceTimeouts.get(cacheKey));
        }

        return new Promise((resolve) => {
            const timeoutId = setTimeout(async () => {
                try {
                    const suggestions = await this.fetchAreaSuggestions(province, areaPrefix, options);
                    
                    // Cache the suggestions
                    this.areaSuggestionsCache.set(cacheKey, suggestions);
                    await this.saveToPersistentCache('suggestions', cacheKey, suggestions);
                    
                    resolve(suggestions);
                } catch (error) {
                    console.warn('Area suggestions failed:', error);
                    resolve([]);
                }
            }, options.debounceMs || 300);

            this.debounceTimeouts.set(cacheKey, timeoutId);
        });
    }

    /**
     * Fetch area suggestions from geocoding service
     * @param {string} province 
     * @param {string} areaPrefix 
     * @param {AreaSuggestionOptions} options 
     * @returns {Promise<string[]>}
     */
    async fetchAreaSuggestions(province, areaPrefix, options) {
        if (!this.useGeocoding) {
            return [];
        }

        const query = `${areaPrefix}, ${province}, South Africa`;
        
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=za&limit=${options.limit || 5}`,
                {
                    headers: {
                        'Accept-Language': 'en',
                        'User-Agent': 'CommunityTradeNetwork/1.0'
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                return this.processAreaSuggestions(data, province, areaPrefix);
            }
        } catch (error) {
            console.warn('Geocoding API failed for suggestions:', error);
        }

        return [];
    }

    /**
     * Process geocoding results into area suggestions
     * @param {any[]} data 
     * @param {string} province 
     * @param {string} areaPrefix 
     * @returns {string[]}
     */
    processAreaSuggestions(data, province, areaPrefix) {
        if (!data || data.length === 0) {
            return [];
        }

        const suggestions = new Set();
        
        data.forEach(result => {
            const areaName = this.extractAreaName(result, province);
            if (areaName && areaName.toLowerCase().includes(areaPrefix.toLowerCase())) {
                suggestions.add(areaName);
            }
        });

        return Array.from(suggestions).slice(0, 8);
    }

    /**
     * Extract area name from geocoding result
     * @param {any} result 
     * @param {string} province 
     * @returns {string}
     */
    extractAreaName(result, province) {
        const displayName = result.display_name || '';
        const parts = displayName.split(',');
        
        for (let part of parts) {
            const trimmed = part.trim();
            if (trimmed && !trimmed.includes(province) && !trimmed.includes('South Africa')) {
                return trimmed;
            }
        }
        
        return parts[0]?.trim() || '';
    }

    /**
     * Get data from persistent cache
     * @param {string} cacheType 
     * @param {string} key 
     * @returns {Promise<any>}
     */
    async getFromPersistentCache(cacheType, key) {
        if (!this.persistentCacheEnabled || !this.cacheStorage) return null;
        
        try {
            const url = this.cacheKeyToUrl(cacheType, key);
            const response = await this.cacheStorage.match(url);
            if (response) {
                /** @type {CacheEntry} */
                const cacheEntry = await response.json();
                
                if (this.isCacheEntryExpired(cacheEntry)) {
                    await this.cacheStorage.delete(url);
                    return null;
                }
                
                return cacheEntry.data;
            }
        } catch (error) {
            console.warn('Persistent cache read failed:', error);
        }
        return null;
    }

    /**
     * Save data to persistent cache
     * @param {string} cacheType 
     * @param {string} key 
     * @param {any} data 
     */
    async saveToPersistentCache(cacheType, key, data) {
        if (!this.persistentCacheEnabled || !this.cacheStorage) return;
        
        try {
            const url = this.cacheKeyToUrl(cacheType, key);
            /** @type {CacheEntry} */
            const cacheEntry = {
                data: data,
                timestamp: Date.now(),
                expiry: Date.now() + (this.cacheExpiryHours * 60 * 60 * 1000)
            };
            
            const response = new Response(JSON.stringify(cacheEntry));
            await this.cacheStorage.put(url, response);
        } catch (error) {
            console.warn('Persistent cache write failed:', error);
        }
    }

    /**
     * Convert cache key to URL for Cache API
     * @param {string} cacheType 
     * @param {string} key 
     * @returns {string}
     */
    cacheKeyToUrl(cacheType, key) {
        return `https://cache.geocoding/${cacheType}_${encodeURIComponent(key)}`;
    }

    /**
     * Convert URL back to cache key
     * @param {string} url 
     * @returns {string}
     */
    urlToCacheKey(url) {
        return decodeURIComponent(url.replace('https://cache.geocoding/', ''));
    }

    /**
     * Clean location string for better geocoding results
     * @param {string} location 
     * @returns {string}
     */
    cleanLocationString(location) {
        if (!location) return '';
        
        let clean = location.trim();
        if (!clean.toLowerCase().includes('south africa') && !clean.toLowerCase().includes('za')) {
            clean += ', South Africa';
        }
        
        return clean;
    }

    /**
     * Generate service areas based on location
     * @param {string} location 
     * @returns {string[]}
     */
    generateServiceAreas(location) {
        if (!location) return [];
        const parts = location.split(',').map(part => part.trim());
        return parts.slice(0, 2).filter(area => area && !area.toLowerCase().includes('south africa'));
    }

    /**
     * Clear all caches
     * @returns {Promise<void>}
     */
    async clearCache() {
        // Clear memory caches
        this.cache.clear();
        this.areaSuggestionsCache.clear();
        this.clearDebounceTimeouts();
        
        // Clear persistent cache
        if (this.persistentCacheEnabled && this.cacheStorage) {
            const requests = await this.cacheStorage.keys();
            for (const request of requests) {
                await this.cacheStorage.delete(request);
            }
        }
        
        console.log('🗑️ All caches cleared');
    }

    /**
     * Clear specific caches
     * @param {string} [province] - If provided, only clear caches for this province
     */
    clearAreaSuggestionsCache(province = null) {
        if (province) {
            const keysToDelete = [];
            for (let key of this.areaSuggestionsCache.keys()) {
                if (key.startsWith(province.toLowerCase())) {
                    keysToDelete.push(key);
                }
            }
            keysToDelete.forEach(key => this.areaSuggestionsCache.delete(key));
        } else {
            this.areaSuggestionsCache.clear();
        }
    }

    /**
     * Clear debounce timeouts
     */
    clearDebounceTimeouts() {
        for (let timeoutId of this.debounceTimeouts.values()) {
            clearTimeout(timeoutId);
        }
        this.debounceTimeouts.clear();
    }

    /**
     * Enable/disable geocoding service
     * @param {boolean} enabled 
     */
    setGeocodingEnabled(enabled) {
        this.useGeocoding = enabled;
    }

    /**
     * Set cache expiry time
     * @param {number} hours 
     */
    setCacheExpiry(hours) {
        this.cacheExpiryHours = hours;
    }

    /**
     * Get cache statistics
     * @returns {Object}
     */
    getCacheStats() {
        return {
            memory: {
                geocoding: this.cache.size,
                suggestions: this.areaSuggestionsCache.size
            },
            persistent: this.persistentCacheEnabled,
            expiryHours: this.cacheExpiryHours
        };
    }
}

// Export singleton instance
export const geocodingService = new GeocodingService();