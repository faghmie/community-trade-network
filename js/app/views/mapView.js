// js/app/views/mapView.js
// ES6 Module for map view management - Self-contained with HTML

export class MapView {
    constructor(dataModule) {
        this.dataModule = dataModule;
        this.container = null;
        this.viewId = 'map-container';
        this.map = null;
        this.markers = [];
        this.markerClusters = null;
        this.contractors = [];
        this.isRendered = false;
        this.isVisible = false;
        this.mapInitialized = false;
        
        this.initializeEventListeners();
    }

    /**
     * Initialize event listeners for the map view
     */
    initializeEventListeners() {
        // Listen for requests to show map view
        document.addEventListener('showMapView', () => {
            this.show();
        });

        // Listen for requests to hide map view
        document.addEventListener('hideMapView', () => {
            this.hide();
        });

        // Listen for contractor updates to refresh map
        document.addEventListener('contractorsUpdated', () => {
            if (this.isRendered && this.isVisible) {
                this.updateContractors(this.dataModule.getContractors());
            }
        });

        // Listen for filtered contractors to update map
        document.addEventListener('contractorsListUpdate', (event) => {
            if (this.isRendered && this.isVisible) {
                this.updateContractors(event.detail.contractors);
            }
        });

        // Listen for app initialization
        document.addEventListener('appInitialized', () => {
            if (!this.isRendered) {
                this.render();
            }
        });
    }

    /**
     * Render the map view
     */
    async render() {
        this.container = document.getElementById(this.viewId);
        if (!this.container) {
            this.createMapContainer();
        }

        this.loadLeafletCSS();
        this.loadLeafletMarkerClusterCSS();
        
        // Initialize map after CSS is loaded
        await this.initializeMap();

        this.isRendered = true;
        
        // Dispatch event that map view is ready
        document.dispatchEvent(new CustomEvent('mapViewRendered'));
    }

    /**
     * Create map container if it doesn't exist
     */
    createMapContainer() {
        const mapContainer = document.createElement('div');
        mapContainer.id = this.viewId;
        mapContainer.className = 'map-container material-card hidden';
        
        const mainContainer = document.getElementById('mainViewContainer');
        if (mainContainer) {
            mainContainer.appendChild(mapContainer);
        } else {
            document.body.appendChild(mapContainer);
        }
        
        this.container = mapContainer;
    }

    /**
     * Initialize the Leaflet map
     */
    async initializeMap() {
        if (!this.container || this.mapInitialized) return;

        try {
            // Load Leaflet JS if not available
            if (typeof L === 'undefined') {
                await this.loadLeafletJS();
            }

            // Load MarkerCluster JS if not available
            if (typeof L.markerClusterGroup === 'undefined') {
                await this.loadLeafletMarkerClusterJS();
            }

            this.createMap();
            this.mapInitialized = true;
            
        } catch (error) {
            console.error('Failed to initialize map:', error);
        }
    }

    /**
     * Create the actual Leaflet map
     */
    createMap() {
        if (!this.container) return;

        const defaultCenter = [-28.4793, 24.6727]; // Center of South Africa
        const defaultZoom = 5;

        try {
            this.map = L.map(this.viewId, {
                zoomControl: false,
                attributionControl: true,
                fadeAnimation: true,
                zoomAnimation: true
            }).setView(defaultCenter, defaultZoom);

            // Add zoom control
            L.control.zoom({
                position: 'bottomright'
            }).addTo(this.map);

            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18
            }).addTo(this.map);

            // Initialize marker clusters
            this.initializeMarkerClusters();

