// Admin functionality
const adminModule = {
    init() {
        this.bindEvents();
        this.renderDashboard();
    },

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

        // Modal close events - use event delegation
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            }
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    },

    renderDashboard() {
        this.renderContractorsTable();
        this.renderStats();
    },

    renderStats() {
        const contractors = dataModule.getContractors();
        const totalReviews = contractors.reduce((total, contractor) => 
            total + contractor.reviews.length, 0
        );
        const averageRating = contractors.length > 0 ? 
            contractors.reduce((total, contractor) => total + parseFloat(contractor.rating), 0) / contractors.length : 0;

        const totalCategories = categoriesModule.getCategories().length;
        const reviewStats = dataModule.getReviewStats();

        document.getElementById('totalContractors').textContent = contractors.length;
        document.getElementById('totalReviews').textContent = totalReviews;
        document.getElementById('averageRating').textContent = averageRating.toFixed(1);
        document.getElementById('totalCategories').textContent = totalCategories;
        document.getElementById('pendingReviews').textContent = reviewStats.pendingReviews;
    },

    renderContractorsTable(filteredContractors = null) {
        const contractors = filteredContractors || dataModule.getContractors();
        const tbody = document.getElementById('contractorsTableBody');
        
        if (!tbody) return;

        tbody.innerHTML = contractors.map(contractor => `
            <tr>
                <td>${contractor.name}</td>
                <td>${contractor.category}</td>
                <td>${contractor.email}</td>
                <td>${contractor.phone}</td>
                <td>${contractor.rating}</td>
                <td>${contractor.reviews.length}</td>
                <td class="table-actions">
                    <button class="btn btn-small btn-secondary" onclick="adminModule.viewContractor('${contractor.id}')">
                        View
                    </button>
                    <button class="btn btn-small btn-primary" onclick="adminModule.editContractor('${contractor.id}')">
                        Edit
                    </button>
                    <button class="btn btn-small" style="background: var(--accent-color); color: white;" 
                            onclick="adminModule.deleteContractor('${contractor.id}')">
                        Delete
                    </button>
                </td>
            </tr>
        `).join('');
    },

    showContractorForm(contractor = null) {
        const form = document.getElementById('contractorForm');
        const modal = document.getElementById('contractorFormModal');
        
        // Populate categories dropdown
        const categorySelect = document.getElementById('contractorCategory');
        categorySelect.innerHTML = '<option value="">Select Category</option>';
        const categories = categoriesModule.getCategories();
        categories.forEach(category => {
            categorySelect.innerHTML += `<option value="${category}">${category}</option>`;
        });
        
        // Populate provinces dropdown
        const provinceSelect = document.getElementById('contractorProvince');
        provinceSelect.innerHTML = '<option value="">Select Province</option>';
        Object.keys(southAfricanProvinces).forEach(province => {
            provinceSelect.innerHTML += `<option value="${province}">${province}</option>`;
        });
        
        // Reset area dropdown
        const areaSelect = document.getElementById('contractorArea');
        areaSelect.innerHTML = '<option value="">Select Area</option>';
        areaSelect.disabled = true;
        
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
            if (province) {
                provinceSelect.value = province;
                this.updateAreaDropdown(province, area);
            } else if (area) {
                // If only area is provided, try to find which province it belongs to
                this.findProvinceForArea(area);
            }
            
            document.getElementById('formTitle').textContent = 'Edit Contractor';
        } else {
            // Add mode
            form.reset();
            document.getElementById('contractorId').value = '';
            document.getElementById('formTitle').textContent = 'Add Contractor';
        }
        
        modal.style.display = 'block';
    },

    // Helper function to find province for a given area
    findProvinceForArea(area) {
        const provinceSelect = document.getElementById('contractorProvince');
        const areaSelect = document.getElementById('contractorArea');
        
        // Search through all provinces to find which one contains this area
        for (const [province, areas] of Object.entries(southAfricanProvinces)) {
            if (areas.includes(area)) {
                provinceSelect.value = province;
                this.updateAreaDropdown(province, area);
                return;
            }
        }
        
        // If area not found in any province, just enable area dropdown
        areaSelect.disabled = false;
    },

    updateAreaDropdown(province, selectedArea = '') {
        const areaSelect = document.getElementById('contractorArea');
        
        if (!province) {
            areaSelect.innerHTML = '<option value="">Select Area</option>';
            areaSelect.disabled = true;
            return;
        }
        
        const areas = southAfricanProvinces[province] || [];
        areaSelect.innerHTML = '<option value="">Select Area</option>';
        areas.forEach(area => {
            areaSelect.innerHTML += `<option value="${area}">${area}</option>`;
        });
        
        areaSelect.disabled = false;
        
        // Set selected area if provided (for edit mode)
        if (selectedArea) {
            areaSelect.value = selectedArea;
        }
    },

    handleContractorSubmit() {
        const province = document.getElementById('contractorProvince').value;
        const area = document.getElementById('contractorArea').value;
        
        if (!province || !area) {
            utils.showNotification('Please select both province and area', 'error');
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
        if (!utils.isValidEmail(contractorData.email)) {
            utils.showNotification('Please enter a valid email address', 'error');
            return;
        }

        // FIXED: Updated phone validation to accept numbers like "0123456789"
        if (!utils.isValidSouthAfricanPhone(contractorData.phone)) {
            utils.showNotification('Please enter a valid South African phone number (e.g., +27821234567, 0821234567, or 0123456789)', 'error');
            return;
        }

        if (contractorData.website && !utils.isValidUrl(contractorData.website)) {
            utils.showNotification('Please enter a valid website URL (include http:// or https://)', 'error');
            return;
        }

        const contractorId = document.getElementById('contractorId').value;
        
        if (contractorId) {
            // Update existing contractor
            dataModule.updateContractor(contractorId, contractorData);
        } else {
            // Add new contractor
            dataModule.addContractor(contractorData);
        }

        this.closeModal('contractorFormModal');
        this.renderDashboard();
        
        // Also update categories tab stats if it's visible
        if (typeof adminCategoriesModule !== 'undefined') {
            adminCategoriesModule.renderCategories();
        }
    },

    viewContractor(id) {
        const contractor = dataModule.getContractor(id);
        if (contractor) {
            const modal = document.getElementById('contractorDetailsModal');
            const content = document.getElementById('contractorDetailsContent');
            
            content.innerHTML = `
                <h3>${contractor.name}</h3>
                <div class="contractor-info">
                    <p><strong>Category:</strong> ${contractor.category}</p>
                    <p><strong>Email:</strong> ${contractor.email}</p>
                    <p><strong>Phone:</strong> ${contractor.phone}</p>
                    <p><strong>Website:</strong> ${contractor.website ? `<a href="${contractor.website}" target="_blank">${contractor.website}</a>` : 'Not provided'}</p>
                    <p><strong>Service Area:</strong> ${contractor.location}</p>
                    <p><strong>Rating:</strong> ${contractor.rating} ⭐</p>
                    <p><strong>Total Reviews:</strong> ${contractor.reviews.length}</p>
                    <p><strong>Joined:</strong> ${dataModule.formatDate(contractor.createdAt)}</p>
                </div>
                <div class="reviews-section">
                    <h4>Reviews (${contractor.reviews.length})</h4>
                    ${contractor.reviews.length > 0 ? 
                        contractor.reviews.map(review => `
                            <div class="review-item">
                                <div class="review-header">
                                    <span class="reviewer-name">${review.reviewerName}</span>
                                    <span class="rating">${'⭐'.repeat(review.rating)}</span>
                                    <span class="review-status">${review.status}</span>
                                </div>
                                <div class="review-date">${dataModule.formatDate(review.date)}</div>
                                <p class="review-comment">${review.comment}</p>
                            </div>
                        `).join('') : 
                        '<p>No reviews yet.</p>'
                    }
                </div>
            `;
            
            modal.style.display = 'block';
        }
    },

    editContractor(id) {
        const contractor = dataModule.getContractor(id);
        if (contractor) {
            this.showContractorForm(contractor);
        }
    },

    deleteContractor(id) {
        if (confirm('Are you sure you want to delete this contractor?')) {
            dataModule.deleteContractor(id);
            this.renderDashboard();
            
            // Also update categories tab stats if it's visible
            if (typeof adminCategoriesModule !== 'undefined') {
                adminCategoriesModule.renderCategories();
            }
        }
    },

    filterContractors(searchTerm) {
        const contractors = dataModule.getContractors();
        const filtered = contractors.filter(contractor =>
            contractor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contractor.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contractor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contractor.location.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderContractorsTable(filtered);
    },

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }
};

// Initialize admin when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Make sure all modules are initialized first
    if (typeof dataModule !== 'undefined' && typeof categoriesModule !== 'undefined') {
        dataModule.init();
        categoriesModule.init();
        adminModule.init();
        if (typeof adminCategoriesModule !== 'undefined') {
            adminCategoriesModule.init();
        }
        if (typeof adminReviewsModule !== 'undefined') {
            adminReviewsModule.init();
        }
        if (typeof tabsModule !== 'undefined') {
            tabsModule.init();
        }
    } else {
        console.error('Required modules are not available');
        // Try initializing again after a short delay
        setTimeout(() => {
            if (typeof dataModule !== 'undefined' && typeof categoriesModule !== 'undefined') {
                dataModule.init();
                categoriesModule.init();
                adminModule.init();
                if (typeof adminCategoriesModule !== 'undefined') {
                    adminCategoriesModule.init();
                }
                if (typeof adminReviewsModule !== 'undefined') {
                    adminReviewsModule.init();
                }
                if (typeof tabsModule !== 'undefined') {
                    tabsModule.init();
                }
            }
        }, 100);
    }
});