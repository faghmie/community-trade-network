// js/modules/mapManager.js
/**
 * Map Manager - Handles interactive map display of contractors with Material Design
 * UPDATED: Uses geocodingService for consistent location handling
 */
import { geocodingService } from './geocodingService.js';

export class MapManager {
    constructor(dataModule) {
        this.map = null;
        this.markers = [];
        this.markerClusters = null;
        this.currentBounds = null;
        this.isMapView = false;
        this.contractors = [];
        this.initialized = false;
        this.allContractors = [];
        this.mapLoadAttempts = 0;
        this.maxMapLoadAttempts = 5;
        this.dataModule = dataModule;
        this.geocodingService = geocodingService;
        
        this.contractorsLoaded = false;
        this.pendingContractorLoad = false;
        this.pendingGeocodingRequests = new Map(); // Track ongoing geocoding requests
        
        this.init();
    }

    init() {
        this.loadLeafletCSS();
        this.loadLeafletMarkerClusterCSS();
        
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

    setupMap() {
        if (!document.getElementById('map-container')) {
            this.createMapContainer();
        }

        this.initializeMap();
        this.setupEventListeners();
        this.startContractorLoading();
    }

    createMapContainer() {
        const mapContainer = document.createElement('div');
        mapContainer.id = 'map-container';
        mapContainer.className = 'map-container material-card hidden';
        
        const mapSection = document.querySelector('.map-section');
        if (mapSection) {
            mapSection.appendChild(mapContainer);
        } else {
            const mainElement = document.querySelector('main');
            if (mainElement) {
                const newMapSection = document.createElement('section');
                newMapSection.className = 'map-section';
                newMapSection.appendChild(mapContainer);
                mainElement.appendChild(newMapSection);
            }
        }
    }

    initializeMap() {
        const mapContainer = document.getElementById('map-container');
        if (!mapContainer) return false;

        if (this.map || mapContainer._leaflet_id) {
            return true;
        }

        const defaultCenter = [-28.4793, 24.6727];
        const defaultZoom = 5;

        try {
            if (typeof L === 'undefined') {
                this.mapLoadAttempts++;
                if (this.mapLoadAttempts < this.maxMapLoadAttempts) {
                    setTimeout(() => this.initializeMap(), 500);
                } else {
                    this.loadLeafletJS().then(() => {
                        this.initializeMap();
                    });
                }
                return false;
            }

            this.map = L.map('map-container', {
                zoomControl: false,
                attributionControl: true,
                fadeAnimation: true,
                zoomAnimation: true
            }).setView(defaultCenter, defaultZoom);

            L.control.zoom({
                position: 'bottomright'
            }).addTo(this.map);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18
            }).addTo(this.map);

            // Initialize marker cluster group
            this.initializeMarkerClusters();

            this.initialized = true;
            this.loadAllContractors();
            return true;
        } catch (error) {
            this.mapLoadAttempts++;
            if (this.mapLoadAttempts < this.maxMapLoadAttempts) {
                setTimeout(() => this.initializeMap(), 1000);
            }
            return false;
        }
    }

    initializeMarkerClusters() {
        if (typeof L.markerClusterGroup === 'undefined') {
            this.loadLeafletMarkerClusterJS().then(() => {
                this.initializeMarkerClusters();
            });
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
            script.onload = () => resolve();
            script.onerror = () => reject();
            document.head.appendChild(script);
        });
    }

    loadLeafletMarkerClusterJS() {
        return new Promise((resolve, reject) => {
            if (typeof L.markerClusterGroup !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';
            script.crossOrigin = '';
            script.onload = () => resolve();
            script.onerror = () => reject();
            document.head.appendChild(script);
        });
    }

    startContractorLoading() {
        if (this.contractorsLoaded || this.pendingContractorLoad) return;

        this.pendingContractorLoad = true;
        this.attemptContractorLoad();
    }

    attemptContractorLoad(attempt = 0) {
        const maxAttempts = 10;
        
        if (attempt >= maxAttempts) {
            this.pendingContractorLoad = false;
            return;
        }

        if (this.dataModule && typeof this.dataModule.getContractors === 'function') {
            try {
                const contractors = this.dataModule.getContractors();
                if (contractors && contractors.length > 0) {
                    this.handleContractorsLoaded(contractors);
                    return;
                }
            } catch (error) {}
        }

        if (attempt === 0) {
            document.addEventListener('contractorsUpdated', (event) => {
                const contractors = event.detail?.contractors;
                if (contractors && contractors.length > 0) {
                    this.handleContractorsLoaded(contractors);
                }
            });

            document.addEventListener('dataModuleInitialized', () => {
                this.loadAllContractors();
            });
        }

        setTimeout(() => {
            this.attemptContractorLoad(attempt + 1);
        }, 500);
    }

    handleContractorsLoaded(contractors) {
        this.allContractors = contractors;
        this.contractors = contractors;
        this.contractorsLoaded = true;
        this.pendingContractorLoad = false;
        
        if (this.isMapView) {
            this.updateMapMarkers();
        }
        
        document.dispatchEvent(new CustomEvent('mapContractorsLoaded', {
            detail: { contractors: this.contractors }
        }));
    }

    loadAllContractors() {
        if (this.dataModule && typeof this.dataModule.getContractors === 'function') {
            const contractors = this.dataModule.getContractors();
            if (contractors && contractors.length > 0) {
                this.handleContractorsLoaded(contractors);
            }
        }
    }

    setupEventListeners() {
        this.setupViewToggleButtons();

        document.addEventListener('contractorsUpdated', (event) => {
            this.allContractors = event.detail.contractors || this.allContractors;
            if (this.isMapView) {
                this.updateMapMarkers();
            }
        });

        document.addEventListener('filtersApplied', (event) => {
            this.contractors = event.detail.contractors || this.allContractors;
            this.updateMapMarkers();
        });

        document.addEventListener('dataModuleInitialized', () => {
            this.loadAllContractors();
        });

        // Remove popup button click handler since we're not using popups anymore
        window.addEventListener('resize', () => {
            if (this.isMapView && this.map) {
                setTimeout(() => {
                    this.map.invalidateSize();
                }, 100);
            }
        });

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (this.isMapView) {
                this.updateMapMarkers();
            }
        });

        document.addEventListener('viewToggle', (event) => {
            const view = event.detail.view;
            this.isMapView = view === 'map';
            this.toggleViewVisibility();
        });
    }

    setupViewToggleButtons() {
        const viewToggle = document.getElementById('view-toggle');
        
        if (viewToggle) {
            viewToggle.addEventListener('click', (e) => {
                const button = e.target.closest('.btn');
                if (button && button.hasAttribute('data-view')) {
                    this.handleViewToggle(button);
                }
            });

            this.setInitialViewState();
        }
    }

    setInitialViewState() {
        const viewToggleBtns = document.querySelectorAll('#view-toggle .btn');
        const listViewBtn = document.querySelector('#view-toggle .btn[data-view="list"]');
        
        if (listViewBtn) {
            viewToggleBtns.forEach(btn => btn.classList.remove('active'));
            listViewBtn.classList.add('active');
            this.isMapView = false;
        }
    }

    handleViewToggle(button) {
        const view = button.getAttribute('data-view');
        if (!view) return;

        const viewToggleBtns = document.querySelectorAll('#view-toggle .btn');
        if (!viewToggleBtns || viewToggleBtns.length === 0) return;

        viewToggleBtns.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        this.isMapView = view === 'map';
        this.toggleViewVisibility();

        document.dispatchEvent(new CustomEvent('viewToggle', {
            detail: { view }
        }));
    }

    toggleViewVisibility() {
        const mapContainer = document.getElementById('map-container');
        const contractorList = document.getElementById('contractorList');
        const favoritesSection = document.getElementById('favoritesSection');
        
        if (!mapContainer || !contractorList) return;

        if (this.isMapView) {
            mapContainer.classList.remove('hidden');
            contractorList.classList.add('hidden');
            if (favoritesSection) {
                favoritesSection.classList.add('hidden');
            }
            this.handleMapViewActivation();
        } else {
            mapContainer.classList.add('hidden');
            contractorList.classList.remove('hidden');
        }
    }

    handleMapViewActivation() {
        if (!this.initialized) {
            const initialized = this.initializeMap();
            if (!initialized) return;
        }
        
        this.contractors = this.allContractors;
        
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

    updateMapMarkers() {
        this.clearMarkers();

        if (!this.map || !this.contractors || this.contractors.length === 0) {
            return;
        }

        console.log('🗺️ Updating map markers for', this.contractors.length, 'contractors');

        // Process contractors asynchronously with geocoding
        this.processContractorsForMarkers(this.contractors);
    }

    async processContractorsForMarkers(contractors) {
        const batchSize = 3; // Process 3 contractors at a time to be respectful to the geocoding service
        const batches = [];
        
        for (let i = 0; i < contractors.length; i += batchSize) {
            batches.push(contractors.slice(i, i + batchSize));
        }

        for (const batch of batches) {
            await Promise.all(
                batch.map(contractor => this.processContractorMarker(contractor))
            );
            
            // Small delay between batches
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        this.fitMapToMarkers();
    }

    async processContractorMarker(contractor) {
        try {
            const location = await this.extractLocation(contractor);
            if (location) {
                console.log('📍 Adding marker for contractor:', {
                    name: contractor.name,
                    location: contractor.location,
                    coordinates: contractor.coordinates,
                    mapLocation: location
                });
                this.addContractorMarker(contractor, location);
            } else {
                console.warn('❌ No location found for contractor:', contractor.name);
            }
        } catch (error) {
            console.error('❌ Error processing contractor marker:', contractor.name, error);
        }
    }

    async extractLocation(contractor) {
        console.log('🔍 Extracting location for contractor:', {
            name: contractor.name,
            storedCoordinates: contractor.coordinates,
            location: contractor.location
        });

        // First priority: Use stored coordinates from contractor record
        if (contractor.coordinates) {
            const coordinates = this.normalizeCoordinates(contractor.coordinates);
            if (coordinates) {
                console.log('📍 Using stored coordinates:', coordinates);
                return coordinates;
            }
        }

        // Second priority: Geocode the location string
        if (contractor.location) {
            try {
                const coordinates = await this.geocodeLocation(contractor.location);
                if (coordinates) {
                    console.log('📍 Using geocoded coordinates:', coordinates);
                    return coordinates;
                }
            } catch (error) {
                console.warn('❌ Geocoding failed for location:', contractor.location, error);
            }
        }

        console.warn('❌ No valid coordinates found for contractor:', contractor.name);
        return null;
    }

    normalizeCoordinates(coordinates) {
        if (!coordinates) return null;

        // Handle {lat, lng} format
        if (coordinates.lat !== undefined && coordinates.lng !== undefined) {
            return { 
                lat: coordinates.lat, 
                lng: coordinates.lng 
            };
        }

        // Handle [lat, lng] array format
        if (Array.isArray(coordinates) && coordinates.length === 2) {
            return { 
                lat: coordinates[0], 
                lng: coordinates[1] 
            };
        }

        return null;
    }

    async geocodeLocation(location) {
        // Check if we already have a pending request for this location
        const cacheKey = location.toLowerCase().trim();
        if (this.pendingGeocodingRequests.has(cacheKey)) {
            console.log('🔄 Using pending geocoding request for:', location);
            return this.pendingGeocodingRequests.get(cacheKey);
        }

        try {
            console.log('🌍 Geocoding location:', location);
            const geocodingPromise = this.geocodingService.geocodeLocation(location);
            
            // Store the promise to avoid duplicate requests
            this.pendingGeocodingRequests.set(cacheKey, geocodingPromise);
            
            const result = await geocodingPromise;
            
            // Clean up the pending request
            this.pendingGeocodingRequests.delete(cacheKey);
            
            if (result && result.coordinates) {
                return this.normalizeCoordinates(result.coordinates);
            }
            
            return null;
        } catch (error) {
            // Clean up on error too
            this.pendingGeocodingRequests.delete(cacheKey);
            throw error;
        }
    }

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

        // Create marker WITHOUT binding popup
        const marker = L.marker([location.lat, location.lng], { icon: markerIcon });

        // Store contractor reference for clustering
        marker.contractor = contractor;

        // Only handle click event - no popup
        marker.on('click', () => {
            // Close any existing popups first (in case any remain)
            this.map.closePopup();
            
            // Dispatch event to open contractor modal
            document.dispatchEvent(new CustomEvent('mapMarkerClick', {
                detail: { contractorId: contractor.id }
            }));
        });

        this.markers.push(marker);
        
        // Add to cluster group instead of directly to map
        if (this.markerClusters) {
            this.markerClusters.addLayer(marker);
        } else {
            marker.addTo(this.map);
        }
    }

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

    getRatingClass(rating) {
        if (rating >= 4.0) return 'high-rated';
        if (rating >= 3.0) return 'medium-rated';
        return 'low-rated';
    }

    clearMarkers() {
        // Clear any pending geocoding requests
        this.pendingGeocodingRequests.clear();
        
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

    updateContractors(contractors) {
        this.contractors = contractors || this.allContractors;
        this.updateMapMarkers();
    }

    invalidateSize() {
        if (this.map) {
            setTimeout(() => {
                this.map.invalidateSize();
            }, 100);
        }
    }

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

    isReady() {
        return this.initialized && this.map !== null;
    }

    destroy() {
        this.clearMarkers();
        if (this.map) {
            this.map.remove();
            this.map = null;
            this.initialized = false;
        }
    }
}