// js/app/views/contractorEditView.js
import { geocodingService } from '../../modules/geocodingService.js';
import { showNotification } from '../../modules/notifications.js';
import { isValidEmail, isValidSouthAfricanPhone, isValidUrl } from '../../modules/validation.js';
import { AreaAutocomplete } from '../../modules/areaAutocomplete.js';
import { BaseView } from './BaseView.js';
import { createViewHeader } from '../utils/viewHelpers.js';

export class ContractorEditView extends BaseView {
    constructor(dataModule, contractorManager, categoriesModule, locationData) {
        super('contractor-edit-view');
        this.dataModule = dataModule;
        this.contractorManager = contractorManager;
        this.categoriesModule = categoriesModule;
        this.locationData = locationData;
        this.isGeocoding = false;
        this.currentContractor = null;
        this.areaAutocomplete = null;
        this.prefillData = null;
        this.headerHelper = null;
    }

    render() {
        const mainContainer = document.getElementById('mainViewContainer');
        if (!mainContainer) return;

        if (!this.container) {
            this.container = document.createElement('section');
            this.container.id = this.viewId;
            this.container.className = 'contractor-edit-view';
            this.container.style.display = 'none';
            mainContainer.appendChild(this.container);
        }

        this.renderForm();
    }

    renderForm() {
        this.headerHelper = createViewHeader(
            this.viewId,
            'Add Service Provider',
            'Create a new service provider profile'
        );

        this.container.innerHTML = `
            <div class="contractor-edit-content">
                ${this.headerHelper.html}
                <div class="view-content">
                    <form id="contractorEditViewForm" class="contractor-edit-form">
                        <input type="hidden" id="contractorEditViewId">
                        ${this.createBasicInfoSection()}
                        ${this.createContactInfoSection()}
                        ${this.createLocationSection()}
                        ${this.createActionsSection()}
                    </form>
                </div>
            </div>
        `;

        this.bindEvents();
        this.populateForm(this.currentContractor);
    }

    createBasicInfoSection() {
        return `
            <div class="contractor-form-section">
                <h3 class="material-section-title">
                    <i class="material-icons">business_center</i>
                    Basic Information
                </h3>
                <div class="contractor-form-fields">
                    <div class="material-form-group">
                        <label for="contractorEditViewName" class="material-input-label">Service Provider Name *</label>
                        <input type="text" id="contractorEditViewName" name="name" class="material-input" required>
                        <div class="material-input-helper">Enter the full business or individual name</div>
                    </div>

                    <div class="material-form-group">
                        <label for="contractorEditViewCategory" class="material-input-label">Service Category *</label>
                        <select id="contractorEditViewCategory" name="category" class="material-select" required>
                            <option value="">Select Category</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    }

    createContactInfoSection() {
        return `
            <div class="contractor-form-section">
                <h3 class="material-section-title">
                    <i class="material-icons">contact_page</i>
                    Contact Information
                </h3>
                <div class="contractor-form-fields">
                    <div class="material-form-group">
                        <label for="contractorEditViewEmail" class="material-input-label">Email Address (optional)</label>
                        <input type="email" id="contractorEditViewEmail" name="email" class="material-input" placeholder="email@example.com">
                    </div>

                    <div class="material-form-group">
                        <label for="contractorEditViewPhone" class="material-input-label">Phone Number *</label>
                        <input type="tel" id="contractorEditViewPhone" name="phone" class="material-input" required>
                        <div class="material-input-helper">South African format: +27 or 0 followed by 9 digits</div>
                    </div>

                    <div class="material-form-group">
                        <label for="contractorEditViewWebsite" class="material-input-label">Website (optional)</label>
                        <input type="url" id="contractorEditViewWebsite" name="website" class="material-input" placeholder="https://example.com">
                    </div>
                </div>
            </div>
        `;
    }

    createLocationSection() {
        return `
            <div class="contractor-form-section">
                <h3 class="material-section-title">
                    <i class="material-icons">location_on</i>
                    Service Location
                </h3>
                <div class="contractor-form-fields">
                    <div class="material-form-group">
                        <label for="contractorEditViewProvince" class="material-input-label">Province *</label>
                        <select id="contractorEditViewProvince" name="province" class="material-select" required>
                            <option value="">Select Province</option>
                        </select>
                    </div>
                    <div class="material-form-group">
                        <label for="contractorEditViewArea" class="material-input-label">Area *</label>
                        <div id="areaAutocompleteViewContainer" class="area-autocomplete-container">
                            <input type="text" id="contractorEditViewArea" name="area" class="material-input" required disabled 
                                   placeholder="Select province first" autocomplete="off">
                        </div>
                        <div class="material-input-helper">Start typing area name for suggestions</div>
                    </div>
                    
                    <div id="geocodingEditViewStatusContainer" class="geocoding-status-container" style="display: none;">
                        <div class="material-form-group">
                            <div id="geocodingEditViewStatus" class="geocoding-status">
                                <i class="material-icons geocoding-status-icon">location_searching</i>
                                <span class="geocoding-status-text">Location detection ready</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createActionsSection() {
        return `
            <div class="form-actions">
                <button type="button" class="mdc-button mdc-button--outlined" id="cancelContractorEditView">
                    Cancel
                </button>
                <button type="button" class="mdc-button mdc-button--raised" id="saveContractorEditView">
                    <i class="material-icons mdc-button__icon">save</i>
                    Save Service Provider
                </button>
            </div>
        `;
    }

    show(contractor = null, prefillData = null) {
        super.show(); // Use BaseView display logic
        this.currentContractor = contractor;
        this.prefillData = prefillData;
        
        this.populateForm(contractor);
        
        if (prefillData) {
            setTimeout(() => this.prefillForm(prefillData), 50);
        }
    }

    hide() {
        super.hide(); // Use BaseView display logic
        this.currentContractor = null;
        this.prefillData = null;
        this.areaAutocomplete?.destroy();
    }

    bindEvents() {
        if (this.headerHelper) {
            this.headerHelper.bindBackButton(() => this.handleCancel());
        }

        document.getElementById('saveContractorEditView')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        document.getElementById('cancelContractorEditView')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleCancel();
        });

