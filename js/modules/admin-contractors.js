// Admin Contractors Management
import { showNotification } from './notifications.js';
import { isValidEmail, isValidSouthAfricanPhone, isValidUrl } from './validation.js';

class AdminContractorsModule {
    constructor(dataModule, categoriesModule, locationData) {
        this.dataModule = dataModule;
        this.categoriesModule = categoriesModule;
        this.locationData = locationData;
        
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
    }

    init() {
        this.bindEvents();
        this.renderContractorsTable();
    }

    bindEvents() {
        // Contractor form
        document.getElementById('addContractorBtn')?.addEventListener('click', () => {
            this.showContractorForm();
        });

        document.getElementById('contractorForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleContractorSubmit();
        });

        // Province change event
        document.getElementById('contractorProvince')?.addEventListener('change', (e) => {
            this.updateAreaDropdown(e.target.value);
        });

        // Search functionality
        document.getElementById('searchInput')?.addEventListener('input', (e) => {
            this.filterContractors(e.target.value);
        });

        // Close modal events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close') || e.target.closest('.close')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            }
        });
    }

    renderContractorsTable(filteredContractors = null) {
        const contractors = filteredContractors || this.dataModule.getContractors();
        const tbody = document.getElementById('contractorsTableBody');

        if (!tbody) return;

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
            // FIX: Get reviews from reviewManager instead of contractor.reviews
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
                        <button class="btn btn-icon btn-small btn-primary" onclick="adminModule.editContractor('${contractor.id}')" title="Edit Contractor">
                            <span class="material-icons">edit</span>
                        </button>
                        <button class="btn btn-icon btn-small btn-danger" onclick="adminModule.deleteContractor('${contractor.id}')" title="Delete Contractor">
                            <span class="material-icons">delete</span>
                        </button>
                    </div>
                </td>
            </tr>
        `}).join('');
    }

    showContractorForm(contractor = null) {
        const modal = document.getElementById('contractorFormModal');
        if (!modal) {
            console.error('Contractor form modal not found');
            return;
        }

        // Populate categories dropdown
        const categorySelect = document.getElementById('contractorCategory');
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="">Select Category</option>';
            const categories = this.categoriesModule.getCategories();
            categories.forEach(category => {
                categorySelect.innerHTML += `<option value="${category.name}">${category.name}</option>`;
            });
        }

        // Populate provinces dropdown
        const provinceSelect = document.getElementById('contractorProvince');
        if (provinceSelect) {
            provinceSelect.innerHTML = '<option value="">Select Province</option>';

            // Use the injected locationData
            if (this.locationData && this.locationData.southAfricanProvinces) {
                Object.keys(this.locationData.southAfricanProvinces).forEach(province => {
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
                // Location format is "Area, Province" - split and extract
                const locationParts = contractor.location.split(', ');
                if (locationParts.length === 2) {
                    area = locationParts[0]; // First part is area
                    province = locationParts[1]; // Second part is province
                } else if (locationParts.length === 1) {
                    // Handle case where only area or province is provided
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
                // If only area is provided, try to find which province it belongs to
                this.findProvinceForArea(area);
            }

            document.getElementById('formTitle').textContent = 'Edit Contractor';
        } else {
            // Add mode
            const form = document.getElementById('contractorForm');
            if (form) form.reset();
            document.getElementById('contractorId').value = '';
            document.getElementById('formTitle').textContent = 'Add Contractor';
        }

        modal.style.display = 'flex';
    }

    // Helper function to find province for a given area
    findProvinceForArea(area) {
        const provinceSelect = document.getElementById('contractorProvince');
        const areaSelect = document.getElementById('contractorArea');

        if (!provinceSelect || !areaSelect) return;

        // Search through all provinces to find which one contains this area
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
        areas.forEach(area => {
            areaSelect.innerHTML += `<option value="${area}">${area}</option>`;
        });

        areaSelect.disabled = false;

        // Set selected area if provided (for edit mode)
        if (selectedArea) {
            areaSelect.value = selectedArea;
        }
    }

    handleContractorSubmit() {
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
            location: `${area}, ${province}` // Format: "Area, Province"
        };

        // Validate inputs
        if (!isValidEmail(contractorData.email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }

        // FIXED: Updated phone validation to accept numbers like "0123456789"
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
            showNotification('Contractor updated successfully', 'success');
        } else {
            // Add new contractor
            this.dataModule.addContractor(contractorData);
            showNotification('Contractor added successfully', 'success');
        }

        this.closeModal('contractorFormModal');
        this.renderContractorsTable();

        // Update stats in main admin module
        if (window.adminModule) {
            adminModule.renderStats();
        }
    }

    viewContractor(id) {
        const contractor = this.dataModule.getContractor(id);
        if (contractor) {
            // Create modal if it doesn't exist
            if (!document.getElementById('contractorDetailsModal')) {
                this.createContractorDetailsModal();
            }

            const modal = document.getElementById('contractorDetailsModal');
            const content = document.getElementById('contractorDetailsContent');

            if (content) {
                // FIX: Get reviews from reviewManager instead of contractor.reviews
                const reviews = this.dataModule.getReviewsForContractor(contractor.id);
                const approvedReviews = reviews.filter(r => r.status === 'approved');
                const pendingReviews = reviews.filter(r => r.status === 'pending');

                content.innerHTML = `
                <div class="contractor-details">
                    <div class="contractor-header">
                        <h2 class="contractor-name">${contractor.name}</h2>
                        <p class="contractor-category">
                            <span class="material-icons">category</span>
                            ${contractor.category}
                        </p>
                    </div>
                    
                    <div class="contractor-info-grid">
                        <div class="info-item">
                            <span class="info-label">Email</span>
                            <span class="info-value">${contractor.email}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Phone</span>
                            <span class="info-value">${contractor.phone}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Website</span>
                            <span class="info-value">
                                ${contractor.website ?
                        `<a href="${contractor.website}" target="_blank" class="website-link">
                                        <span class="material-icons">open_in_new</span>
                                        Visit Website
                                    </a>` :
                        'Not provided'
                    }
                            </span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Service Area</span>
                            <span class="info-value">${contractor.location}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Overall Rating</span>
                            <span class="info-value">
                                <span class="rating-value">
                                    ${'⭐'.repeat(Math.floor(contractor.rating || 0))}
                                    (${contractor.rating || 0}/5)
                                </span>
                            </span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Total Reviews</span>
                            <span class="info-value">${reviews.length}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Approved Reviews</span>
                            <span class="info-value">${approvedReviews.length}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Pending Reviews</span>
                            <span class="info-value">${pendingReviews.length}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Member Since</span>
                            <span class="info-value">${this.dataModule.formatDate(contractor.createdAt)}</span>
                        </div>
                    </div>
                    
                    <!-- ADDED: Spacer div to create proper separation -->
                    <div style="height: var(--space-xl);"></div>
                    
                    <div class="reviews-section">
                        <div class="reviews-section-header">
                            <h3 class="section-title">
                                <span class="material-icons">reviews</span>
                                Customer Reviews (${reviews.length})
                            </h3>
                            <span class="reviews-count">${approvedReviews.length} approved • ${pendingReviews.length} pending</span>
                        </div>
                        
                        ${reviews.length > 0 ?
                        `<div class="reviews-list">
                                ${reviews.map(review => `
                                    <div class="review-item">
                                        <div class="review-header">
                                            <div class="reviewer-avatar">
                                                ${review.reviewerName.charAt(0).toUpperCase()}
                                            </div>
                                            <div class="reviewer-info">
                                                <div class="reviewer-name-rating">
                                                    <span class="reviewer-name">${review.reviewerName}</span>
                                                    <span class="review-rating">
                                                        ${'⭐'.repeat(review.rating)}
                                                        <span>${review.rating}/5</span>
                                                    </span>
                                                </div>
                                                <div class="review-meta">
                                                    <span class="review-date">${this.dataModule.formatDate(review.date)}</span>
                                                    <span class="project-type">${review.projectType}</span>
                                                    <span class="review-status ${review.status}">${review.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <p class="review-comment">${review.comment}</p>
                                    </div>
                                `).join('')}
                            </div>` :
                        `<div class="no-reviews">
                                <span class="material-icons">rate_review</span>
                                <p>No reviews yet for this contractor</p>
                            </div>`
                    }
                    </div>
                </div>
            `;
            }

            modal.style.display = 'flex';
        }
    }

    createContractorDetailsModal() {
        // Create the modal if it doesn't exist
        const modalHTML = `
            <div class="modal" id="contractorDetailsModal">
                <div class="modal-content large">
                    <div class="modal-header">
                        <h2>Contractor Details</h2>
                        <button class="close" aria-label="Close modal">&times;</button>
                    </div>
                    <div class="modal-body" id="contractorDetailsContent">
                        <!-- Content will be populated dynamically -->
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
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
            showNotification('Contractor deleted successfully', 'success');

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
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }
}

export default AdminContractorsModule;