// js/app/views/contractorEditView.js
import { showNotification } from '../../modules/notifications.js';
import { isValidEmail, isValidSouthAfricanPhone, isValidUrl } from '../../modules/validation.js';
import { BaseView } from './BaseView.js';
import { createViewHeader } from '../utils/viewHelpers.js';
import { confirmationModal } from '../../modules/confirmationModal.js';

export class ContractorEditView extends BaseView {
    constructor(dataModule, contractorManager, categoriesModule, locationData) {
        super('contractor-edit-view');
        this.dataModule = dataModule;
        this.contractorManager = contractorManager;
        this.categoriesModule = categoriesModule;
        this.locationData = locationData;
        this.currentContractor = null;
        this.prefillData = null;
        this.headerHelper = null;
        this.originalFormData = null;
        this.isDetailsExpanded = false;
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
            'Share a trusted service provider with the community'
        );

        this.container.innerHTML = `
            <div class="contractor-edit-content">
                ${this.headerHelper.html}
                <div class="view-content">
                    <form id="contractorEditViewForm" class="contractor-edit-form">
                        <input type="hidden" id="contractorEditViewId">
                        
                        <!-- Quick Add Section -->
                        <div class="quick-add-section">
                            <div class="section-header">
                                <i class="material-icons">bolt</i>
                                <div class="section-header-content">
                                    <h3>Quick Add</h3>
                                </div>
                            </div>
                            
                            <div class="quick-add-fields">
                                ${this.createQuickAddFields()}
                            </div>
                        </div>

                        <!-- More Details Section -->
                        <div class="more-details-section ${this.isDetailsExpanded ? 'expanded' : 'collapsed'}">
                            <div class="section-toggle" id="detailsSectionToggle">
                                <div class="section-header">
                                    <i class="material-icons">description</i>
                                    <div class="section-header-content">
                                        <h3>More Details <span class="optional-badge">Optional</span></h3>
                                    </div>
                                </div>
                                <i class="material-icons toggle-icon">expand_more</i>
                            </div>
                            
                            <div class="more-details-content" id="moreDetailsContent">
                                ${this.createContactInfoSection()}
                                ${this.createLocationSection()}
                                ${this.createAdditionalInfoSection()}
                            </div>
                        </div>

                        ${this.createActionsSection()}
                    </form>
                </div>
            </div>
        `;

