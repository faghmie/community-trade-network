// js/modules/mapManager.js
/**
 * Map Manager - Handles interactive map display of contractors with Material Design
 */
class MapManager {
    constructor() {
        this.map = null;
        this.markers = [];
        this.currentBounds = null;
        this.isMapView = false;
        this.contractors = [];
        this.initialized = false;
        this.allContractors = []; // Store all contractors separately
        this.mapLoadAttempts = 0;
        this.maxMapLoadAttempts = 5;
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

        // Initialize map immediately but don't show it yet
        this.initializeMap();
        
        // Set up event listeners
        this.setupEventListeners();
    }

    createMapContainer() {
        const mapContainer = document.createElement('div');
        mapContainer.id = 'map-container';
        mapContainer.className = 'map-container material-card hidden';
        
        const mapSection = document.querySelector('.map-section');
        if (mapSection) {
            mapSection.appendChild(mapContainer);
        }
    }

    initializeMap() {
        const mapContainer = document.getElementById('map-container');
        if (!mapContainer) {
            console.warn('Map container not found');
            return false;
        }

        // Check if map is already initialized
        if (this.map) {
            return true;
        }

        // Check if container already has a map instance
        if (mapContainer._leaflet_id) {
            return true;
        }

        // Default to center of South Africa if no contractors
        const defaultCenter = [-28.4793, 24.6727]; // Center of South Africa
        const defaultZoom = 5;

        try {
            // Check if Leaflet is available
            if (typeof L === 'undefined') {
                console.warn('Leaflet not loaded yet, retrying...');
                this.mapLoadAttempts++;
                if (this.mapLoadAttempts < this.maxMapLoadAttempts) {
                    setTimeout(() => this.initializeMap(), 500);
                }
                return false;
            }

            this.map = L.map('map-container', {
                zoomControl: false,
                attributionControl: true,
                fadeAnimation: true,
                zoomAnimation: true
            }).setView(defaultCenter, defaultZoom);

            // Add zoom control to bottom right with Material Design styling
            L.control.zoom({
                position: 'bottomright'
            }).addTo(this.map);

            // Add tile layer with slightly muted colors for better Material Design integration
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18
            }).addTo(this.map);

            // Add custom CSS for Material Design styling
            this.addMaterialDesignStyles();

            this.initialized = true;
            