            // Load initial contractors
            this.loadContractors();

        } catch (error) {
            console.error('Failed to create map:', error);
        }
    }

    /**
     * Initialize marker cluster groups
     */
    initializeMarkerClusters() {
        if (typeof L.markerClusterGroup === 'undefined') {
            console.warn('MarkerClusterGroup not available - markers will be added directly to map');
            return;
        }

        this.markerClusters = L.markerClusterGroup({
            chunkedLoading: true,
            maxClusterRadius: 50,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: true,
            zoomToBoundsOnClick: true,
            iconCreateFunction: this.createClusterIcon.bind(this)
        });

        this.map.addLayer(this.markerClusters);
    }

    /**
     * Create custom cluster icons
     */
    createClusterIcon(cluster) {
        const count = cluster.getChildCount();
        const contractors = cluster.getAllChildMarkers().map(marker => marker.contractor);
        
        let ratingClass = 'low-rated';
        const avgRating = contractors.reduce((sum, c) => sum + (c.overallRating || c.rating || 0), 0) / contractors.length;
        
        if (avgRating >= 4.0) ratingClass = 'high-rated';
        else if (avgRating >= 3.0) ratingClass = 'medium-rated';

        return L.divIcon({
            html: `<div class="marker-cluster ${ratingClass}">${count}</div>`,
            className: 'marker-cluster-custom',
            iconSize: L.point(40, 40)
        });
    }

    /**
     * Load Leaflet CSS
     */
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

    /**
     * Load Leaflet Marker Cluster CSS
     */
    loadLeafletMarkerClusterCSS() {
        if (!document.querySelector('link[href*="leaflet.markercluster"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';
            link.crossOrigin = '';
            document.head.appendChild(link);
            
            const linkDefault = document.createElement('link');
            linkDefault.rel = 'stylesheet';
            linkDefault.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css';
            linkDefault.crossOrigin = '';
            document.head.appendChild(linkDefault);
        }
    }

    /**
     * Load Leaflet JS
     */
    loadLeafletJS() {
        return new Promise((resolve, reject) => {
            if (typeof L !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
            script.crossOrigin = '';
            script.onload = () => {
                console.log('✅ Leaflet JS loaded successfully');
                resolve();
            };
            script.onerror = () => {
                console.error('❌ Failed to load Leaflet JS');
                reject(new Error('Failed to load Leaflet JS'));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Load Leaflet Marker Cluster JS
     */
    loadLeafletMarkerClusterJS() {
        return new Promise((resolve, reject) => {
            if (typeof L.markerClusterGroup !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';
            script.crossOrigin = '';
            script.onload = () => {
                console.log('✅ Leaflet MarkerCluster JS loaded successfully');
                resolve();
            };
            script.onerror = () => {
                console.warn('⚠️ Failed to load Leaflet MarkerCluster JS - markers will work without clustering');
                resolve(); // Resolve anyway so map can still work
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Load contractors from data module
     */
    loadContractors() {
        if (this.dataModule && typeof this.dataModule.getContractors === 'function') {
            const contractors = this.dataModule.getContractors();
            if (contractors && contractors.length > 0) {
                this.updateContractors(contractors);
            }
        }
    }

    /**
     * Update contractors on the map - only show contractors with valid coordinates
     */
    updateContractors(contractors) {
        this.contractors = contractors || [];
        this.clearMarkers();

        if (!this.map || this.contractors.length === 0) {
            return;
        }

        // Only process contractors that have valid coordinates
        const contractorsWithCoordinates = this.contractors.filter(contractor => 
            this.hasValidCoordinates(contractor)
        );

        if (contractorsWithCoordinates.length === 0) {
            console.log('No contractors with valid coordinates to display on map');
            return;
        }

        this.addContractorMarkers(contractorsWithCoordinates);
        this.fitMapToMarkers();
    }

    /**
     * Check if contractor has valid coordinates
     */
    hasValidCoordinates(contractor) {
        if (!contractor.coordinates) return false;

        const coordinates = this.normalizeCoordinates(contractor.coordinates);
        if (!coordinates) return false;

        // Validate coordinate ranges for South Africa
        const { lat, lng } = coordinates;
        return (
            typeof lat === 'number' && 
            typeof lng === 'number' &&
            lat >= -35 && lat <= -22 && // South Africa latitude range
            lng >= 16 && lng <= 33     // South Africa longitude range
        );
    }

    /**
     * Add multiple contractor markers to the map
     */
    addContractorMarkers(contractors) {
        contractors.forEach(contractor => {
            const coordinates = this.normalizeCoordinates(contractor.coordinates);
            if (coordinates) {
                this.addContractorMarker(contractor, coordinates);
            }
        });
    }

    /**
     * Normalize coordinates to consistent format
     */
    normalizeCoordinates(coordinates) {
        if (!coordinates) return null;

        if (coordinates.lat !== undefined && coordinates.lng !== undefined) {
            return { 
                lat: coordinates.lat, 
                lng: coordinates.lng 
            };
        }

        if (Array.isArray(coordinates) && coordinates.length === 2) {
            return { 
                lat: coordinates[0], 
                lng: coordinates[1] 
            };
        }

        return null;
    }

    /**
     * Add contractor marker to map
     */
    addContractorMarker(contractor, location) {
        if (!this.map || typeof L === 'undefined') return;

        const rating = contractor.overallRating || contractor.rating || 0;
        const ratingClass = this.getRatingClass(rating);
        
        const markerIcon = L.divIcon({
            className: 'custom-marker',
            html: `
                <div class="marker-container ${ratingClass}">
                    <div class="marker-rating">
                        ${rating.toFixed(1)}
                    </div>
                </div>
            `,
            iconSize: [48, 48],
            iconAnchor: [24, 48]
        });

        const marker = L.marker([location.lat, location.lng], { icon: markerIcon });
        marker.contractor = contractor;

        // Handle marker click to show contractor details
        marker.on('click', () => {
            this.map.closePopup();
            document.dispatchEvent(new CustomEvent('mapMarkerClick', {
                detail: { contractorId: contractor.id }
            }));
        });

        this.markers.push(marker);
        
        if (this.markerClusters) {
            this.markerClusters.addLayer(marker);
        } else {
            marker.addTo(this.map);
        }
    }

    /**
     * Fit map to show all markers
     */
    fitMapToMarkers() {
        if (this.markers.length === 0 || !this.map) return;

        if (this.markerClusters && this.markerClusters.getLayers().length > 0) {
            setTimeout(() => {
                this.map.fitBounds(this.markerClusters.getBounds(), { 
                    padding: [20, 20],
                    maxZoom: 15
                });
            }, 150);
        } else if (this.markers.length > 0) {
            const group = new L.featureGroup(this.markers);
            setTimeout(() => {
                this.map.fitBounds(group.getBounds(), { 
                    padding: [20, 20],
                    maxZoom: 15
                });
            }, 150);
        }
    }

    /**
     * Get rating class for styling
     */
    getRatingClass(rating) {
        if (rating >= 4.0) return 'high-rated';
        if (rating >= 3.0) return 'medium-rated';
        return 'low-rated';
    }

    /**
     * Clear all markers from map
     */
    clearMarkers() {
        if (this.markerClusters) {
            this.markerClusters.clearLayers();
        }
        
        this.markers.forEach(marker => {
            if (this.map) {
                this.map.removeLayer(marker);
            }
        });
        this.markers = [];
    }

    /**
     * Show the map view
     */
    show() {
        if (!this.isRendered) {
            this.render();
        }

        if (this.container) {
            this.container.classList.remove('hidden');
            this.isVisible = true;
            
            // Ensure map is properly sized when shown
            setTimeout(() => {
                if (this.map) {
                    this.map.invalidateSize();
                }
            }, 100);
        }
    }

    /**
     * Hide the map view
     */
    hide() {
        if (this.container) {
            this.container.classList.add('hidden');
            this.isVisible = false;
        }
    }

    /**
     * Refresh map size
     */
    refreshMap() {
        if (this.map) {
            setTimeout(() => {
                this.map.invalidateSize();
            }, 100);
        }
    }

    /**
     * Force refresh of map and markers
     */
    forceRefresh() {
        if (this.map) {
            setTimeout(() => {
                this.map.invalidateSize(true);
                if (this.contractors.length > 0) {
                    this.updateContractors(this.contractors);
                }
            }, 200);
        }
    }

    /**
     * Check if map is ready
     */
    isReady() {
        return this.map !== null;
    }

    /**
     * Get count of contractors currently displayed on map
     */
    getDisplayedContractorCount() {
        return this.markers.length;
    }

    /**
     * Get total available contractors (including those without coordinates)
     */
    getTotalContractorCount() {
        return this.contractors.length;
    }

    /**
     * Clean up the view
     */
    destroy() {
        this.clearMarkers();
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        this.isRendered = false;
        this.isVisible = false;
        this.mapInitialized = false;
    }
}