        this.bindEvents();
        this.populateForm(this.currentContractor);
    }

    createQuickAddFields() {
        return `
            <div class="quick-add-grid">
                <div class="material-form-group">
                    <label for="contractorEditViewName" class="material-input-label">
                        Service Provider Name *
                        <span class="required-indicator">*</span>
                    </label>
                    <input type="text" id="contractorEditViewName" name="name" class="material-input" required 
                           placeholder="e.g., Mike's Electrical Services">
                    <div class="material-input-helper">Business or individual name as known in the community</div>
                </div>

                <div class="material-form-group">
                    <label for="contractorEditViewCategory" class="material-input-label">
                        Service Category *
                        <span class="required-indicator">*</span>
                    </label>
                    <select id="contractorEditViewCategory" name="category" class="material-select" required>
                        <option value="">Select Category</option>
                    </select>
                    <div class="material-input-helper">What type of service do they provide?</div>
                </div>

                <div class="material-form-group">
                    <label for="contractorEditViewPhone" class="material-input-label">
                        Phone Number *
                        <span class="required-indicator">*</span>
                    </label>
                    <input type="tel" id="contractorEditViewPhone" name="phone" class="material-input" required
                           placeholder="e.g., 082 123 4567">
                    <div class="material-input-helper">Primary contact number for the community</div>
                </div>

                <div class="material-form-group full-width">
                    <label for="contractorEditViewDescription" class="material-input-label">
                        Service Description *
                        <span class="required-indicator">*</span>
                    </label>
                    <textarea id="contractorEditViewDescription" name="description" class="material-textarea" required
                              placeholder="Describe what they do well, their specialties, or why you recommend them..."
                              rows="3"></textarea>
                    <div class="material-input-helper">Help others understand their expertise and strengths</div>
                </div>
            </div>
        `;
    }

    createContactInfoSection() {
        return `
            <div class="contractor-form-section">
                <h4 class="material-section-subtitle">
                    <i class="material-icons">contact_page</i>
                    Contact Information
                </h4>
                <div class="contractor-form-fields">
                    <div class="material-form-group">
                        <label for="contractorEditViewEmail" class="material-input-label">Email Address</label>
                        <input type="email" id="contractorEditViewEmail" name="email" class="material-input" 
                               placeholder="email@example.com">
                    </div>

                    <div class="material-form-group">
                        <label for="contractorEditViewWebsite" class="material-input-label">Website or Social Media</label>
                        <input type="url" id="contractorEditViewWebsite" name="website" class="material-input" 
                               placeholder="https://example.com or social media profile">
                    </div>
                </div>
            </div>
        `;
    }

    createLocationSection() {
        return `
            <div class="contractor-form-section">
                <h4 class="material-section-subtitle">
                    <i class="material-icons">location_on</i>
                    Service Location
                </h4>
                <div class="contractor-form-fields">
                    <div class="material-form-group">
                        <label for="contractorEditViewProvince" class="material-input-label">Province</label>
                        <select id="contractorEditViewProvince" name="province" class="material-select">
                            <option value="">Select Province (Optional)</option>
                        </select>
                    </div>
                    
                    <div class="material-form-group">
                        <label for="contractorEditViewArea" class="material-input-label">Area</label>
                        <input type="text" id="contractorEditViewArea" name="area" class="material-input" 
                               placeholder="Enter area name (e.g., Cape Town, Johannesburg)">
                        <div class="material-input-helper">Where they primarily operate</div>
                    </div>

                    <div class="material-form-group full-width">
                        <label for="contractorEditViewServiceAreas" class="material-input-label">Service Areas</label>
                        <input type="text" id="contractorEditViewServiceAreas" name="serviceAreas" class="material-input" 
                               placeholder="e.g., Cape Town, Bellville, Durbanville">
                        <div class="material-input-helper">Other areas where they provide services (comma separated)</div>
                    </div>
                </div>
            </div>
        `;
    }

    createAdditionalInfoSection() {
        return `
            <div class="contractor-form-section">
                <h4 class="material-section-subtitle">
                    <i class="material-icons">business</i>
                    Additional Information
                </h4>
                <div class="contractor-form-fields">
                    <div class="material-form-group">
                        <label for="contractorEditViewYearsInBusiness" class="material-input-label">Years in Business</label>
                        <select id="contractorEditViewYearsInBusiness" name="yearsInBusiness" class="material-select">
                            <option value="">Select Experience</option>
                            <option value="Less than 1 year">Less than 1 year</option>
                            <option value="1-2 years">1-2 years</option>
                            <option value="3-5 years">3-5 years</option>
                            <option value="5-10 years">5-10 years</option>
                            <option value="10+ years">10+ years</option>
                        </select>
                    </div>

                    <div class="material-form-group full-width">
                        <label for="contractorEditViewServices" class="material-input-label">Specific Services</label>
                        <input type="text" id="contractorEditViewServices" name="services" class="material-input" 
                               placeholder="e.g., Electrical repairs, Installation, Emergency services">
                        <div class="material-input-helper">Specific services they offer (comma separated)</div>
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
        super.show();
        this.currentContractor = contractor;
        this.prefillData = prefillData;
        this.isDetailsExpanded = !!contractor; // Expand details when editing

        this.populateForm(contractor);

        if (prefillData) {
            setTimeout(() => this.prefillForm(prefillData), 50);
        }

        setTimeout(() => {
            this.storeOriginalFormState();
            this.updateSectionToggle();
        }, 100);
    }

    hide() {
        super.hide();
        this.currentContractor = null;
        this.prefillData = null;
        this.originalFormData = null;
        this.isDetailsExpanded = false;
    }

    bindEvents() {
        if (this.headerHelper) {
            this.headerHelper.bindBackButton(() => this.handleCancel());
        }

        // Section toggle
        document.getElementById('detailsSectionToggle')?.addEventListener('click', () => {
            this.toggleDetailsSection();
        });

        // Save and cancel buttons
        document.getElementById('saveContractorEditView')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        document.getElementById('cancelContractorEditView')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleCancel();
        });

        // Form submission
        document.getElementById('contractorEditViewForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
        });

        // Track form changes
        this.setupFormChangeTracking();
    }

    toggleDetailsSection() {
        this.isDetailsExpanded = !this.isDetailsExpanded;
        this.updateSectionToggle();
    }

    updateSectionToggle() {
        const section = document.querySelector('.more-details-section');
        const toggleIcon = document.querySelector('.toggle-icon');
        const content = document.getElementById('moreDetailsContent');

        if (section && toggleIcon && content) {
            if (this.isDetailsExpanded) {
                section.classList.add('expanded');
                section.classList.remove('collapsed');
                toggleIcon.textContent = 'expand_less';
                content.style.display = 'block';
            } else {
                section.classList.add('collapsed');
                section.classList.remove('expanded');
                toggleIcon.textContent = 'expand_more';
                content.style.display = 'none';
            }
        }
    }

    setupFormChangeTracking() {
        const form = document.getElementById('contractorEditViewForm');
        if (!form) return;

        const trackedFields = [
            'contractorEditViewName', 'contractorEditViewCategory', 'contractorEditViewPhone',
            'contractorEditViewDescription', 'contractorEditViewEmail', 'contractorEditViewWebsite',
            'contractorEditViewProvince', 'contractorEditViewArea', 'contractorEditViewServiceAreas',
            'contractorEditViewYearsInBusiness', 'contractorEditViewServices'
        ];

        trackedFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', () => this.handleFormChange());
                field.addEventListener('change', () => this.handleFormChange());
            }
        });
    }

    handleFormChange() {
        // Can be used for real-time validation indicators
    }

    storeOriginalFormState() {
        this.originalFormData = this.getCurrentFormData();
    }

    getCurrentFormData() {
        const form = document.getElementById('contractorEditViewForm');
        if (!form) return null;

        const formData = new FormData(form);
        return {
            name: formData.get('name') || '',
            category: formData.get('category') || '',
            phone: formData.get('phone') || '',
            description: formData.get('description') || '',
            email: formData.get('email') || '',
            website: formData.get('website') || '',
            province: formData.get('province') || '',
            area: formData.get('area') || '',
            serviceAreas: formData.get('serviceAreas') || '',
            yearsInBusiness: formData.get('yearsInBusiness') || '',
            services: formData.get('services') || ''
        };
    }

    hasFormChanges() {
        if (!this.originalFormData) return false;
        const currentData = this.getCurrentFormData();
        if (!currentData) return false;

        const fields = ['name', 'category', 'phone', 'description', 'email', 'website', 
                       'province', 'area', 'serviceAreas', 'yearsInBusiness', 'services'];
        return fields.some(field => {
            const original = this.originalFormData[field] || '';
            const current = currentData[field] || '';
            return original.trim() !== current.trim();
        });
    }

    hasRequiredFieldsFilled() {
        const currentData = this.getCurrentFormData();
        if (!currentData) return false;

        const requiredFields = ['name', 'category', 'phone', 'description'];
        return requiredFields.every(field => {
            const value = currentData[field] || '';
            return value.trim().length > 0;
        });
    }

    async handleCancel() {
        const hasChanges = this.hasFormChanges();
        const hasRequiredData = this.hasRequiredFieldsFilled();

        if (hasChanges && hasRequiredData) {
            const confirmed = await confirmationModal.show({
                title: 'Discard Changes?',
                message: 'You have unsaved changes. Are you sure you want to discard them?',
                confirmText: 'Discard Changes',
                cancelText: 'Continue Editing',
                icon: 'warning',
                type: 'warning'
            });

            if (!confirmed) return;
        }

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
                'Share a trusted service provider with the community'
            );
            document.getElementById('contractorEditViewId').value = '';
            document.getElementById('contractorEditViewForm').reset();
        }

        this.populateCategories();
        this.populateProvinces();

        if (this.prefillData && !contractor) {
            setTimeout(() => this.prefillForm(this.prefillData), 50);
        }

        setTimeout(() => {
            this.storeOriginalFormState();
            this.updateSectionToggle();
        }, 150);
    }

    prefillForm(prefillData) {
        const { name, category, location, description } = prefillData;

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

        if (description) {
            const descInput = document.getElementById('contractorEditViewDescription');
            if (descInput) descInput.value = description.trim();
        }

        if (location) {
            this.prefillLocation(location);
        }

        this.focusNextEmptyField();
        setTimeout(() => this.storeOriginalFormState(), 100);
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
            setTimeout(() => {
                const areaInput = document.getElementById('contractorEditViewArea');
                if (areaInput && area) {
                    areaInput.value = area;
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
            'contractorEditViewName', 'contractorEditViewCategory', 
            'contractorEditViewPhone', 'contractorEditViewDescription'
        ].map(id => document.getElementById(id)).filter(field => field && !field.value.trim());

        if (requiredFields.length > 0) {
            requiredFields[0].focus();
        }
    }

    populateProvinces() {
        const select = document.getElementById('contractorEditViewProvince');
        if (!select) return;

        select.innerHTML = '<option value="">Select Province (Optional)</option>';

        const provinces = this.locationData?.southAfricanProvinces
            ? Object.keys(this.locationData.southAfricanProvinces).sort()
            : ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo',
                'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape'];

        provinces.forEach(province => {
            select.innerHTML += `<option value="${province}">${province}</option>`;
        });
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
        document.getElementById('contractorEditViewPhone').value = contractor.phone || '';
        document.getElementById('contractorEditViewDescription').value = contractor.description || '';
        document.getElementById('contractorEditViewEmail').value = contractor.email || '';
        document.getElementById('contractorEditViewWebsite').value = contractor.website || '';
        document.getElementById('contractorEditViewYearsInBusiness').value = contractor.yearsInBusiness || '';
        document.getElementById('contractorEditViewServices').value = contractor.services?.join(', ') || '';
        document.getElementById('contractorEditViewServiceAreas').value = contractor.serviceAreas?.join(', ') || '';

        if (contractor.location) {
            const [area, province] = contractor.location.split(', ').map(part => part.trim());
            if (province) {
                document.getElementById('contractorEditViewProvince').value = province;
                const areaInput = document.getElementById('contractorEditViewArea');
                if (areaInput && area) areaInput.value = area;
            }
        }
    }

    setSubmitButtonState(isSubmitting) {
        const saveButton = document.getElementById('saveContractorEditView');
        if (!saveButton) return;

        if (isSubmitting) {
            saveButton.disabled = true;
            saveButton.innerHTML = '<i class="material-icons mdc-button__icon">hourglass_empty</i>Saving...';
            saveButton.classList.add('submitting');
        } else {
            saveButton.disabled = false;
            saveButton.innerHTML = '<i class="material-icons mdc-button__icon">save</i>Save Service Provider';
            saveButton.classList.remove('submitting');
        }
    }

    async handleSubmit() {
        if (this.isSubmitting) {
            console.log('🛑 Submission already in progress, ignoring duplicate click');
            return;
        }

        this.isSubmitting = true;
        this.setSubmitButtonState(true);

        try {
            const formData = new FormData(document.getElementById('contractorEditViewForm'));
            
            // Build contractor data
            const contractorData = {
                name: formData.get('name'),
                category: formData.get('category'),
                phone: formData.get('phone'),
                description: formData.get('description'),
                email: formData.get('email') || '',
                website: formData.get('website') || '',
                yearsInBusiness: formData.get('yearsInBusiness') || '',
                services: formData.get('services') ? formData.get('services').split(',').map(s => s.trim()).filter(s => s) : [],
                serviceAreas: formData.get('serviceAreas') ? formData.get('serviceAreas').split(',').map(s => s.trim()).filter(s => s) : []
            };

            // Build location if province and area are provided (NO GEOCODING)
            const province = formData.get('province');
            const area = formData.get('area');
            if (province && area) {
                contractorData.location = `${area}, ${province}`;
                // No coordinates - they're optional and not needed for basic functionality
            }

            if (!this.validateContractorData(contractorData)) {
                return;
            }

            const contractorId = document.getElementById('contractorEditViewId').value;

            let savedContractor;
            let wasCreated = false;

            if (contractorId) {
                savedContractor = this.contractorManager.update(contractorId, contractorData);
                showNotification('Service Provider updated successfully', 'success');
                document.dispatchEvent(new CustomEvent('navigationViewChange', {
                    detail: { view: 'back' }
                }));
            } else {
                savedContractor = this.contractorManager.create(contractorData);
                wasCreated = true;
                showNotification('Service Provider added successfully', 'success');

                if (wasCreated && savedContractor) {
                    const wantsToRecommend = await this.askForRecommendation(savedContractor);

                    if (wantsToRecommend) {
                        document.dispatchEvent(new CustomEvent('navigationViewChange', {
                            detail: {
                                view: 'recommendationEdit',
                                context: {
                                    contractorId: savedContractor.id,
                                    source: 'contractorCreation'
                                }
                            }
                        }));
                    } else {
                        document.dispatchEvent(new CustomEvent('navigationViewChange', {
                            detail: { view: 'back' }
                        }));
                    }
                } else {
                    document.dispatchEvent(new CustomEvent('navigationViewChange', {
                        detail: { view: 'back' }
                    }));
                }
            }

        } catch (error) {
            console.error('❌ Error saving contractor:', error);
            showNotification('Failed to save contractor. Please try again.', 'error');
        } finally {
            this.isSubmitting = false;
            this.setSubmitButtonState(false);
        }
    }

    validateContractorData(data) {
        if (!data.name?.trim()) {
            showNotification('Service Provider name is required', 'error');
            this.isSubmitting = false;
            this.setSubmitButtonState(false);
            return false;
        }

        if (!data.category?.trim()) {
            showNotification('Service category is required', 'error');
            this.isSubmitting = false;
            this.setSubmitButtonState(false);
            return false;
        }

        if (!data.phone?.trim()) {
            showNotification('Phone number is required for community contact', 'error');
            this.isSubmitting = false;
            this.setSubmitButtonState(false);
            return false;
        }

        if (!isValidSouthAfricanPhone(data.phone)) {
            showNotification('Please enter a valid South African phone number', 'error');
            this.isSubmitting = false;
            this.setSubmitButtonState(false);
            return false;
        }

        if (!data.description?.trim()) {
            showNotification('Service description is required to help the community understand their expertise', 'error');
            this.isSubmitting = false;
            this.setSubmitButtonState(false);
            return false;
        }

        if (data.description.trim().length < 10) {
            showNotification('Please provide a more detailed service description (at least 10 characters)', 'error');
            this.isSubmitting = false;
            this.setSubmitButtonState(false);
            return false;
        }

        if (data.email && data.email.trim() && !isValidEmail(data.email)) {
            showNotification('Please enter a valid email address', 'error');
            this.isSubmitting = false;
            this.setSubmitButtonState(false);
            return false;
        }

        if (data.website && !isValidUrl(data.website)) {
            showNotification('Please enter a valid website URL', 'error');
            this.isSubmitting = false;
            this.setSubmitButtonState(false);
            return false;
        }

        return true;
    }

    async askForRecommendation(contractor) {
        const confirmed = await confirmationModal.show({
            title: 'Leave a Recommendation?',
            message: `Would you like to share your experience with ${contractor.name}? Your recommendation helps build trust in the community.`,
            confirmText: 'Yes, Leave Recommendation',
            cancelText: 'Not Now',
            icon: 'thumb_up',
            type: 'success'
        });

        return confirmed;
    }
}

export default ContractorEditView;