            // Load all contractors immediately after map initialization
            this.loadAllContractors();
            return true;
        } catch (error) {
            console.error('Failed to initialize map:', error);
            
            this.mapLoadAttempts++;
            if (this.mapLoadAttempts < this.maxMapLoadAttempts) {
                setTimeout(() => this.initializeMap(), 1000);
            }
            return false;
        }
    }

    // Add Material Design styles for map elements
    addMaterialDesignStyles() {
        // Create style element for custom Material Design styling
        const style = document.createElement('style');
        style.textContent = `
            /* Material Design Map Styles */
            .leaflet-popup-content-wrapper {
                background: var(--surface) !important;
                color: var(--text-primary) !important;
                border-radius: var(--border-radius-md) !important;
                box-shadow: var(--elevation-3) !important;
                border: 1px solid var(--border-color);
                font-family: var(--font-family) !important;
            }

            .leaflet-popup-tip {
                background: var(--surface) !important;
                border: 1px solid var(--border-color) !important;
            }

            .leaflet-popup-content {
                margin: 0 !important;
                line-height: inherit !important;
                font-family: var(--font-family) !important;
            }

            /* Material Design Marker Styles */
            .custom-marker {
                background: transparent !important;
                border: none !important;
            }

            .marker-container {
                position: relative;
                width: 40px;
                height: 40px;
                background: var(--surface);
                border: 3px solid;
                border-radius: var(--border-radius-full);
                box-shadow: var(--elevation-2);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all var(--transition-standard);
                cursor: pointer;
            }

            .marker-container:hover {
                transform: scale(1.1);
                box-shadow: var(--elevation-4);
            }

            .marker-rating {
                color: var(--text-on-primary);
                font-size: var(--font-size-sm);
                font-weight: var(--font-weight-bold);
                padding: 2px 6px;
                border-radius: var(--border-radius-full);
                line-height: 1;
                min-width: 24px;
                text-align: center;
                box-shadow: var(--elevation-1);
            }

            /* Material Design Popup Styles */
            .map-popup {
                padding: var(--space-md);
                min-width: 200px;
                font-family: var(--font-family);
            }

            .map-popup h3 {
                margin: 0 0 var(--space-sm) 0;
                font-size: var(--font-size-h6);
                font-weight: var(--font-weight-medium);
                color: var(--text-primary);
                line-height: var(--line-height-tight);
            }

            .popup-rating {
                display: flex;
                align-items: center;
                gap: var(--space-sm);
                margin-bottom: var(--space-sm);
            }

            .rating-stars {
                color: var(--warning-500);
                font-size: var(--font-size-lg);
                letter-spacing: -1px;
            }

            .rating-value {
                font-size: var(--font-size-body2);
                font-weight: var(--font-weight-medium);
                color: var(--text-secondary);
                background: var(--surface-variant);
                padding: 2px 6px;
                border-radius: var(--border-radius-sm);
            }

            .popup-categories {
                margin: 0 0 var(--space-sm) 0;
                font-size: var(--font-size-sm);
                color: var(--text-secondary);
                line-height: var(--line-height-tight);
            }

            .popup-reviews {
                margin: 0 0 var(--space-md) 0;
                font-size: var(--font-size-sm);
                color: var(--text-secondary);
                font-weight: var(--font-weight-medium);
            }

            .popup-actions {
                display: flex;
                gap: var(--space-sm);
                margin-top: var(--space-md);
            }

            /* Material Design Button in Popup */
            .view-details-btn {
                background: var(--primary-color) !important;
                color: var(--text-on-primary) !important;
                border: none !important;
                border-radius: var(--border-radius-sm) !important;
                padding: var(--space-sm) var(--space-md) !important;
                font-size: var(--font-size-sm) !important;
                font-weight: var(--font-weight-medium) !important;
                text-transform: none !important;
                letter-spacing: 0.25px !important;
                box-shadow: var(--elevation-1) !important;
                transition: all var(--transition-standard) !important;
                cursor: pointer !important;
                width: 100% !important;
                text-align: center !important;
            }

            .view-details-btn:hover {
                background: var(--primary-color-dark) !important;
                box-shadow: var(--elevation-2) !important;
                transform: translateY(-1px);
            }

            /* Material Design Controls */
            .leaflet-control-zoom a {
                background: var(--surface) !important;
                color: var(--text-primary) !important;
                border: 1px solid var(--border-color) !important;
                border-radius: var(--border-radius-sm) !important;
                box-shadow: var(--elevation-1) !important;
                transition: all var(--transition-standard) !important;
            }

            .leaflet-control-zoom a:hover {
                background: var(--surface-variant) !important;
                box-shadow: var(--elevation-2) !important;
            }

            .leaflet-control-attribution {
                background: var(--surface) !important;
                color: var(--text-secondary) !important;
                border: 1px solid var(--border-color) !important;
                border-radius: var(--border-radius-sm) !important;
                font-size: var(--font-size-xs) !important;
            }

            /* Dark theme support for map */
            @media (prefers-color-scheme: dark) {
                .leaflet-control-zoom a {
                    background: var(--surface-800) !important;
                    border-color: var(--border-color) !important;
                }

                .leaflet-control-attribution {
                    background: var(--surface-800) !important;
                    border-color: var(--border-color) !important;
                }

                .marker-container {
                    background: var(--surface-800);
                }
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        // Setup view toggle button click handlers
        this.setupViewToggleButtons();

        // Listen for contractor data updates
        document.addEventListener('contractorsUpdated', (event) => {
            this.allContractors = event.detail.contractors || this.allContractors;
            if (this.isMapView) {
                this.updateMapMarkers();
            }
        });

        // Listen for filter changes to update visible markers
        document.addEventListener('filtersApplied', (event) => {
            this.contractors = event.detail.contractors || this.allContractors;
            this.updateMapMarkers();
        });

        // Listen for data module initialization
        document.addEventListener('dataModuleInitialized', () => {
            this.loadAllContractors();
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

        // Listen for window resize events
        window.addEventListener('resize', () => {
            if (this.isMapView && this.map) {
                setTimeout(() => {
                    this.map.invalidateSize();
                }, 100);
            }
        });

        // Listen for theme changes to update map styling
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (this.isMapView) {
                this.updateMapMarkers();
            }
        });

        // FIXED: Listen for view toggle events from filterManager
        document.addEventListener('viewToggle', (event) => {
            const view = event.detail.view;
            this.isMapView = view === 'map';
            this.toggleViewVisibility();
        });
    }

    // FIXED: Setup view toggle button click handlers for compact filters
    setupViewToggleButtons() {
        const viewToggle = document.getElementById('view-toggle');
        
        if (viewToggle) {
            viewToggle.addEventListener('click', (e) => {
                const button = e.target.closest('.btn');
                if (button && button.hasAttribute('data-view')) {
                    this.handleViewToggle(button);
                }
            });

            // Set initial active state - list view should be active by default
            this.setInitialViewState();
        }
    }

    // FIXED: Set initial view state for compact filters
    setInitialViewState() {
        const viewToggleBtns = document.querySelectorAll('#view-toggle .btn');
        const listViewBtn = document.querySelector('#view-toggle .btn[data-view="list"]');
        
        if (listViewBtn) {
            // Set list view as active by default
            viewToggleBtns.forEach(btn => btn.classList.remove('active'));
            listViewBtn.classList.add('active');
            this.isMapView = false;
        }
    }

    // FIXED: Handle view toggle changes with compact filter compatibility
    handleViewToggle(button) {
        const view = button.getAttribute('data-view');
        
        if (!view) return;

        // Get fresh reference to buttons
        const viewToggleBtns = document.querySelectorAll('#view-toggle .btn');
        
        if (!viewToggleBtns || viewToggleBtns.length === 0) {
            return;
        }

        // Remove active class from ALL buttons first
        viewToggleBtns.forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active class only to the clicked button
        button.classList.add('active');

        // Update view state
        this.isMapView = view === 'map';

        // Toggle visibility based on view
        this.toggleViewVisibility();

        // Dispatch event for other components
        document.dispatchEvent(new CustomEvent('viewToggle', {
            detail: { view }
        }));
    }

    // FIXED: Toggle visibility between map and list views with correct selectors
    toggleViewVisibility() {
        const mapContainer = document.getElementById('map-container');
        const contractorList = document.getElementById('contractorList');
        const favoritesSection = document.getElementById('favoritesSection');
        
        if (!mapContainer || !contractorList) {
            return;
        }

        if (this.isMapView) {
            // Show map, hide list and favorites
            mapContainer.classList.remove('hidden');
            contractorList.classList.add('hidden');
            if (favoritesSection) {
                favoritesSection.classList.add('hidden');
            }
            
            // Ensure map is properly initialized and updated
            this.handleMapViewActivation();
        } else {
            // Show list, hide map
            mapContainer.classList.add('hidden');
            contractorList.classList.remove('hidden');
            // Favorites section visibility is managed by favoritesManager
        }
    }

    // Handle map view activation
    handleMapViewActivation() {
        // Ensure map is properly initialized
        if (!this.initialized) {
            const initialized = this.initializeMap();
            if (!initialized) {
                return;
            }
        }
        
        // Use all contractors when switching to map view
        this.contractors = this.allContractors;
        
        // Invalidate map size and update markers with proper timing
        setTimeout(() => {
            if (this.map) {
                this.map.invalidateSize();
                
                setTimeout(() => {
                    this.updateMapMarkers();
                    
                    setTimeout(() => {
                        this.map.invalidateSize();
                    }, 50);
                }, 50);
            }
        }, 100);
    }

    // Load all contractors from data module
    loadAllContractors() {
        if (typeof dataModule !== 'undefined') {
            this.allContractors = dataModule.getContractors();
            this.contractors = this.allContractors;
            if (this.isMapView) {
                this.updateMapMarkers();
            }
        } else {
            setTimeout(() => this.loadAllContractors(), 100);
        }
    }

    handlePopupButtonClick(contractorId) {
        document.dispatchEvent(new CustomEvent('mapMarkerClick', {
            detail: { contractorId }
        }));
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
            setTimeout(() => {
                if (this.map) {
                    this.map.fitBounds(bounds, { 
                        padding: [20, 20],
                        maxZoom: 15
                    });
                }
            }, 150);
        } else if (hasValidLocations && !bounds) {
            const group = new L.featureGroup(this.markers);
            setTimeout(() => {
                if (this.map) {
                    this.map.fitBounds(group.getBounds(), { 
                        padding: [20, 20],
                        maxZoom: 15
                    });
                }
            }, 150);
        } else {
            setTimeout(() => {
                if (this.map) {
                    this.map.invalidateSize();
                }
            }, 100);
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
        
        // Create custom marker icon with Material Design styling
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
        if (rating >= 4.5) return '#22c55e';
        if (rating >= 4.0) return '#4ade80';
        if (rating >= 3.5) return '#f59e0b';
        if (rating >= 3.0) return '#f97316';
        return '#ef4444';
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
                <div class="popup-actions">
                    <button class="view-details-btn" 
                            data-contractor-id="${contractor.id}">
                        View Details
                    </button>
                </div>
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
        this.contractors = contractors || this.allContractors;
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

    // Force refresh map - useful for when map doesn't show initially
    forceRefresh() {
        if (this.map) {
            setTimeout(() => {
                this.map.invalidateSize(true);
                if (this.contractors.length > 0) {
                    this.updateMapMarkers();
                }
            }, 200);
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