// js/app/modals/contractorEditModalManager.js
// UPDATED: Fixed province dropdown population with correct data structure

import { geocodingService } from '../../modules/geocodingService.js';
import { showNotification } from '../../modules/notifications.js';
import { isValidEmail, isValidSouthAfricanPhone, isValidUrl } from '../../modules/validation.js';
import { AreaAutocomplete } from '../../modules/areaAutocomplete.js';

export class ContractorEditModalManager {
    constructor(contractorManager, categoriesModule, locationData) {
        this.contractorManager = contractorManager;
        this.categoriesModule = categoriesModule;
        this.locationData = locationData;
        this.modal = null;
        this.isGeocoding = false;
        this.currentContractor = null;
        this.areaAutocomplete = null;
        this.eventListeners = [];

        this.init = this.init.bind(this);
        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.updateAreaInput = this.updateAreaInput.bind(this);
        this.setupRealTimeGeocoding = this.setupRealTimeGeocoding.bind(this);
        this.updateGeocodingStatus = this.updateGeocodingStatus.bind(this);
        this.removeEventListeners = this.removeEventListeners.bind(this);
        this.handleProvinceChange = this.handleProvinceChange.bind(this);
        this.handleAddSupplierRequest = this.handleAddSupplierRequest.bind(this);
    }

    init() {
        this.createModal();
        this.bindEvents();
        this.setupEventListeners();
        console.log('✅ ContractorEditModalManager initialized');
    }

    // Setup event listeners for external events
    setupEventListeners() {
        // Listen for "Add Supplier" requests from FilterManager
        const addSupplierHandler = (event) => {
            console.log('📩 ContractorEditModalManager: Received addSupplierRequested event', event.detail);
            this.handleAddSupplierRequest(event.detail);
        };

        document.addEventListener('addSupplierRequested', addSupplierHandler);
        this.eventListeners.push({
            element: document,
            event: 'addSupplierRequested',
            handler: addSupplierHandler
        });

        // Listen for contractor creation events (for analytics/tracking)
        const contractorCreatedHandler = (event) => {
            console.log('📈 Contractor created event received:', event.detail);
        };

        document.addEventListener('contractorCreated', contractorCreatedHandler);
        this.eventListeners.push({
            element: document,
            event: 'contractorCreated',
            handler: contractorCreatedHandler
        });
    }

    // Handle "Add Supplier" requests with prefill data
    handleAddSupplierRequest(eventData) {
        const { prefillData, source, timestamp } = eventData;

        console.log('🎯 ContractorEditModalManager: Handling add supplier request with prefill:', prefillData);

        // Open modal with prefill data
        this.openWithPrefill(prefillData);

        // Track this action if needed
        this.trackAddSupplierAction(prefillData, source);
    }

    // Open modal with pre-filled data from search
    openWithPrefill(prefillData) {
        if (!this.modal) this.init();

        // Reset form and open for new contractor
        this.open(null); // Open with null to create new contractor

        // Pre-fill form fields after a short delay to ensure DOM is ready
        setTimeout(() => {
            this.prefillFormFields(prefillData);
        }, 50);
    }

