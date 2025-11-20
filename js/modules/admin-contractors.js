// Admin Contractors Management
import { showNotification } from './notifications.js';
import { isValidEmail, isValidSouthAfricanPhone, isValidUrl } from './validation.js';
import { ContractorModalManager } from '../app/modals/contractorModalManager.js';

class AdminContractorsModule {
    constructor(dataModule, categoriesModule, locationData) {
        this.dataModule = dataModule;
        this.categoriesModule = categoriesModule;
        this.locationData = locationData;
        this.contractorModalManager = null;
        this.contractorFormModal = null;
        this.modalEventListeners = [];

        // Bind methods
        this.init = this.init.bind(this);
        this.bindEvents = this.bindEvents.bind(this);
        this.renderContractorsTable = this.renderContractorsTable.bind(this);
        this.showContractorForm = this.showContractorForm.bind(this);
        this.handleContractorSubmit = this.handleContractorSubmit.bind(this);
        this.viewContractor = this.viewContractor.bind(this);
        this.editContractor = this.editContractor.bind(this);
        this.deleteContractor = this.deleteContractor.bind(this);
        this.filterContractors = this.filterContractors.bind(this);
        this.closeModal = this.closeModal.bind(this);
    }

    init() {
        console.log('🔧 AdminContractorsModule: Initializing...');
        this.createContractorFormModal();
        this.bindEvents();
        this.renderContractorsTable();

        // Initialize contractor modal manager
        this.contractorModalManager = new ContractorModalManager(
            this.dataModule,
            this.dataModule.reviewManager,
            this.dataModule.cardManager,
            null // No review modal manager in admin context
        );

        console.log('🔧 AdminContractorsModule: ContractorModalManager initialized');
    }

    // In the createContractorFormModal method, replace the modalHTML with:

