// js/app/modals/contractorEditModalManager.js
// SIMPLIFIED: Fixed missing disableAreaInput method

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
    }

    init() {
        this.createModal();
        this.bindEvents();
        console.log('✅ ContractorEditModalManager initialized');
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
                        <div class="dialog-subtitle" id="formSubtitle">Create a new service provider profile</div>
                    </div>
                    <button class="material-icon-button close" id="closeContractorEditModal" aria-label="Close modal">
                        <i class="material-icons">close</i>
                    </button>
                </div>
                <div class="modal-body material-dialog-body">
                    <form id="contractorEditForm">
                        <input type="hidden" id="contractorEditId">

                        <!-- Basic Information -->
                        <div class="contractor-form-section">
                            <h3 class="material-section-title"><i class="material-icons">business_center</i>Basic Information</h3>
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

                        <!-- Contact Information -->
                        <div class="contractor-form-section">
                            <h3 class="material-section-title"><i class="material-icons">contact_page</i>Contact Information</h3>
                            <div class="contractor-form-fields">
                                <div class="material-form-group">
                                    <label for="contractorEditEmail" class="material-input-label">Email Address (optional)</label>
                                    <input type="email" id="contractorEditEmail" name="email" class="material-input" placeholder="email@example.com">
                                </div>

                                <div class="material-form-group">
                                    <label for="contractorEditPhone" class="material-input-label">Phone Number *</label>
                                    <input type="tel" id="contractorEditPhone" name="phone" class="material-input" required>
                                    <div class="material-input-helper">South African format: +27 or 0 followed by 9 digits</div>
                                </div>

                                <div class="material-form-group">
                                    <label for="contractorEditWebsite" class="material-input-label">Website (optional)</label>
                                    <input type="url" id="contractorEditWebsite" name="website" class="material-input" placeholder="https://example.com">
                                </div>
                            </div>
                        </div>

                        <!-- Service Location -->
                        <div class="contractor-form-section">
                            <h3 class="material-section-title"><i class="material-icons">location_on</i>Service Location</h3>
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
                    <button type="button" class="mdc-button mdc-button--outlined" id="cancelContractorEdit">Cancel</button>
                    <button type="button" class="mdc-button mdc-button--raised" id="saveContractorEdit">
                        <i class="material-icons mdc-button__icon">save</i>Save Service Provider
                    </button>
                </div>
            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('contractorEditModal');
    }

    bindEvents() {
        // Simple event delegation - no complex listener management
        document.addEventListener('click', (e) => {
            if (e.target.matches('#saveContractorEdit, #saveContractorEdit *')) {
                e.preventDefault();
                this.handleSubmit();
            }
            else if (e.target.matches('#closeContractorEditModal, #cancelContractorEdit, #closeContractorEditModal *, #cancelContractorEdit *')) {
                e.preventDefault();
                this.close();
            }
            else if (e.target === this.modal) {
                e.preventDefault();
                this.close();
            }
        });

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal?.style.display === 'flex') {
                this.close();
            }
        });

        // Form changes
        document.addEventListener('change', (e) => {
            if (e.target.id === 'contractorEditProvince') {
                this.handleProvinceChange(e.target.value);
            }
            else if (e.target.id === 'contractorEditArea' && e.target.value.trim()) {
                this.setupRealTimeGeocoding();
            }
        });

        // Prevent form submission
        document.getElementById('contractorEditForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
        });

        // Listen for modal opening events
        document.addEventListener('showContractorEditModal', (event) => {
            this.openForCreate(event.detail?.context);
        });
    }

    openForCreate(prefillData = null) {
        this.open(null);
        
        if (prefillData) {
            setTimeout(() => this.prefillForm(prefillData), 50);
        }
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
            this.areaAutocomplete?.hideSuggestions();
        }, 300);
    }

    populateForm(contractor) {
        const title = document.getElementById('formTitle');
        const subtitle = document.getElementById('formSubtitle');

        if (contractor) {
            title.textContent = 'Edit Service Provider';
            subtitle.textContent = `Update ${contractor.name}'s profile`;
            document.getElementById('contractorEditId').value = contractor.id;
            this.populateContractorData(contractor);
        } else {
            title.textContent = 'Add Service Provider';
            subtitle.textContent = 'Create a new service provider profile';
            document.getElementById('contractorEditId').value = '';
            document.getElementById('contractorEditForm').reset();
            this.disableAreaInput();
        }

        this.populateCategories();
        this.populateProvinces();
        this.initAreaAutocomplete();
        this.updateGeocodingStatus('ready', 'Location detection ready');
    }

    // ADDED BACK: disableAreaInput method
    disableAreaInput() {
        const areaInput = document.getElementById('contractorEditArea');
        areaInput.disabled = true;
        areaInput.placeholder = 'Select province first';
        areaInput.value = '';
        this.areaAutocomplete?.hideSuggestions();
    }

    // ADDED BACK: enableAreaInput method  
    enableAreaInput() {
        const areaInput = document.getElementById('contractorEditArea');
        areaInput.disabled = false;
        areaInput.placeholder = 'Start typing area name...';
    }

    prefillForm(prefillData) {
        const { name, category, location } = prefillData;

        if (name) {
            const nameInput = document.getElementById('contractorEditName');
            if (nameInput) nameInput.value = name.trim();
        }

        if (category) {
            const categorySelect = document.getElementById('contractorEditCategory');
            if (categorySelect && Array.from(categorySelect.options).some(opt => opt.value === category)) {
                categorySelect.value = category;
            }
        }

        if (location) {
            this.prefillLocation(location);
        }

        this.focusNextEmptyField();
    }

    prefillLocation(location) {
        if (!location) return;

        const locationParts = location.split(',').map(part => part.trim());
        
        if (locationParts.length === 2) {
            this.setProvinceAndArea(locationParts[1], locationParts[0]);
        } else if (locationParts.length === 1) {
            this.findAndSetProvinceForArea(locationParts[0]);
        }
    }

    setProvinceAndArea(province, area) {
        const provinceSelect = document.getElementById('contractorEditProvince');
        if (provinceSelect && province && Array.from(provinceSelect.options).some(opt => opt.value === province)) {
            provinceSelect.value = province;
            provinceSelect.dispatchEvent(new Event('change', { bubbles: true }));

            setTimeout(() => {
                const areaInput = document.getElementById('contractorEditArea');
                if (areaInput && area) {
                    areaInput.value = area;
                    setTimeout(() => this.setupRealTimeGeocoding(), 100);
                }
            }, 100);
        }
    }

    findAndSetProvinceForArea(area) {
        if (!this.locationData?.southAfricanProvinces) return;

        for (const [province, provinceData] of Object.entries(this.locationData.southAfricanProvinces)) {
            if (provinceData.cities.includes(area)) {
                this.setProvinceAndArea(province, area);
                return;
            }
        }
    }

    focusNextEmptyField() {
        const requiredFields = [
            'contractorEditName', 'contractorEditCategory', 'contractorEditPhone', 
            'contractorEditProvince', 'contractorEditArea'
        ].map(id => document.getElementById(id)).filter(field => field && !field.value.trim());

        if (requiredFields.length > 0) {
            requiredFields[0].focus();
        }
    }

    populateProvinces() {
        const select = document.getElementById('contractorEditProvince');
        if (!select) return;

        select.innerHTML = '<option value="">Select Province</option>';
        
        const provinces = this.locationData?.southAfricanProvinces 
            ? Object.keys(this.locationData.southAfricanProvinces).sort()
            : ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 
               'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape'];

        provinces.forEach(province => {
            select.innerHTML += `<option value="${province}">${province}</option>`;
        });
    }

    initAreaAutocomplete() {
        if (this.areaAutocomplete) {
            this.areaAutocomplete.destroy();
        }

        this.areaAutocomplete = new AreaAutocomplete(
            geocodingService,
            this.locationData
        );

        const initialProvince = document.getElementById('contractorEditProvince')?.value;
        this.areaAutocomplete.init('areaAutocompleteContainer', 'contractorEditArea', initialProvince);
    }

    populateCategories() {
        const select = document.getElementById('contractorEditCategory');
        if (!select) return;

        select.innerHTML = '<option value="">Select Category</option>';
        const categories = this.categoriesModule.getCategories();
        
        categories.sort((a, b) => a.name.localeCompare(b.name))
            .forEach(category => {
                select.innerHTML += `<option value="${category.name}">${category.name}</option>`;
            });
    }

    populateContractorData(contractor) {
        document.getElementById('contractorEditName').value = contractor.name || '';
        document.getElementById('contractorEditCategory').value = contractor.category || '';
        document.getElementById('contractorEditEmail').value = contractor.email || '';
        document.getElementById('contractorEditPhone').value = contractor.phone || '';
        document.getElementById('contractorEditWebsite').value = contractor.website || '';

        if (contractor.location) {
            const [area, province] = contractor.location.split(', ').map(part => part.trim());
            if (province) {
                document.getElementById('contractorEditProvince').value = province;
                this.updateAreaInput(province, area);
                setTimeout(() => this.setupRealTimeGeocoding(), 500);
            }
        }
    }

    handleProvinceChange(province) {
        this.updateAreaInput(province);
        this.areaAutocomplete?.setProvince(province);
    }

    updateAreaInput(province, selectedArea = '') {
        const areaInput = document.getElementById('contractorEditArea');
        
        if (!province) {
            this.disableAreaInput();
            this.updateGeocodingStatus('ready', 'Select province first');
        } else {
            this.enableAreaInput();
            if (selectedArea) areaInput.value = selectedArea;
            this.areaAutocomplete?.setProvince(province);
            this.updateGeocodingStatus('ready', 'Type area name for suggestions');
        }
    }

    async setupRealTimeGeocoding() {
        const province = document.getElementById('contractorEditProvince')?.value;
        const area = document.getElementById('contractorEditArea')?.value;

        if (!province || !area || this.isGeocoding) return;

        this.isGeocoding = true;
        this.updateGeocodingStatus('loading', 'Detecting location coordinates...');

        try {
            const geocodingResult = await geocodingService.geocodeLocation(`${area}, ${province}`);
            
            if (geocodingResult.coordinates) {
                this.updateGeocodingStatus('success', `Location confirmed`);
            } else {
                this.updateGeocodingStatus('warning', 'Location not found. Using default coordinates.');
            }
        } catch (error) {
            this.updateGeocodingStatus('error', 'Location service unavailable.');
        } finally {
            this.isGeocoding = false;
        }
    }

    updateGeocodingStatus(status, message) {
        const container = document.getElementById('geocodingEditStatusContainer');
        const statusElement = document.getElementById('geocodingEditStatus');

        if (!container || !statusElement) return;

        if (status === 'ready') {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        statusElement.className = `geocoding-status geocoding-status--${status}`;
        
        const icon = status === 'success' ? 'location_on' : 
                    status === 'error' ? 'location_off' : 'location_searching';

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
        let coordinates = null;

        try {
            const geocodingResult = await geocodingService.geocodeLocation(location);
            coordinates = geocodingResult.coordinates;
        } catch (error) {
            console.warn('Geocoding failed:', error);
        }

        const formData = new FormData(document.getElementById('contractorEditForm'));
        const contractorData = {
            name: formData.get('name'),
            category: formData.get('category'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            website: formData.get('website'),
            location: location,
            coordinates: coordinates,
            serviceAreas: []
        };

        if (!this.validateContractorData(contractorData)) return;

        const contractorId = document.getElementById('contractorEditId').value;

        try {
            let savedContractor;
            let wasCreated = false;

            if (contractorId) {
                savedContractor = this.contractorManager.update(contractorId, contractorData);
                showNotification('Service Provider updated successfully', 'success');
            } else {
                savedContractor = this.contractorManager.create(contractorData);
                wasCreated = true;
                showNotification('Service Provider added successfully', 'success');
            }

            this.close();

            document.dispatchEvent(new CustomEvent('contractorsUpdated', {
                detail: { action: contractorId ? 'updated' : 'created', contractor: savedContractor }
            }));

            if (wasCreated) {
                document.dispatchEvent(new CustomEvent('contractorCreated', {
                    detail: { contractor: savedContractor, wasCreated: true }
                }));
            }

        } catch (error) {
            console.error('Error saving contractor:', error);
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

        if (data.email && data.email.trim() && !isValidEmail(data.email)) {
            showNotification('Please enter a valid email address', 'error');
            return false;
        }

        if (!isValidSouthAfricanPhone(data.phone)) {
            showNotification('Please enter a valid South African phone number', 'error');
            return false;
        }

        if (data.website && !isValidUrl(data.website)) {
            showNotification('Please enter a valid website URL', 'error');
            return false;
        }

        return true;
    }
}

export default ContractorEditModalManager;