    // Pre-fill form fields with search data
    prefillFormFields(prefillData) {
        const { name, category, location } = prefillData;

        console.log('📝 Pre-filling form with:', prefillData);

        // Pre-fill name if available
        if (name && name.trim()) {
            const nameInput = document.getElementById('contractorEditName');
            if (nameInput) {
                nameInput.value = name.trim();
                nameInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }

        // Pre-fill category if available and valid
        if (category && category.trim()) {
            const categorySelect = document.getElementById('contractorEditCategory');
            if (categorySelect) {
                // Check if category exists in options
                const categoryExists = Array.from(categorySelect.options).some(
                    option => option.value === category
                );
                if (categoryExists) {
                    categorySelect.value = category;
                    categorySelect.dispatchEvent(new Event('change', { bubbles: true }));
                } else {
                    console.log('⚠️ Category not found in options:', category);
                }
            }
        }

        // Pre-fill location if available
        if (location && location.trim()) {
            this.prefillLocation(location);
        }

        // Focus on the next empty required field for better UX
        this.focusNextEmptyField();
    }

    // Pre-fill location data
    prefillLocation(location) {
        if (!location || !this.locationData?.southAfricanProvinces) return;

        console.log('📍 Attempting to prefill location:', location);

        // Try to parse location (could be just area, or "area, province")
        const locationParts = location.split(',').map(part => part.trim());

        if (locationParts.length === 2) {
            // Format: "Area, Province"
            const [area, province] = locationParts;
            this.setProvinceAndArea(province, area);
        } else if (locationParts.length === 1) {
            // Format: Just area name - try to find province
            const area = locationParts[0];
            this.findAndSetProvinceForArea(area);
        }
    }

    // Set province and area
    setProvinceAndArea(province, area) {
        const provinceSelect = document.getElementById('contractorEditProvince');
        if (provinceSelect && province) {
            // Check if province exists
            const provinceExists = Array.from(provinceSelect.options).some(
                option => option.value === province
            );

            if (provinceExists) {
                provinceSelect.value = province;
                provinceSelect.dispatchEvent(new Event('change', { bubbles: true }));

                // Set area after province is selected and area input is enabled
                setTimeout(() => {
                    const areaInput = document.getElementById('contractorEditArea');
                    if (areaInput && area) {
                        areaInput.value = area;
                        areaInput.dispatchEvent(new Event('input', { bubbles: true }));

                        // Trigger geocoding for the pre-filled location
                        setTimeout(() => {
                            this.setupRealTimeGeocoding();
                        }, 100);
                    }
                }, 100);
            }
        }
    }

    // Find province for area and set both
    findAndSetProvinceForArea(area) {
        if (!this.locationData?.southAfricanProvinces) return;

        for (const [province, provinceData] of Object.entries(this.locationData.southAfricanProvinces)) {
            if (provinceData.cities.includes(area)) {
                this.setProvinceAndArea(province, area);
                return;
            }
        }

        console.log('⚠️ Could not find province for area:', area);
    }

    // Focus on next empty required field for better UX
    focusNextEmptyField() {
        const requiredFields = [
            document.getElementById('contractorEditName'),
            document.getElementById('contractorEditCategory'),
            document.getElementById('contractorEditPhone'),
            document.getElementById('contractorEditProvince'),
            document.getElementById('contractorEditArea')
        ];

        for (const field of requiredFields) {
            if (field && !field.value.trim()) {
                field.focus();
                break;
            }
        }
    }

    // Track add supplier actions
    trackAddSupplierAction(prefillData, source) {
        console.log('📊 Tracked add supplier action:', {
            source: source || 'unknown',
            hasName: !!(prefillData.name && prefillData.name.trim()),
            hasCategory: !!(prefillData.category && prefillData.category.trim()),
            hasLocation: !!(prefillData.location && prefillData.location.trim()),
            timestamp: new Date().toISOString()
        });

        document.dispatchEvent(new CustomEvent('addSupplierFlowStarted', {
            detail: {
                prefillData,
                source,
                timestamp: new Date().toISOString()
            }
        }));
    }

    createModal() {
        if (this.modal) return;

        const modalHTML = `
        <div class="modal contractor-form-modal material-modal" id="contractorEditModal" style="display: none;">
            <div class="modal-backdrop"></div>
            <div class="modal-content material-dialog">
                <div class="modal-header material-dialog-header">
                    <div class="header-content">
                        <h2 class="dialog-title" id="formTitle">Add Service Provider</h2>
                        <div class="dialog-subtitle" id="formSubtitle">
                            Create a new service provider profile
                        </div>
                    </div>
                    <button class="material-icon-button close" id="closeContractorEditModal" aria-label="Close modal">
                        <i class="material-icons">close</i>
                    </button>
                </div>
                <div class="modal-body material-dialog-body">
                    <form id="contractorEditForm" onsubmit="return false;">
                        <input type="hidden" id="contractorEditId">

                        <!-- Basic Information Section -->
                        <div class="contractor-form-section">
                            <h3 class="material-section-title">
                                <i class="material-icons">business_center</i>
                                Basic Information
                            </h3>
                            <div class="contractor-form-fields">
                                <div class="material-form-group">
                                    <label for="contractorEditName" class="material-input-label">Service Provider Name *</label>
                                    <input type="text" id="contractorEditName" name="name" class="material-input" required>
                                    <div class="material-input-helper">Enter the full business or individual name</div>
                                </div>

                                <div class="material-form-group">
                                    <label for="contractorEditCategory" class="material-input-label">Service Category *</label>
                                    <select id="contractorEditCategory" name="category" class="material-select" required>
                                        <option value="">Select Category</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Contact Information Section -->
                        <div class="contractor-form-section">
                            <h3 class="material-section-title">
                                <i class="material-icons">contact_page</i>
                                Contact Information
                            </h3>
                            <div class="contractor-form-fields">
                                <div class="material-form-group">
                                    <label for="contractorEditEmail" class="material-input-label">Email Address (optional)</label>
                                    <input type="email" id="contractorEditEmail" name="email" class="material-input" placeholder="email@example.com">
                                    <div class="material-input-helper">Provide an email address for contact (optional)</div>
                                </div>

                                <div class="material-form-group">
                                    <label for="contractorEditPhone" class="material-input-label">Phone Number *</label>
                                    <input type="tel" id="contractorEditPhone" name="phone" class="material-input" required>
                                    <div class="material-input-helper">South African format: +27 or 0 followed by 9 digits</div>
                                </div>

                                <div class="material-form-group">
                                    <label for="contractorEditWebsite" class="material-input-label">Website (optional)</label>
                                    <input type="url" id="contractorEditWebsite" name="website" class="material-input" placeholder="https://example.com">
                                    <div class="material-input-helper">Include http:// or https://</div>
                                </div>
                            </div>
                        </div>

                        <!-- Service Location Section -->
                        <div class="contractor-form-section">
                            <h3 class="material-section-title">
                                <i class="material-icons">location_on</i>
                                Service Location
                            </h3>
                            <div class="contractor-form-fields">
                                <div class="material-form-group">
                                    <label for="contractorEditProvince" class="material-input-label">Province *</label>
                                    <select id="contractorEditProvince" name="province" class="material-select" required>
                                        <option value="">Select Province</option>
                                    </select>
                                </div>
                                <div class="material-form-group">
                                    <label for="contractorEditArea" class="material-input-label">Area *</label>
                                    <div id="areaAutocompleteContainer" class="area-autocomplete-container">
                                        <input type="text" id="contractorEditArea" name="area" class="material-input" required disabled 
                                               placeholder="Select province first" autocomplete="off">
                                    </div>
                                    <div class="material-input-helper">Start typing area name for suggestions</div>
                                </div>
                                
                                <!-- Geocoding Status Display -->
                                <div id="geocodingEditStatusContainer" class="geocoding-status-container" style="display: none;">
                                    <div class="material-form-group">
                                        <div id="geocodingEditStatus" class="geocoding-status">
                                            <i class="material-icons geocoding-status-icon">location_searching</i>
                                            <span class="geocoding-status-text">Location detection ready</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer material-dialog-actions">
                    <button type="button" class="mdc-button mdc-button--outlined" id="cancelContractorEdit">
                        <span class="mdc-button__label">Cancel</span>
                    </button>
                    <button type="button" class="mdc-button mdc-button--raised" id="saveContractorEdit">
                        <span class="mdc-button__label">
                            <i class="material-icons mdc-button__icon">save</i>
                            Save Service Provider
                        </span>
                    </button>
                </div>
            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('contractorEditModal');
    }

    bindEvents() {
        this.removeEventListeners();

        // Save button
        const saveHandler = (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            this.handleSubmit();
        };
        this.addEventListener(document, 'click', '#saveContractorEdit', saveHandler);

        // Close buttons
        const closeHandler = (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            this.close();
        };
        this.addEventListener(document, 'click', '#closeContractorEditModal', closeHandler);
        this.addEventListener(document, 'click', '#cancelContractorEdit', closeHandler);

        // Backdrop close
        const backdropHandler = (e) => {
            if (e.target === this.modal) {
                e.preventDefault();
                e.stopImmediatePropagation();
                this.close();
            }
        };
        this.addEventListener(document, 'click', backdropHandler);

        // Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape' && this.modal?.style.display === 'flex') {
                e.preventDefault();
                e.stopImmediatePropagation();
                this.close();
            }
        };
        this.addEventListener(document, 'keydown', escapeHandler);

        // Province change
        const provinceHandler = (e) => {
            if (e.target.id === 'contractorEditProvince') {
                this.handleProvinceChange(e.target.value);
            }
        };
        this.addEventListener(document, 'change', provinceHandler);

        // Area input change (for geocoding trigger)
        const areaHandler = (e) => {
            if (e.target.id === 'contractorEditArea' && e.target.value.trim().length > 0) {
                this.setupRealTimeGeocoding();
            }
        };
        this.addEventListener(document, 'change', areaHandler);

        // Prevent form submission
        const formHandler = (e) => {
            if (e.target.id === 'contractorEditForm') {
                e.preventDefault();
                e.stopImmediatePropagation();
                return false;
            }
        };
        this.addEventListener(document, 'submit', formHandler, true);
    }

    addEventListener(element, event, selectorOrHandler, handler) {
        let actualHandler;
        let actualSelector;

        if (typeof selectorOrHandler === 'function') {
            actualHandler = selectorOrHandler;
            element.addEventListener(event, actualHandler, true);
        } else {
            actualSelector = selectorOrHandler;
            actualHandler = (e) => {
                if (e.target.matches(actualSelector) || e.target.closest(actualSelector)) {
                    handler(e);
                }
            };
            element.addEventListener(event, actualHandler, true);
        }

        this.eventListeners.push({ element, event, handler: actualHandler });
    }

    removeEventListeners() {
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners = [];
    }

    open(contractor = null) {
        if (!this.modal) this.init();

        this.currentContractor = contractor;
        this.populateForm(contractor);

        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            this.modal.classList.add('modal-open');
            document.getElementById('contractorEditName')?.focus();
        }, 10);
    }

    close() {
        if (!this.modal) return;

        this.modal.classList.remove('modal-open');
        setTimeout(() => {
            this.modal.style.display = 'none';
            document.body.style.overflow = '';
            this.updateGeocodingStatus('ready', 'Location detection ready');
            this.currentContractor = null;

            // Reset area autocomplete
            if (this.areaAutocomplete) {
                this.areaAutocomplete.hideSuggestions();
            }
        }, 300);
    }

    populateForm(contractor) {
        // Set title
        const title = document.getElementById('formTitle');
        const subtitle = document.getElementById('formSubtitle');

        if (contractor) {
            title.textContent = 'Edit Service Provider';
            subtitle.textContent = `Update ${contractor.name}'s profile`;
            document.getElementById('contractorEditId').value = contractor.id;
        } else {
            title.textContent = 'Add Service Provider';
            subtitle.textContent = 'Create a new service provider profile';
            document.getElementById('contractorEditId').value = '';
        }

        // Populate categories
        this.populateCategories();

        // Populate provinces
        this.populateProvinces();

        // Initialize area autocomplete
        this.initAreaAutocomplete();

        // Reset form or populate with contractor data
        const form = document.getElementById('contractorEditForm');
        if (!contractor) {
            form.reset();
            this.disableAreaInput();
        } else {
            this.populateContractorData(contractor);
        }

        this.updateGeocodingStatus('ready', 'Location detection ready');
    }