        document.getElementById('contractorEditViewProvince')?.addEventListener('change', (e) => {
            this.handleProvinceChange(e.target.value);
        });

        document.getElementById('contractorEditViewArea')?.addEventListener('change', (e) => {
            if (e.target.value.trim()) {
                this.setupRealTimeGeocoding();
            }
        });

        document.getElementById('contractorEditViewForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
        });
    }

    handleCancel() {
        document.dispatchEvent(new CustomEvent('navigationViewChange', {
            detail: { view: 'back' }
        }));
    }

    populateForm(contractor) {
        if (!this.headerHelper) return;

        if (contractor) {
            this.headerHelper.updateHeader(
                'Edit Service Provider',
                `Update ${contractor.name}'s profile`
            );
            document.getElementById('contractorEditViewId').value = contractor.id;
            this.populateContractorData(contractor);
        } else {
            this.headerHelper.updateHeader(
                'Add Service Provider',
                'Create a new service provider profile'
            );
            document.getElementById('contractorEditViewId').value = '';
            document.getElementById('contractorEditViewForm').reset();
            this.disableAreaInput();
        }

        this.populateCategories();
        this.populateProvinces();
        this.initAreaAutocomplete();
        this.updateGeocodingStatus('ready', 'Location detection ready');

        if (this.prefillData && !contractor) {
            setTimeout(() => this.prefillForm(this.prefillData), 50);
        }
    }

    disableAreaInput() {
        const areaInput = document.getElementById('contractorEditViewArea');
        areaInput.disabled = true;
        areaInput.placeholder = 'Select province first';
        areaInput.value = '';
        this.areaAutocomplete?.hideSuggestions();
    }

    enableAreaInput() {
        const areaInput = document.getElementById('contractorEditViewArea');
        areaInput.disabled = false;
        areaInput.placeholder = 'Start typing area name...';
    }

    prefillForm(prefillData) {
        const { name, category, location } = prefillData;

        if (name) {
            const nameInput = document.getElementById('contractorEditViewName');
            if (nameInput) nameInput.value = name.trim();
        }

        if (category) {
            const categorySelect = document.getElementById('contractorEditViewCategory');
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
        const provinceSelect = document.getElementById('contractorEditViewProvince');
        if (provinceSelect && province && Array.from(provinceSelect.options).some(opt => opt.value === province)) {
            provinceSelect.value = province;
            provinceSelect.dispatchEvent(new Event('change', { bubbles: true }));

            setTimeout(() => {
                const areaInput = document.getElementById('contractorEditViewArea');
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
            'contractorEditViewName', 'contractorEditViewCategory', 'contractorEditViewPhone', 
            'contractorEditViewProvince', 'contractorEditViewArea'
        ].map(id => document.getElementById(id)).filter(field => field && !field.value.trim());

        if (requiredFields.length > 0) {
            requiredFields[0].focus();
        }
    }

    populateProvinces() {
        const select = document.getElementById('contractorEditViewProvince');
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

        const initialProvince = document.getElementById('contractorEditViewProvince')?.value;
        this.areaAutocomplete.init('areaAutocompleteViewContainer', 'contractorEditViewArea', initialProvince);
    }

    populateCategories() {
        const select = document.getElementById('contractorEditViewCategory');
        if (!select) return;

        select.innerHTML = '<option value="">Select Category</option>';
        const categories = this.categoriesModule.getCategories();
        
        categories.sort((a, b) => a.name.localeCompare(b.name))
            .forEach(category => {
                select.innerHTML += `<option value="${category.name}">${category.name}</option>`;
            });
    }

    populateContractorData(contractor) {
        document.getElementById('contractorEditViewName').value = contractor.name || '';
        document.getElementById('contractorEditViewCategory').value = contractor.category || '';
        document.getElementById('contractorEditViewEmail').value = contractor.email || '';
        document.getElementById('contractorEditViewPhone').value = contractor.phone || '';
        document.getElementById('contractorEditViewWebsite').value = contractor.website || '';

        if (contractor.location) {
            const [area, province] = contractor.location.split(', ').map(part => part.trim());
            if (province) {
                document.getElementById('contractorEditViewProvince').value = province;
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
        const areaInput = document.getElementById('contractorEditViewArea');
        
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
        const province = document.getElementById('contractorEditViewProvince')?.value;
        const area = document.getElementById('contractorEditViewArea')?.value;

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
        const container = document.getElementById('geocodingEditViewStatusContainer');
        const statusElement = document.getElementById('geocodingEditViewStatus');

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
        const province = document.getElementById('contractorEditViewProvince')?.value;
        const area = document.getElementById('contractorEditViewArea')?.value;

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

        const formData = new FormData(document.getElementById('contractorEditViewForm'));
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

        const contractorId = document.getElementById('contractorEditViewId').value;

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

            this.handleCancel();

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

export default ContractorEditView;