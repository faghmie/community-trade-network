// js/app/views/mapView.js
import { BaseView } from './BaseView.js';

export class MapView extends BaseView {
    constructor(dataModule) {
        super('map-view'); // Consistent view ID pattern
        this.dataModule = dataModule;
        this.map = null;
        this.markers = [];
        this.markerClusters = null;
        this.contractors = [];
        this.mapInitialized = false;
        this.resourcesLoaded = false;
    }

    /**
     * Simple render method
     */
    render() {
        const mainContainer = document.getElementById('mainViewContainer');
        if (!mainContainer) return;

        if (!this.container) {
            this.container = document.createElement('section');
            this.container.id = this.viewId;
            this.container.className = 'map-view';
            this.container.style.display = 'none';
            mainContainer.appendChild(this.container);
        }

        this.renderMapContainer();
    }

    /**
     * Render map container content
     */
    renderMapContainer() {
        this.container.innerHTML = `
            <div class="map-container" id="map-container">
                <div class="map-loading" id="mapLoading">
                    <i class="material-icons">map</i>
                    <p>Loading map...</p>
                </div>
            </div>
        `;

        this.initializeMap();
    }

    /**
     * Show method with map initialization
     */
    show() {
        super.show();

        if (!this.mapInitialized) {
            this.initializeMap();
        } else if (this.map) {
            // Ensure map is properly sized when shown
            setTimeout(() => {
                this.map.invalidateSize();
            }, 100);
        }
    }

    /**
     * Hide method
     */
    hide() {
        super.hide();
    }

    /**
     * Initialize the map and load resources
     */
    async initializeMap() {
        if (this.mapInitialized) return;

        try {
            await this.loadMapResources();
            await this.createMap();
            this.mapInitialized = true;
            this.hideLoading();

            // Load initial contractors
            this.loadContractors();

        } catch (error) {
            console.error('Failed to initialize map:', error);
            this.showMapError();
        }
    }

    /**
     * Load required map resources (Leaflet + MarkerCluster)
     */
    async loadMapResources() {
        if (this.resourcesLoaded) return;

        await Promise.all([
            this.loadLeafletResources(),
            this.loadMarkerClusterResources()
        ]);

        this.resourcesLoaded = true;
    }

    /**
     * Load Leaflet CSS and JS
     */
    async loadLeafletResources() {
        // Load CSS
        if (!document.querySelector('link[href*="leaflet"]')) {
            await this.loadCSS('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
        }

        // Load JS
        if (typeof L === 'undefined') {
            await this.loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
        }
    }

    /**
     * Load MarkerCluster resources
     */
    async loadMarkerClusterResources() {
        // Load CSS
        if (!document.querySelector('link[href*="MarkerCluster"]')) {
            await this.loadCSS('https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css');
            await this.loadCSS('https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css');
        }

        // Load JS
        if (typeof L.markerClusterGroup === 'undefined') {
            await this.loadScript('https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js');
        }
    }

    /**
     * Load CSS dynamically
     */
    loadCSS(href) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.crossOrigin = '';
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }

    /**
     * Load script dynamically
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.crossOrigin = '';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Create the Leaflet map instance
     */
    async createMap() {
        if (!this.container || typeof L === 'undefined') {
            throw new Error('Map container or Leaflet not available');
        }

        const mapContainer = document.getElementById('map-container');
        if (!mapContainer) return;

        const defaultCenter = [-28.4793, 24.6727]; // Center of South Africa
        const defaultZoom = 5;

        this.map = L.map('map-container', {
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
    }

    /**
     * Initialize marker cluster groups
     */
    initializeMarkerClusters() {
        if (typeof L.markerClusterGroup === 'undefined') {
            console.warn('MarkerClusterGroup not available - using individual markers');
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
     * Update contractors on the map
     */
    updateContractors(contractors) {
        this.contractors = contractors || [];
        this.clearMarkers();

        if (!this.map || this.contractors.length === 0) {
            return;
        }

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

        // Handle marker click to show contractor details in ContractorView
        marker.on('click', () => {
            this.map.closePopup();
            // Use navigation to show ContractorView instead of modal
            document.dispatchEvent(new CustomEvent('navigationViewChange', {
                detail: {
                    view: 'contractor',
                    context: { contractorId: contractor.id }
                }
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
     * Hide loading indicator
     */
    hideLoading() {
        const loadingElement = document.getElementById('mapLoading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    /**
     * Show map error state
     */
    showMapError() {
        const mapContainer = document.getElementById('map-container');
        if (mapContainer) {
            mapContainer.innerHTML = `
                <div class="map-error">
                    <i class="material-icons">error_outline</i>
                    <h3>Map Unavailable</h3>
                    <p>Failed to load map. Please check your connection and try again.</p>
                </div>
            `;
        }
    }

    /**
     * Refresh map size (call when container changes size)
     */
    refreshMap() {
        if (this.map) {
            setTimeout(() => {
                this.map.invalidateSize();
            }, 100);
        }
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
        this.mapInitialized = false;
        this.resourcesLoaded = false;
        super.destroy();
    }
}

export default MapView;