    createContractorFormModal() {
        // Check if modal already exists
        if (this.contractorFormModal) {
            console.log('🔧 AdminContractorsModule: Modal already exists');
            return;
        }

        console.log('🔧 AdminContractorsModule: Creating contractor form modal...');

        const modalHTML = `
        <div class="modal" id="contractorFormModal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="formTitle">Add Service Provider</h2>
                    <button type="button" class="close" id="closeContractorFormModal" aria-label="Close dialog">
                        <span class="material-icons">close</span>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="contractorForm" class="material-form" onsubmit="return false;">
                        <input type="hidden" id="contractorId">
                        <input type="hidden" id="contractorLocation">

                        <div class="form-fields">
                            <div class="material-form-group">
                                <label for="contractorName" class="material-input-label">Service Provider Name</label>
                                <input type="text" id="contractorName" name="name" class="material-input" required>
                            </div>

                            <div class="material-form-group">
                                <label for="contractorCategory" class="material-input-label">Category</label>
                                <select id="contractorCategory" name="category" class="material-select" required>
                                    <option value="">Select Category</option>
                                    <!-- Categories will be populated dynamically -->
                                </select>
                            </div>

                            <div class="material-form-group">
                                <label for="contractorEmail" class="material-input-label">Email</label>
                                <input type="email" id="contractorEmail" name="email" class="material-input" required>
                            </div>

                            <div class="material-form-group">
                                <label for="contractorPhone" class="material-input-label">Phone</label>
                                <input type="tel" id="contractorPhone" name="phone" class="material-input" required>
                                <div class="material-input-helper">South African format: +27 or 0 followed by 9 digits</div>
                            </div>

                            <div class="material-form-group">
                                <label for="contractorWebsite" class="material-input-label">Website (optional)</label>
                                <input type="url" id="contractorWebsite" name="website" class="material-input" placeholder="https://example.com">
                                <div class="material-input-helper">Include http:// or https://</div>
                            </div>

                            <div class="form-row">
                                <div class="material-form-group">
                                    <label for="contractorProvince" class="material-input-label">Province</label>
                                    <select id="contractorProvince" name="province" class="material-select" required>
                                        <option value="">Select Province</option>
                                        <!-- Provinces will be populated dynamically -->
                                    </select>
                                </div>
                                <div class="material-form-group">
                                    <label for="contractorArea" class="material-input-label">Area</label>
                                    <select id="contractorArea" name="area" class="material-select" required disabled>
                                        <option value="">Select Area</option>
                                        <!-- Areas will be populated based on province selection -->
                                    </select>
                                    <div class="material-input-helper">Select province first</div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="material-button text-button" id="cancelContractorForm">Cancel</button>
                    <button type="button" class="material-button contained" id="saveContractorBtn">Save Service Provider</button>
                </div>
            </div>
        </div>
    `;

        try {
            // Insert modal HTML into the DOM
            document.body.insertAdjacentHTML('beforeend', modalHTML);

            // Get reference to the modal
            this.contractorFormModal = document.getElementById('contractorFormModal');

            if (!this.contractorFormModal) {
                console.error('❌ AdminContractorsModule: Failed to create modal - element not found after insertion');
                return;
            }

            console.log('✅ AdminContractorsModule: Service Provider form modal created successfully');

        } catch (error) {
            console.error('❌ AdminContractorsModule: Error creating modal:', error);
        }
    }
    bindEvents() {
        console.log('🔧 AdminContractorsModule: Binding events...');

        // Remove any existing event listeners to prevent duplicates
        this.removeEventListeners();

        // Service Provider form - bind to dynamically created elements
        const addContractorBtn = document.getElementById('addContractorBtn');
        if (addContractorBtn) {
            const handler = () => {
                console.log('🔧 AdminContractorsModule: Add contractor button clicked');
                this.showContractorForm();
            };
            addContractorBtn.addEventListener('click', handler);
            this.modalEventListeners.push({ element: addContractorBtn, event: 'click', handler });
        }

        // Use event delegation for dynamically created save button
        const saveButtonHandler = (e) => {
            if (e.target.id === 'saveContractorBtn' || e.target.closest('#saveContractorBtn')) {
                console.log('🔧 AdminContractorsModule: Save contractor button clicked - preventing default');
                e.preventDefault();
                e.stopImmediatePropagation();
                console.log('🔧 AdminContractorsModule: Calling handleContractorSubmit');
                this.handleContractorSubmit();
            }
        };
        document.addEventListener('click', saveButtonHandler, true); // Use capture phase
        this.modalEventListeners.push({ element: document, event: 'click', handler: saveButtonHandler });

        // Use event delegation for dynamically created province dropdown
        const provinceHandler = (e) => {
            if (e.target.id === 'contractorProvince') {
                console.log('🔧 AdminContractorsModule: Province changed to:', e.target.value);
                this.updateAreaDropdown(e.target.value);
            }
        };
        document.addEventListener('change', provinceHandler);
        this.modalEventListeners.push({ element: document, event: 'change', handler: provinceHandler });

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            const handler = (e) => {
                this.filterContractors(e.target.value);
            };
            searchInput.addEventListener('input', handler);
            this.modalEventListeners.push({ element: searchInput, event: 'input', handler });
        }

        // Direct event listeners for modal close buttons
        const closeButtonHandler = (e) => {
            console.log('🔧 AdminContractorsModule: Close button clicked');
            e.preventDefault();
            e.stopImmediatePropagation();
            this.closeModal('contractorFormModal');
        };

        const cancelButtonHandler = (e) => {
            console.log('🔧 AdminContractorsModule: Cancel button clicked');
            e.preventDefault();
            e.stopImmediatePropagation();
            this.closeModal('contractorFormModal');
        };

        // Use mutation observer to wait for modal to be added to DOM
        const modalObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    const closeBtn = document.getElementById('closeContractorFormModal');
                    const cancelBtn = document.getElementById('cancelContractorForm');

                    if (closeBtn && !closeBtn.hasListener) {
                        closeBtn.addEventListener('click', closeButtonHandler, true);
                        closeBtn.hasListener = true;
                        this.modalEventListeners.push({ element: closeBtn, event: 'click', handler: closeButtonHandler });
                    }