    // FIXED: Properly populate provinces from location data
    populateProvinces() {
        const select = document.getElementById('contractorEditProvince');
        if (!select) return;

        select.innerHTML = '<option value="">Select Province</option>';

        console.log('📍 Location data structure:', this.locationData);

        // FIXED: Handle both data structures - direct object or wrapped in southAfricanProvinces
        let provinces = [];

        if (this.locationData) {
            if (this.locationData.southAfricanProvinces) {
                // Structure: { southAfricanProvinces: { "Gauteng": { cities: [...], coordinates: [...] } } }
                provinces = Object.keys(this.locationData.southAfricanProvinces).sort();
                console.log('✅ Found provinces in southAfricanProvinces property:', provinces);
            } else if (typeof this.locationData === 'object' && this.locationData.Gauteng) {
                // Structure: Direct { "Gauteng": { cities: [...], coordinates: [...] }, "Western Cape": {...} }
                provinces = Object.keys(this.locationData).sort();
                console.log('✅ Found provinces in direct object:', provinces);
            } else {
                console.error('❌ Unexpected location data structure:', this.locationData);
            }
        }

        // If no provinces found, use default South African provinces
        if (provinces.length === 0) {
            console.warn('⚠️ No provinces found in locationData, using defaults');
            provinces = [
                'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
                'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape'
            ];
        }

        // Populate the dropdown
        provinces.forEach(province => {
            const option = document.createElement('option');
            option.value = province;
            option.textContent = province;
            select.appendChild(option);
        });

        console.log(`✅ Populated ${provinces.length} provinces in dropdown`);
    }

