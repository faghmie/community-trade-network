/**
 * Admin Contractor Modal
 * Complete modal for contractor CRUD operations with all data type attributes
 * Refactored to use BaseModal for common functionality
 */

import BaseModal from '../shared/base-modal.js';
import { showNotification } from '../../modules/notifications.js';
import { isValidEmail, isValidSouthAfricanPhone, isValidUrl } from '../../modules/validation.js';

class ContractorModal extends BaseModal {
    constructor(contractorManager, categoriesModule, locationData) {
        super('adminContractorEditModal', 'Service Provider');
        this.contractorManager = contractorManager;
        this.categoriesModule = categoriesModule;
        this.locationData = locationData;
    }

    /**
     * Generate modal body with form sections
     */
    generateModalBody() {
        return `
            <form id="adminContractorEditForm" class="material-form">
                <input type="hidden" id="adminContractorId">
                ${this.generateBasicInformationSection()}
                ${this.generateContactInformationSection()}
                ${this.generateServiceInformationSection()}
                ${this.generateLocationSection()}
                ${this.generateBusinessDetailsSection()}
            </form>
        `;
    }

    /**
     * Generate basic information section
     */
    generateBasicInformationSection() {
        return `
            <div class="form-section">
                <h3 class="section-title">Basic Information</h3>
                <div class="form-fields">
                    <div class="material-form-group">
                        <label for="adminContractorName" class="material-input-label">Service Provider Name *</label>
                        <input type="text" id="adminContractorName" name="name" class="material-input" required>
                        <div class="material-input-helper">Full business or individual name</div>
                    </div>

                    <div class="material-form-group">
                        <label for="adminContractorCategory" class="material-input-label">Service Category *</label>
                        <select id="adminContractorCategory" name="category" class="material-select" required>
                            <option value="">Select Category</option>
                        </select>
                        <div class="material-input-helper">Primary service category</div>
                    </div>

                    <div class="material-form-group full-width">
                        <label for="adminContractorDescription" class="material-input-label">Service Description *</label>
                        <textarea id="adminContractorDescription" name="description" class="material-input" required rows="3" placeholder="Describe the services offered..."></textarea>
                        <div class="material-input-helper">Detailed description of services provided</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate contact information section
     */
    generateContactInformationSection() {
        return `
            <div class="form-section">
                <h3 class="section-title">Contact Information</h3>
                <div class="form-fields">
                    <div class="material-form-group">
                        <label for="adminContractorEmail" class="material-input-label">Email Address</label>
                        <input type="email" id="adminContractorEmail" name="email" class="material-input">
                        <div class="material-input-helper">Optional email address</div>
                    </div>

                    <div class="material-form-group">
                        <label for="adminContractorPhone" class="material-input-label">Phone Number *</label>
                        <input type="tel" id="adminContractorPhone" name="phone" class="material-input" required>
                        <div class="material-input-helper">South African phone number</div>
                    </div>

                    <div class="material-form-group">
                        <label for="adminContractorWebsite" class="material-input-label">Website</label>
                        <input type="url" id="adminContractorWebsite" name="website" class="material-input">
                        <div class="material-input-helper">Optional website URL</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate service information section
     */
    generateServiceInformationSection() {
        return `
            <div class="form-section">
                <h3 class="section-title">Service Details</h3>
                <div class="form-fields">
                    <div class="material-form-group full-width">
                        <label for="adminContractorServices" class="material-input-label">Services Offered</label>
                        <textarea id="adminContractorServices" name="services" class="material-input" rows="2" placeholder="List specific services (one per line)"></textarea>
                        <div class="material-input-helper">Enter one service per line</div>
                    </div>

                    <div class="material-form-group">
                        <label for="adminContractorYearsInBusiness" class="material-input-label">Years in Business</label>
                        <input type="text" id="adminContractorYearsInBusiness" name="yearsInBusiness" class="material-input" placeholder="e.g., 5+ years">
                        <div class="material-input-helper">Years of experience</div>
                    </div>

                    <div class="material-form-group full-width">
                        <label for="adminContractorProjectTypes" class="material-input-label">Project Types</label>
                        <textarea id="adminContractorProjectTypes" name="projectTypes" class="material-input" rows="2" placeholder="List project types (one per line)"></textarea>
                        <div class="material-input-helper">Enter one project type per line</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate location section
     */
    generateLocationSection() {
        return `
            <div class="form-section">
                <h3 class="section-title">Service Location</h3>
                <div class="form-fields">
                    <div class="material-form-group">
                        <label for="adminContractorProvince" class="material-input-label">Province *</label>
                        <select id="adminContractorProvince" name="province" class="material-select" required>
                            <option value="">Select Province</option>
                        </select>
                        <div class="material-input-helper">Service province</div>
                    </div>
                    <div class="material-form-group">
                        <label for="adminContractorArea" class="material-input-label">Area *</label>
                        <input type="text" id="adminContractorArea" name="area" class="material-input" required>
                        <div class="material-input-helper">Specific area or suburb</div>
                    </div>
                    
                    <div class="material-form-group full-width">
                        <label for="adminContractorServiceAreas" class="material-input-label">Service Areas</label>
                        <textarea id="adminContractorServiceAreas" name="serviceAreas" class="material-input" rows="2" placeholder="List areas where services are offered (one per line)"></textarea>
                        <div class="material-input-helper">Enter one area per line</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate business details section
     */
    generateBusinessDetailsSection() {
        return `
            <div class="form-section">
                <h3 class="section-title">Business Details</h3>
                <div class="form-fields">
                    <div class="material-form-group full-width">
                        <label for="adminContractorBusinessHours" class="material-input-label">Business Hours</label>
                        <input type="text" id="adminContractorBusinessHours" name="businessHours" class="material-input" placeholder="e.g., Mon-Fri 8:00-17:00">
                        <div class="material-input-helper">Operating hours</div>
                    </div>

                    <div class="material-form-group">
                        <label for="adminContractorEmergencyContact" class="material-input-label">Emergency Contact</label>
                        <input type="text" id="adminContractorEmergencyContact" name="emergencyContact" class="material-input">
                        <div class="material-input-helper">After-hours contact</div>
                    </div>

                    <div class="material-form-group checkbox-group">
                        <label class="material-checkbox">
                            <input type="checkbox" id="adminContractorIsVerified" name="isVerified">
                            <span class="checkmark"></span>
                            Verified Contractor
                        </label>
                    </div>

                    <div class="material-form-group checkbox-group">
                        <label class="material-checkbox">
                            <input type="checkbox" id="adminContractorIsActive" name="isActive" checked>
                            <span class="checkmark"></span>
                            Active
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Initialize modal with dropdown data
     */
    async initializeModal() {
        this.populateDropdowns();
    }

    /**
     * Populate dropdowns with data
     */
    populateDropdowns() {
        this.populateProvinces();
        this.populateCategories();
    }

    /**
     * Populate provinces dropdown
     */
    populateProvinces() {
        const select = this.modalElement.querySelector('#adminContractorProvince');
        if (!select) return;

        select.innerHTML = '<option value="">Select Province</option>';

        const provinces = this.locationData?.southAfricanProvinces ?
            Object.keys(this.locationData.southAfricanProvinces).sort() :
            ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo',
                'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape'];

        provinces.forEach(province => {
            select.innerHTML += `<option value="${province}">${province}</option>`;
        });
    }

    /**
     * Populate categories dropdown
     */
    populateCategories() {
        const select = this.modalElement.querySelector('#adminContractorCategory');
        if (!select) return;

        select.innerHTML = '<option value="">Select Category</option>';
        const categories = this.categoriesModule.getCategories();

        categories.sort((a, b) => a.name.localeCompare(b.name))
            .forEach(category => {
                select.innerHTML += `<option value="${category.name}">${category.name}</option>`;
            });
    }

    /**
     * Populate form with contractor data
     */
    async populateModal(contractor, options) {
        const form = this.modalElement.querySelector('#adminContractorEditForm');
        if (!form) return;

        if (contractor) {
            // Edit/View mode
            this.setFormValue('adminContractorId', contractor.id || '');
            this.setFormValue('adminContractorName', contractor.name || '');
            this.setFormValue('adminContractorCategory', contractor.category || '');
            this.setFormValue('adminContractorEmail', contractor.email || '');
            this.setFormValue('adminContractorPhone', contractor.phone || '');
            this.setFormValue('adminContractorWebsite', contractor.website || '');
            this.setFormValue('adminContractorDescription', contractor.description || '');
            this.setFormValue('adminContractorYearsInBusiness', contractor.yearsInBusiness || '');
            this.setFormValue('adminContractorBusinessHours', contractor.businessHours || '');
            this.setFormValue('adminContractorEmergencyContact', contractor.emergencyContact || '');
            this.setFormValue('adminContractorServices', Array.isArray(contractor.services) ? contractor.services.join('\n') : contractor.services || '');
            this.setFormValue('adminContractorProjectTypes', Array.isArray(contractor.projectTypes) ? contractor.projectTypes.join('\n') : contractor.projectTypes || '');
            this.setFormValue('adminContractorServiceAreas', Array.isArray(contractor.serviceAreas) ? contractor.serviceAreas.join('\n') : contractor.serviceAreas || '');

            // Handle checkboxes
            const isVerifiedCheckbox = document.getElementById('adminContractorIsVerified');
            const isActiveCheckbox = document.getElementById('adminContractorIsActive');
            if (isVerifiedCheckbox) isVerifiedCheckbox.checked = contractor.isVerified || false;
            if (isActiveCheckbox) isActiveCheckbox.checked = contractor.isActive !== false; // Default to true

            // Handle location
            if (contractor.location) {
                const [area, province] = contractor.location.split(', ').map(part => part.trim());
                if (province) this.setFormValue('adminContractorProvince', province);
                if (area) this.setFormValue('adminContractorArea', area);
            }
        } else {
            // Add mode
            form.reset();
            this.setFormValue('adminContractorId', '');

            // Set default values for checkboxes
            const isActiveCheckbox = document.getElementById('adminContractorIsActive');
            if (isActiveCheckbox) isActiveCheckbox.checked = true;
        }
    }

    /**
     * Get form data as object
     */
    async getFormData() {
        const form = this.modalElement.querySelector('#adminContractorEditForm');
        const formData = new FormData(form);

        // Convert textarea newlines to arrays
        const services = formData.get('services')?.split('\n').filter(s => s.trim()) || [];
        const projectTypes = formData.get('projectTypes')?.split('\n').filter(p => p.trim()) || [];
        const serviceAreas = formData.get('serviceAreas')?.split('\n').filter(a => a.trim()) || [];

        return {
            id: this.currentData?.id,
            name: formData.get('name'),
            category: formData.get('category'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            website: formData.get('website'),
            description: formData.get('description'),
            yearsInBusiness: formData.get('yearsInBusiness'),
            businessHours: formData.get('businessHours'),
            emergencyContact: formData.get('emergencyContact'),
            services: services,
            projectTypes: projectTypes,
            serviceAreas: serviceAreas,
            location: `${formData.get('area')}, ${formData.get('province')}`,
            isVerified: document.getElementById('adminContractorIsVerified').checked,
            isActive: document.getElementById('adminContractorIsActive').checked
        };
    }

    /**
     * Validate form data
     */
    validateForm(data) {
        if (!data.name?.trim()) {
            showNotification('Service Provider name is required', 'error');
            return false;
        }

        if (!data.category?.trim()) {
            showNotification('Category is required', 'error');
            return false;
        }

        if (!data.description?.trim()) {
            showNotification('Service description is required', 'error');
            return false;
        }

        if (!isValidSouthAfricanPhone(data.phone)) {
            showNotification('Please enter a valid South African phone number', 'error');
            return false;
        }

        if (data.email && !isValidEmail(data.email)) {
            showNotification('Please enter a valid email address', 'error');
            return false;
        }

        if (data.website && !isValidUrl(data.website)) {
            showNotification('Please enter a valid website URL', 'error');
            return false;
        }

        return true;
    }

    /**
     * Handle save - save contractor data
     */
    async handleSave() {
        try {
            const formData = await this.getFormData();
            if (!this.validateForm(formData)) {
                return;
            }

            // Just pass the data to the callback, let AdminContractorsModule handle the save
            if (this.onSaveCallback) {
                await this.onSaveCallback(formData, null);
            }

            this.close();
        } catch (error) {
            console.error('Error in contractor modal:', error);
            if (this.onSaveCallback) {
                await this.onSaveCallback(null, error);
            }
        }
    }

    /**
     * Show success message
     */
    showSuccessMessage(contractor) {
        const action = this.currentData ? 'updated' : 'added';
        showNotification(`Service Provider ${action} successfully`, 'success');
    }

    /**
     * Dispatch update event
     */
    dispatchUpdateEvent(contractor) {
        document.dispatchEvent(new CustomEvent('adminContractorUpdated', {
            detail: {
                action: this.currentData ? 'updated' : 'created',
                contractor: contractor
            }
        }));
    }

    /**
     * Public methods for different open modes
     */
    openForCreate(onSave = null) {
        this.open(null, { onSave });
    }

    openForEdit(contractor, onSave = null) {
        this.open(contractor, { onSave });
    }

    openForView(contractor) {
        this.open(contractor, { viewMode: true });
    }
}

export default ContractorModal;