                    if (cancelBtn && !cancelBtn.hasListener) {
                        cancelBtn.addEventListener('click', cancelButtonHandler, true);
                        cancelBtn.hasListener = true;
                        this.modalEventListeners.push({ element: cancelBtn, event: 'click', handler: cancelButtonHandler });
                    }
                }
            }
        });

        modalObserver.observe(document.body, { childList: true, subtree: true });
        this.modalEventListeners.push({ observer: modalObserver });

        // Close modal when clicking on backdrop
        const backdropHandler = (e) => {
            if (e.target === this.contractorFormModal) {
                console.log('🔧 AdminContractorsModule: Backdrop clicked');
                e.preventDefault();
                e.stopImmediatePropagation();
                this.closeModal('contractorFormModal');
            }
        };
        document.addEventListener('click', backdropHandler, true);
        this.modalEventListeners.push({ element: document, event: 'click', handler: backdropHandler });

        // Escape key to close modal
        const escapeHandler = (e) => {
            if (e.key === 'Escape' && this.contractorFormModal?.style.display === 'flex') {
                console.log('🔧 AdminContractorsModule: Escape key pressed');
                e.preventDefault();
                e.stopImmediatePropagation();
                this.closeModal('contractorFormModal');
            }
        };
        document.addEventListener('keydown', escapeHandler, true);
        this.modalEventListeners.push({ element: document, event: 'keydown', handler: escapeHandler });

        // Prevent form submission
        const formSubmitHandler = (e) => {
            if (e.target.id === 'contractorForm') {
                console.log('🔧 AdminContractorsModule: Form submission prevented');
                e.preventDefault();
                e.stopImmediatePropagation();
                return false;
            }
        };
        document.addEventListener('submit', formSubmitHandler, true);
        this.modalEventListeners.push({ element: document, event: 'submit', handler: formSubmitHandler });

        console.log('✅ AdminContractorsModule: Events bound successfully');
    }

    removeEventListeners() {
        console.log('🔧 AdminContractorsModule: Removing existing event listeners');
        this.modalEventListeners.forEach(({ element, event, handler, observer }) => {
            if (observer) {
                observer.disconnect();
            } else if (element && handler) {
                element.removeEventListener(event, handler);
            }
        });
        this.modalEventListeners = [];
    }

    renderContractorsTable(filteredContractors = null) {
        const contractors = filteredContractors || this.dataModule.getContractors();
        const tbody = document.getElementById('contractorsTableBody');

        if (!tbody) {
            console.error('❌ AdminContractorsModule: Contractors table body not found');
            return;
        }

        if (!contractors || contractors.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-xl">
                        <div class="empty-state">
                            <span class="material-icons">business_center</span>
                            <p>No contractors found</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = contractors.map(contractor => {
            const reviews = this.dataModule.getReviewsForContractor(contractor.id);
            const reviewCount = reviews.length;
            const rating = contractor.rating || 0;

            return `
            <tr>
                <td>${contractor.name}</td>
                <td>${contractor.category}</td>
                <td>
                    <span class="rating-stars">${'⭐'.repeat(Math.floor(rating))}</span>
                    <small class="text-secondary">(${rating})</small>
                </td>
                <td>${reviewCount}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-icon btn-small btn-secondary" onclick="adminModule.viewContractor('${contractor.id}')" title="View Details">
                            <span class="material-icons">visibility</span>
                        </button>
                        <button class="btn btn-icon btn-small btn-primary" onclick="adminModule.editContractor('${contractor.id}')" title="Edit Service Provider">
                            <span class="material-icons">edit</span>
                        </button>
                        <button class="btn btn-icon btn-small btn-danger" onclick="adminModule.deleteContractor('${contractor.id}')" title="Delete Service Provider">
                            <span class="material-icons">delete</span>
                        </button>
                    </div>
                </td>
            </tr>
        `}).join('');
    }

    showContractorForm(contractor = null) {
        console.log('🔧 AdminContractorsModule: showContractorForm called');

        // Ensure modal is created
        this.createContractorFormModal();

        if (!this.contractorFormModal) {
            console.error('❌ AdminContractorsModule: Service Provider form modal not available even after creation attempt');
            showNotification('Failed to open contractor form. Please refresh the page.', 'error');
            return;
        }

        console.log('✅ AdminContractorsModule: Modal is available, populating form...');

        // Populate categories dropdown - FIXED: Sort categories alphabetically
        const categorySelect = document.getElementById('contractorCategory');
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="">Select Category</option>';
            const categories = this.categoriesModule.getCategories();

            // Sort categories alphabetically by name
            const sortedCategories = [...categories].sort((a, b) =>
                a.name.localeCompare(b.name)
            );

            sortedCategories.forEach(category => {
                categorySelect.innerHTML += `<option value="${category.name}">${category.name}</option>`;
            });
        }

        // Populate provinces dropdown - FIXED: Sort provinces alphabetically
        const provinceSelect = document.getElementById('contractorProvince');
        if (provinceSelect) {
            provinceSelect.innerHTML = '<option value="">Select Province</option>';

            if (this.locationData && this.locationData.southAfricanProvinces) {
                // Sort provinces alphabetically
                const sortedProvinces = Object.keys(this.locationData.southAfricanProvinces).sort();

                sortedProvinces.forEach(province => {
                    provinceSelect.innerHTML += `<option value="${province}">${province}</option>`;
                });
            }
        }

        // Reset area dropdown
        const areaSelect = document.getElementById('contractorArea');
        if (areaSelect) {
            areaSelect.innerHTML = '<option value="">Select Area</option>';
            areaSelect.disabled = true;
        }

        if (contractor) {
            // Edit mode - parse existing location
            let area = '';
            let province = '';

            if (contractor.location) {
                const locationParts = contractor.location.split(', ');
                if (locationParts.length === 2) {
                    area = locationParts[0];
                    province = locationParts[1];
                } else if (locationParts.length === 1) {
                    area = locationParts[0];
                }
            }

            document.getElementById('contractorId').value = contractor.id;
            document.getElementById('contractorName').value = contractor.name;
            document.getElementById('contractorCategory').value = contractor.category;
            document.getElementById('contractorEmail').value = contractor.email;
            document.getElementById('contractorPhone').value = contractor.phone;
            document.getElementById('contractorWebsite').value = contractor.website || '';

            // Set province and area if location exists
            if (province && provinceSelect) {
                provinceSelect.value = province;
                this.updateAreaDropdown(province, area);
            } else if (area) {
                this.findProvinceForArea(area);
            }

            document.getElementById('formTitle').textContent = 'Edit Service Provider';
        } else {
            // Add mode
            const form = document.getElementById('contractorForm');
            if (form) form.reset();
            document.getElementById('contractorId').value = '';
            document.getElementById('formTitle').textContent = 'Add Service Provider';
        }

        // Show the modal
        console.log('🔧 AdminContractorsModule: Setting modal display to flex');
        this.contractorFormModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Focus on first input for better UX
        setTimeout(() => {
            document.getElementById('contractorName')?.focus();
        }, 100);

        console.log('✅ AdminContractorsModule: Service Provider form displayed successfully');
    }

    // Helper function to find province for a given area
    findProvinceForArea(area) {
        const provinceSelect = document.getElementById('contractorProvince');
        const areaSelect = document.getElementById('contractorArea');

        if (!provinceSelect || !areaSelect) return;

        if (this.locationData && this.locationData.southAfricanProvinces) {
            for (const [province, provinceData] of Object.entries(this.locationData.southAfricanProvinces)) {
                if (provinceData.cities.includes(area)) {
                    provinceSelect.value = province;
                    this.updateAreaDropdown(province, area);
                    return;
                }
            }
        }

        // If area not found in any province, just enable area dropdown
        areaSelect.disabled = false;
    }

    updateAreaDropdown(province, selectedArea = '') {
        const areaSelect = document.getElementById('contractorArea');
        if (!areaSelect) return;

        if (!province) {
            areaSelect.innerHTML = '<option value="">Select Area</option>';
            areaSelect.disabled = true;
            return;
        }

        // Get the cities array from the province data
        const provinceData = this.locationData.southAfricanProvinces[province];
        const areas = provinceData ? provinceData.cities : [];

        areaSelect.innerHTML = '<option value="">Select Area</option>';

        // Sort areas alphabetically
        const sortedAreas = [...areas].sort();

        sortedAreas.forEach(area => {
            areaSelect.innerHTML += `<option value="${area}">${area}</option>`;
        });

        areaSelect.disabled = false;

        // Set selected area if provided (for edit mode)
        if (selectedArea) {
            areaSelect.value = selectedArea;
        }
    }

    handleContractorSubmit() {
        console.log('🔧 AdminContractorsModule: handleContractorSubmit called');

        const province = document.getElementById('contractorProvince')?.value;
        const area = document.getElementById('contractorArea')?.value;

        if (!province || !area) {
            showNotification('Please select both province and area', 'error');
            return;
        }

        const formData = new FormData(document.getElementById('contractorForm'));
        const contractorData = {
            name: formData.get('name'),
            category: formData.get('category'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            website: formData.get('website'),
            location: `${area}, ${province}`
        };

        // Validate inputs
        if (!isValidEmail(contractorData.email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }

        if (!isValidSouthAfricanPhone(contractorData.phone)) {
            showNotification('Please enter a valid South African phone number (e.g., +27821234567, 0821234567, or 0123456789)', 'error');
            return;
        }

        if (contractorData.website && !isValidUrl(contractorData.website)) {
            showNotification('Please enter a valid website URL (include http:// or https://)', 'error');
            return;
        }

        const contractorId = document.getElementById('contractorId').value;

        if (contractorId) {
            // Update existing contractor
            this.dataModule.updateContractor(contractorId, contractorData);
            showNotification('Service Provider updated successfully', 'success');
        } else {
            // Add new contractor
            this.dataModule.addContractor(contractorData);
            showNotification('Service Provider added successfully', 'success');
        }

        this.closeModal('contractorFormModal');
        this.renderContractorsTable();

        // Update stats in main admin module
        if (window.adminModule) {
            adminModule.renderStats();
        }
    }

    viewContractor(id) {
        console.log('🔧 AdminContractorsModule: View contractor called with ID:', id);
        if (this.contractorModalManager) {
            this.contractorModalManager.open(id);
        } else {
            console.error('🔧 AdminContractorsModule: ContractorModalManager not initialized');
        }
    }

    editContractor(id) {
        const contractor = this.dataModule.getContractor(id);
        if (contractor) {
            this.showContractorForm(contractor);
        }
    }

    deleteContractor(id) {
        if (confirm('Are you sure you want to delete this contractor? This action cannot be undone.')) {
            this.dataModule.deleteContractor(id);
            this.renderContractorsTable();
            showNotification('Service Provider deleted successfully', 'success');

            // Update stats in main admin module
            if (window.adminModule) {
                adminModule.renderStats();
            }
        }
    }

    filterContractors(searchTerm) {
        const contractors = this.dataModule.getContractors();
        const filtered = contractors.filter(contractor =>
            contractor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contractor.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contractor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contractor.location.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderContractorsTable(filtered);
    }

    closeModal(modalId) {
        console.log('🔧 AdminContractorsModule: closeModal called for:', modalId);
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            console.log('🔧 AdminContractorsModule: Modal closed successfully');
        }
    }

    // Cleanup method
    destroy() {
        this.removeEventListeners();
        if (this.contractorFormModal) {
            this.contractorFormModal.remove();
            this.contractorFormModal = null;
        }
    }
}

export default AdminContractorsModule;