    initAreaAutocomplete() {
        if (this.areaAutocomplete) {
            this.areaAutocomplete.destroy();
        }

        this.areaAutocomplete = new AreaAutocomplete(
            geocodingService,
            this.locationData
        );

        // Get initial province value
        const initialProvince = document.getElementById('contractorEditProvince')?.value;

        this.areaAutocomplete.init(
            'areaAutocompleteContainer',
            'contractorEditArea',
            initialProvince
        );

        // Set up area change listener for geocoding
        if (this.areaAutocomplete.input) {
            const areaChangeHandler = () => {
                const areaValue = this.areaAutocomplete.input.value.trim();
                if (areaValue.length > 0) {
                    this.setupRealTimeGeocoding();
                }
            };

            this.areaAutocomplete.input.addEventListener('change', areaChangeHandler);
            this.eventListeners.push({
                element: this.areaAutocomplete.input,
                event: 'change',
                handler: areaChangeHandler
            });
        }
    }

    populateCategories() {
        const select = document.getElementById('contractorEditCategory');
        if (!select) return;

        select.innerHTML = '<option value="">Select Category</option>';
        const categories = this.categoriesModule.getCategories();
        const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));

        sortedCategories.forEach(category => {
            select.innerHTML += `<option value="${category.name}">${category.name}</option>`;
        });
    }

    populateContractorData(contractor) {
        document.getElementById('contractorEditName').value = contractor.name || '';
        document.getElementById('contractorEditCategory').value = contractor.category || '';
        document.getElementById('contractorEditEmail').value = contractor.email || '';
        document.getElementById('contractorEditPhone').value = contractor.phone || '';
        document.getElementById('contractorEditWebsite').value = contractor.website || '';

        // Parse and set location
        if (contractor.location) {
            const [area, province] = contractor.location.split(', ').map(part => part.trim());
            if (province) {
                document.getElementById('contractorEditProvince').value = province;
                this.updateAreaInput(province, area);
                setTimeout(() => this.setupRealTimeGeocoding(), 500);
            } else if (area) {
                this.findProvinceForArea(area);
            }
        }
    }

    findProvinceForArea(area) {
        const provinceSelect = document.getElementById('contractorEditProvince');

        if (!provinceSelect || !this.locationData?.southAfricanProvinces) return;

        console.log('🔍 Searching for province for area:', area);

        for (const [province, provinceData] of Object.entries(this.locationData.southAfricanProvinces)) {
            if (provinceData.cities.includes(area)) {
                console.log(`✅ Found province ${province} for area ${area}`);
                provinceSelect.value = province;
                this.updateAreaInput(province, area);
                setTimeout(() => this.setupRealTimeGeocoding(), 500);
                return;
            }
        }

        console.log('⚠️ Could not find province for area:', area);
        // If area not found in any province, enable area input
        this.enableAreaInput();
    }

    handleProvinceChange(province) {
        console.log('🔧 Province changed to:', province);
        this.updateAreaInput(province);

        // Update autocomplete with new province
        if (this.areaAutocomplete) {
            this.areaAutocomplete.setProvince(province);
        }
    }

    updateAreaInput(province, selectedArea = '') {
        if (!province) {
            this.disableAreaInput();
            this.updateGeocodingStatus('ready', 'Select province first');
            return;
        }

        this.enableAreaInput();

        if (this.areaAutocomplete) {
            this.areaAutocomplete.setProvince(province);
        }

        if (selectedArea) {
            document.getElementById('contractorEditArea').value = selectedArea;
        }

        this.updateGeocodingStatus('ready', 'Type area name for suggestions');

        // Debug: Check available cities for this province
        if (this.locationData?.southAfricanProvinces?.[province]?.cities) {
            const cities = this.locationData.southAfricanProvinces[province].cities;
            console.log(`📍 Available cities for ${province}:`, cities.length, 'cities');
        }
    }

    enableAreaInput() {
        const areaInput = document.getElementById('contractorEditArea');
        areaInput.disabled = false;
        areaInput.placeholder = 'Start typing area name...';
    }

    disableAreaInput() {
        const areaInput = document.getElementById('contractorEditArea');
        areaInput.disabled = true;
        areaInput.placeholder = 'Select province first';
        areaInput.value = '';

        if (this.areaAutocomplete) {
            this.areaAutocomplete.hideSuggestions();
        }
    }

    async setupRealTimeGeocoding() {
        const province = document.getElementById('contractorEditProvince')?.value;
        const area = document.getElementById('contractorEditArea')?.value;

        if (!province || !area) {
            this.updateGeocodingStatus('ready', 'Select both province and area for location detection');
            return;
        }

        // Prevent multiple simultaneous geocoding requests
        if (this.isGeocoding) {
            return;
        }

        this.isGeocoding = true;
        const location = `${area}, ${province}`;

        this.updateGeocodingStatus('loading', 'Detecting location coordinates...');

        try {
            const geocodingResult = await geocodingService.geocodeLocation(location);

            if (geocodingResult.coordinates) {
                const { lat, lng } = geocodingResult.coordinates;
                this.updateGeocodingStatus('success', `Location confirmed: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            } else {
                this.updateGeocodingStatus('warning', 'Location not found. Will use default coordinates.');
            }
        } catch (error) {
            console.warn('Geocoding failed:', error);
            this.updateGeocodingStatus('error', 'Location service unavailable. Using default coordinates.');
        } finally {
            this.isGeocoding = false;
        }
    }

    updateGeocodingStatus(status, message) {
        const container = document.getElementById('geocodingEditStatusContainer');
        const statusElement = document.getElementById('geocodingEditStatus');

        if (!container || !statusElement) return;

        if (status === 'ready' && message === 'Location detection ready') {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        statusElement.className = `geocoding-status geocoding-status--${status}`;

        const iconMap = {
            ready: 'location_searching',
            loading: 'location_searching',
            success: 'location_on',
            warning: 'location_off',
            error: 'location_off'
        };

        const icon = iconMap[status] || 'location_searching';

        statusElement.innerHTML = `
            <i class="material-icons geocoding-status-icon">${icon}</i>
            <span class="geocoding-status-text">${message}</span>
        `;
    }

    async handleSubmit() {
        const province = document.getElementById('contractorEditProvince')?.value;
        const area = document.getElementById('contractorEditArea')?.value;

        if (!province || !area) {
            showNotification('Please select both province and area', 'error');
            return;
        }

        const location = `${area}, ${province}`;

        // Geocode location
        let coordinates = null;
        let serviceAreas = [];

        try {
            this.updateGeocodingStatus('loading', 'Finding location coordinates...');
            const geocodingResult = await geocodingService.geocodeLocation(location);
            coordinates = geocodingResult.coordinates;
            serviceAreas = geocodingResult.serviceAreas;

            if (coordinates) {
                this.updateGeocodingStatus('success', 'Location found! Saving contractor...');
                console.log('📍 Geocoding successful:', coordinates);
            } else {
                this.updateGeocodingStatus('warning', 'Using default coordinates for location');
                console.log('📍 Geocoding failed, using default coordinates');
            }
        } catch (error) {
            console.warn('Geocoding failed:', error);
            this.updateGeocodingStatus('error', 'Location service unavailable, using default coordinates');
        }

        const formData = new FormData(document.getElementById('contractorEditForm'));
        const contractorData = {
            name: formData.get('name'),
            category: formData.get('category'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            website: formData.get('website'),
            location: location,
            coordinates: coordinates,        // From geocoding service
            serviceAreas: serviceAreas      // From geocoding service
        };

        // Validate inputs
        if (!this.validateContractorData(contractorData)) {
            return;
        }

        const contractorId = document.getElementById('contractorEditId').value;

        try {
            console.log('💾 Saving contractor data:', {
                id: contractorId,
                data: contractorData,
                hasCoordinates: !!coordinates,
                coordinates: coordinates
            });

            let savedContractor;
            let wasCreated = false;

            if (contractorId) {
                // Update existing contractor
                savedContractor = this.contractorManager.update(contractorId, contractorData);
                console.log('✅ Contractor updated:', savedContractor);
                showNotification('Service Provider updated successfully', 'success');
            } else {
                // Add new contractor
                savedContractor = this.contractorManager.create(contractorData);
                wasCreated = true;
                console.log('✅ Contractor created:', savedContractor);
                showNotification('Service Provider added successfully', 'success');
            }

            this.close();

            // Dispatch event for other components to update
            document.dispatchEvent(new CustomEvent('contractorsUpdated', {
                detail: {
                    action: contractorId ? 'updated' : 'created',
                    contractorId: savedContractor?.id,
                    hasCoordinates: !!coordinates,
                    contractor: savedContractor
                }
            }));

            // Dispatch contractor created event for analytics/tracking
            if (wasCreated && savedContractor) {
                document.dispatchEvent(new CustomEvent('contractorCreated', {
                    detail: {
                        contractor: savedContractor,
                        wasCreated: true,
                        source: 'contractorEditModal',
                        timestamp: new Date().toISOString()
                    }
                }));
            }

        } catch (error) {
            console.error('❌ Error saving contractor:', error);
            showNotification('Failed to save contractor. Please try again.', 'error');
        }
    }

    validateContractorData(data) {
        if (!data.name?.trim()) {
            showNotification('Contractor name is required', 'error');
            return false;
        }

        if (!data.category?.trim()) {
            showNotification('Category is required', 'error');
            return false;
        }

        // Email is now optional, but if provided must be valid
        if (data.email && data.email.trim() && !isValidEmail(data.email)) {
            showNotification('Please enter a valid email address', 'error');
            return false;
        }

        if (!isValidSouthAfricanPhone(data.phone)) {
            showNotification('Please enter a valid South African phone number (e.g., +27821234567, 0821234567, or 0123456789)', 'error');
            return false;
        }

        if (data.website && !isValidUrl(data.website)) {
            showNotification('Please enter a valid website URL (include http:// or https://)', 'error');
            return false;
        }

        return true;
    }

    destroy() {
        this.removeEventListeners();
        if (this.areaAutocomplete) {
            this.areaAutocomplete.destroy();
        }
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
    }
}

export default ContractorEditModalManager;