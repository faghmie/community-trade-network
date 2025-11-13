import { contractorsModule } from './contractors.js';
import { utils } from './utils.js';

export const adminModule = {
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

        // Search functionality
        document.getElementById('searchInput')?.addEventListener('input', (e) => {
            this.filterContractors(e.target.value);
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
        const contractors = filteredContractors || contractorsModule.getContractors();
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
        
        if (contractor) {
            // Edit mode
            document.getElementById('contractorId').value = contractor.id;
            document.getElementById('contractorName').value = contractor.name;
            document.getElementById('contractorCategory').value = contractor.category;
            document.getElementById('contractorEmail').value = contractor.email;
            document.getElementById('contractorPhone').value = contractor.phone;
            document.getElementById('formTitle').textContent = 'Edit Contractor';
        } else {
            // Add mode
            form.reset();
            document.getElementById('contractorId').value = '';
            document.getElementById('formTitle').textContent = 'Add Contractor';
        }
        
        modal.style.display = 'block';
    },

    handleContractorSubmit() {
        const formData = new FormData(document.getElementById('contractorForm'));
        const contractorData = {
            name: formData.get('name'),
            category: formData.get('category'),
            email: formData.get('email'),
            phone: formData.get('phone')
        };

        const contractorId = document.getElementById('contractorId').value;
        
        if (contractorId) {
            // Update existing contractor
            contractorsModule.updateContractor(contractorId, contractorData);
        } else {
            // Add new contractor
            contractorsModule.addContractor(contractorData);
        }

        this.closeModal('contractorFormModal');
        this.renderDashboard();
    },

    viewContractor(id) {
        const contractor = contractorsModule.getContractor(id);
        if (contractor) {
            const modal = document.getElementById('contractorDetailsModal');
            const content = document.getElementById('contractorDetailsContent');
            
            content.innerHTML = `
                <h3>${contractor.name}</h3>
                <div class="contractor-info">
                    <p><strong>Category:</strong> ${contractor.category}</p>
                    <p><strong>Email:</strong> ${contractor.email}</p>
                    <p><strong>Phone:</strong> ${contractor.phone}</p>
                    <p><strong>Rating:</strong> ${contractor.rating} ⭐</p>
                    <p><strong>Total Reviews:</strong> ${contractor.reviews.length}</p>
                    <p><strong>Joined:</strong> ${utils.formatDate(contractor.createdAt)}</p>
                </div>
                <div class="reviews-section">
                    <h4>Reviews (${contractor.reviews.length})</h4>
                    ${contractor.reviews.length > 0 ? 
                        contractor.reviews.map(review => `
                            <div class="review-item">
                                <div class="review-header">
                                    <span class="reviewer-name">${review.reviewerName}</span>
                                    <span class="rating">${'⭐'.repeat(review.rating)}</span>
                                </div>
                                <div class="review-date">${utils.formatDate(review.date)}</div>
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
        const contractor = contractorsModule.getContractor(id);
        if (contractor) {
            this.showContractorForm(contractor);
        }
    },

    deleteContractor(id) {
        if (confirm('Are you sure you want to delete this contractor?')) {
            contractorsModule.deleteContractor(id);
            this.renderDashboard();
        }
    },

    filterContractors(searchTerm) {
        const contractors = contractorsModule.getContractors();
        const filtered = contractors.filter(contractor =>
            contractor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contractor.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contractor.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderContractorsTable(filtered);
    },

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }
};
