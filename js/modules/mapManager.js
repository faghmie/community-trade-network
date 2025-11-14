// js/modules/mapManager.js
/**
 * Map Manager - Handles interactive map display of contractors
 */
class MapManager {
    constructor() {
        this.map = null;
        this.markers = [];
        this.currentBounds = null;
        this.isMapView = false;
        this.contractors = [];
        this.initialized = false;
        this.init();
    }

    init() {
        // Load Leaflet CSS if not already loaded
        this.loadLeafletCSS();
        
        // Initialize map when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupMap());
        } else {
            this.setupMap();
        }
    }

    loadLeafletCSS() {
        if (!document.querySelector('link[href*="leaflet"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
            link.crossOrigin = '';
            document.head.appendChild(link);
        }
    }

    setupMap() {
        // Create map container if it doesn't exist
        if (!document.getElementById('map-container')) {
            this.createMapContainer();
        }

        // Initialize map only once
        if (!this.initialized) {
            this.initializeMap();
        }
        
        // Set up event listeners
        this.setupEventListeners();
    }

    createMapContainer() {
        const mapContainer = document.createElement('div');
        mapContainer.id = 'map-container';
        mapContainer.className = 'map-container hidden';
        
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.appendChild(mapContainer);
        }
    }

    initializeMap() {
        const mapContainer = document.getElementById('map-container');
        if (!mapContainer) {
            console.warn('Map container not found');
            return;
        }

        // Check if map is already initialized
        if (this.map) {
            console.log('Map already initialized');
            return;
        }

        // Check if container already has a map instance
        if (mapContainer._leaflet_id) {
            console.log('Map container already has a Leaflet instance');
            return;
        }

        // Default to center of South Africa if no contractors
        const defaultCenter = [-28.4793, 24.6727]; // Center of South Africa
        const defaultZoom = 5;

        try {
            // Check if Leaflet is available
            if (typeof L === 'undefined') {
                console.warn('Leaflet not loaded yet, retrying...');
                setTimeout(() => this.initializeMap(), 500);
                return;
            }

            this.map = L.map('map-container').setView(defaultCenter, defaultZoom);

            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18
            }).addTo(this.map);

            this.initialized = true;
            console.log('Map initialized successfully');
        } catch (error) {
            console.error('Failed to initialize map:', error);
            
            // Don't retry indefinitely - mark as failed after 3 attempts
            if (!this.retryCount) {
                this.retryCount = 1;
                setTimeout(() => this.initializeMap(), 1000);
            } else if (this.retryCount < 3) {
                this.retryCount++;
                setTimeout(() => this.initializeMap(), 1000);
            } else {
                console.error('Failed to initialize map after multiple attempts');
            }
        }
    }

    setupEventListeners() {
        // Listen for view toggle events
        document.addEventListener('viewToggle', (event) => {
            this.isMapView = event.detail.view === 'map';
            this.toggleMapVisibility();
        });

        // Listen for contractor data updates
        document.addEventListener('contractorsUpdated', (event) => {
            this.contractors = event.detail.contractors;
            this.updateMapMarkers();
        });

        // Listen for filter changes to update visible markers
        document.addEventListener('filtersApplied', (event) => {
            this.contractors = event.detail.contractors || this.contractors;
            this.updateMapMarkers();
        });

        // Handle popup button clicks
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('view-details-btn')) {
                const contractorId = event.target.getAttribute('data-contractor-id');
                if (contractorId) {
                    this.handlePopupButtonClick(contractorId);
                }
            }
        });
    }

    handlePopupButtonClick(contractorId) {
        // Dispatch event to open contractor modal
        document.dispatchEvent(new CustomEvent('mapMarkerClick', {
            detail: { contractorId }
        }));
    }

    toggleMapVisibility() {
        const mapContainer = document.getElementById('map-container');
        const contractorGrid = document.getElementById('contractor-grid');
        
        if (!mapContainer || !contractorGrid) return;

        if (this.isMapView) {
            mapContainer.classList.remove('hidden');
            contractorGrid.classList.add('hidden');
            
            // Ensure map is properly initialized and sized
            if (!this.initialized) {
                this.initializeMap();
            }
            
            this.updateMapMarkers();
            
            // Trigger map resize after a brief delay to ensure container is visible
            setTimeout(() => {
                if (this.map) {
                    this.map.invalidateSize();
                }
            }, 100);
        } else {
            mapContainer.classList.add('hidden');
            contractorGrid.classList.remove('hidden');
        }
    }

    updateMapMarkers() {
        // Clear existing markers
        this.clearMarkers();

        if (!this.map || !this.contractors || this.contractors.length === 0) {
            return;
        }

        const bounds = L.latLngBounds ? new L.latLngBounds() : null;
        let hasValidLocations = false;

        this.contractors.forEach(contractor => {
            const location = this.extractLocation(contractor);
            if (location) {
                this.addContractorMarker(contractor, location);
                if (bounds) {
                    bounds.extend([location.lat, location.lng]);
                }
                hasValidLocations = true;
            }
        });

        // Fit map to show all markers if we have valid locations
        if (hasValidLocations && bounds && bounds.isValid()) {
            this.map.fitBounds(bounds, { padding: [20, 20] });
        } else if (hasValidLocations && !bounds) {
            // Fallback for older Leaflet versions
            const group = new L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds(), { padding: [20, 20] });
        }
    }

    extractLocation(contractor) {
        // First try to use direct coordinates if available
        if (contractor.coordinates && Array.isArray(contractor.coordinates)) {
            return { 
                lat: contractor.coordinates[0], 
                lng: contractor.coordinates[1] 
            };
        }

        // Try to extract location from various possible fields
        const locationData = contractor.location || contractor.address || contractor.serviceAreas;
        
        if (!locationData) {
            return null;
        }

        // Use the enhanced geocoding with South African cities
        const coordinates = this.simulateGeocoding(locationData);
        return coordinates ? { lat: coordinates[0], lng: coordinates[1] } : null;
    }

    simulateGeocoding(location) {
        // Convert location to lowercase for matching
        const locationLower = location.toLowerCase();
        
        // Check against our South African city coordinates first
        for (const [city, coords] of Object.entries(southAfricanCityCoordinates)) {
            if (locationLower.includes(city)) {
                return coords;
            }
        }

        // Fallback: generate random coordinates within South Africa bounds
        const southAfricaBounds = {
            north: -22.1250,
            south: -34.8333,
            east: 32.8917,
            west: 16.4583
        };
        
        return [
            southAfricaBounds.south + Math.random() * (southAfricaBounds.north - southAfricaBounds.south),
            southAfricaBounds.west + Math.random() * (southAfricaBounds.east - southAfricaBounds.west)
        ];
    }

    addContractorMarker(contractor, location) {
        if (!this.map || typeof L === 'undefined') return;

        const rating = contractor.overallRating || contractor.rating || 0;
        const ratingColor = this.getRatingColor(rating);
        
        // Create custom marker icon based on rating
        const markerIcon = L.divIcon({
            className: 'custom-marker',
            html: `
                <div class="marker-container" style="border-color: ${ratingColor}">
                    <div class="marker-rating" style="background: ${ratingColor}">
                        ${rating.toFixed(1)}
                    </div>
                </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 40]
        });

        const marker = L.marker([location.lat, location.lng], { icon: markerIcon })
            .addTo(this.map)
            .bindPopup(this.createPopupContent(contractor));

        // Add click event to marker
        marker.on('click', () => {
            document.dispatchEvent(new CustomEvent('mapMarkerClick', {
                detail: { contractorId: contractor.id }
            }));
        });

        this.markers.push(marker);
    }

    getRatingColor(rating) {
        if (rating >= 4.5) return '#22c55e'; // Green
        if (rating >= 4.0) return '#84cc16'; // Lime
        if (rating >= 3.5) return '#eab308'; // Yellow
        if (rating >= 3.0) return '#f97316'; // Orange
        return '#ef4444'; // Red
    }

    createPopupContent(contractor) {
        const categories = contractor.categories || [contractor.category];
        let categoryNames = 'No categories';
        
        if (categories && categories.length > 0) {
            categoryNames = Array.isArray(categories) ? categories.join(', ') : categories;
        }

        return `
            <div class="map-popup">
                <h3>${contractor.name}</h3>
                <div class="popup-rating">
                    <span class="rating-stars">${this.generateStarRating(contractor.overallRating || contractor.rating || 0)}</span>
                    <span class="rating-value">${(contractor.overallRating || contractor.rating || 0).toFixed(1)}</span>
                </div>
                <p class="popup-categories">${categoryNames}</p>
                <p class="popup-reviews">${contractor.reviewCount || (contractor.reviews ? contractor.reviews.length : 0)} reviews</p>
                <button class="btn btn-primary btn-sm view-details-btn" 
                        data-contractor-id="${contractor.id}">
                    View Details
                </button>
            </div>
        `;
    }

    generateStarRating(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        return '★'.repeat(fullStars) + 
               (hasHalfStar ? '½' : '') + 
               '☆'.repeat(emptyStars);
    }

    clearMarkers() {
        if (!this.map) return;
        
        this.markers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.markers = [];
    }

    // Public method to update contractors from external calls
    updateContractors(contractors) {
        this.contractors = contractors || [];
        this.updateMapMarkers();
    }

    // Method to handle map resize
    invalidateSize() {
        if (this.map) {
            setTimeout(() => {
                this.map.invalidateSize();
            }, 100);
        }
    }

    // Check if map is ready
    isReady() {
        return this.initialized && this.map !== null;
    }

    // Clean up method
    destroy() {
        this.clearMarkers();
        if (this.map) {
            this.map.remove();
            this.map = null;
            this.initialized = false;
        }
    }
}