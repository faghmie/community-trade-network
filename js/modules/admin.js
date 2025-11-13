// js/modules/admin.js - UPDATED with rating breakdown
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

    // NEW: Get category averages for a contractor
    getCategoryAverages(contractor) {
        const approvedReviews = contractor.reviews.filter(review => 
            review.status === 'approved' && review.categoryRatings
        );
        
        if (approvedReviews.length === 0) {
            return {
                quality: 0,
                communication: 0,
                timeliness: 0,
                value: 0
            };
        }

        const totals = approvedReviews.reduce((acc, review) => {
            acc.quality += review.categoryRatings.quality || 0;
            acc.communication += review.categoryRatings.communication || 0;
            acc.timeliness += review.categoryRatings.timeliness || 0;
            acc.value += review.categoryRatings.value || 0;
            return acc;
        }, { quality: 0, communication: 0, timeliness: 0, value: 0 });

        const count = approvedReviews.length;
        return {
            quality: parseFloat((totals.quality / count).toFixed(1)),
            communication: parseFloat((totals.communication / count).toFixed(1)),
            timeliness: parseFloat((totals.timeliness / count).toFixed(1)),
            value: parseFloat((totals.value / count).toFixed(1))
        };
    },

    viewContractor(id) {
        const contractor = contractorsModule.getContractor(id);
        if (contractor) {
            const modal = document.getElementById('contractorDetailsModal');
            const content = document.getElementById('contractorDetailsContent');
            
            // Get category averages
            const categoryAverages = this.getCategoryAverages(contractor);
            const hasCategoryRatings = categoryAverages.quality > 0 || categoryAverages.communication > 0 || 
                                     categoryAverages.timeliness > 0 || categoryAverages.value > 0;
            
            // Separate approved and pending reviews
            const approvedReviews = contractor.reviews.filter(review => review.status === 'approved');
            const pendingReviews = contractor.reviews.filter(review => review.status === 'pending');

            content.innerHTML = `
                <div class="contractor-details-admin">
                    <div class="contractor-header">
                        <h3>${contractor.name}</h3>
                        <p class="contractor-category">${contractor.category}</p>
                    </div>

                    <div class="contractor-info-grid">
                        <div class="info-item">
                            <strong>Email:</strong> ${contractor.email || 'Not provided'}
                        </div>
                        <div class="info-item">
                            <strong>Phone:</strong> ${contractor.phone || 'Not provided'}
                        </div>
                        <div class="info-item">
                            <strong>Location:</strong> ${contractor.location || 'Not specified'}
                        </div>
                        <div class="info-item">
                            <strong>Joined:</strong> ${utils.formatDate(contractor.createdAt)}
                        </div>
                        <div class="info-item">
                            <strong>Overall Rating:</strong> ${contractor.rating} ⭐
                        </div>
                        <div class="info-item">
                            <strong>Total Reviews:</strong> ${contractor.reviews.length}
                            (${approvedReviews.length} approved, ${pendingReviews.length} pending)
                        </div>
                    </div>

                    ${hasCategoryRatings ? `
                    <div class="category-ratings-section">
                        <h4>Rating Breakdown</h4>
                        <div class="category-ratings-grid">
                            ${categoryAverages.quality > 0 ? `
                            <div class="category-rating-item">
                                <strong>Quality of Work:</strong>
                                <div class="category-rating-display">
                                    <span class="stars">${'⭐'.repeat(Math.floor(categoryAverages.quality))}${categoryAverages.quality % 1 >= 0.5 ? '⭐' : ''}</span>
                                    <span class="value">${categoryAverages.quality.toFixed(1)}</span>
                                </div>
                            </div>
                            ` : ''}
                            
                            ${categoryAverages.communication > 0 ? `
                            <div class="category-rating-item">
                                <strong>Communication:</strong>
                                <div class="category-rating-display">
                                    <span class="stars">${'⭐'.repeat(Math.floor(categoryAverages.communication))}${categoryAverages.communication % 1 >= 0.5 ? '⭐' : ''}</span>
                                    <span class="value">${categoryAverages.communication.toFixed(1)}</span>
                                </div>
                            </div>
                            ` : ''}
                            
                            ${categoryAverages.timeliness > 0 ? `
                            <div class="category-rating-item">
                                <strong>Timeliness:</strong>
                                <div class="category-rating-display">
                                    <span class="stars">${'⭐'.repeat(Math.floor(categoryAverages.timeliness))}${categoryAverages.timeliness % 1 >= 0.5 ? '⭐' : ''}</span>
                                    <span class="value">${categoryAverages.timeliness.toFixed(1)}</span>
                                </div>
                            </div>
                            ` : ''}
                            
                            ${categoryAverages.value > 0 ? `
                            <div class="category-rating-item">
                                <strong>Value for Money:</strong>
                                <div class="category-rating-display">
                                    <span class="stars">${'⭐'.repeat(Math.floor(categoryAverages.value))}${categoryAverages.value % 1 >= 0.5 ? '⭐' : ''}</span>
                                    <span class="value">${categoryAverages.value.toFixed(1)}</span>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    ` : ''}

                    <div class="reviews-section">
                        <h4>All Reviews (${contractor.reviews.length})</h4>
                        ${contractor.reviews.length > 0 ? 
                            contractor.reviews.map(review => {
                                const statusClass = review.status === 'approved' ? 'status-approved' : 
                                                  review.status === 'pending' ? 'status-pending' : 'status-rejected';
                                const statusLabel = review.status === 'approved' ? 'Approved' : 
                                                  review.status === 'pending' ? 'Pending' : 'Rejected';
                                
                                const categoryRatings = review.categoryRatings || {};
                                const hasCategoryRatings = categoryRatings.quality || categoryRatings.communication || 
                                                         categoryRatings.timeliness || categoryRatings.value;
                                
                                return `
                                <div class="review-item ${statusClass}">
                                    <div class="review-header">
                                        <div class="reviewer-info">
                                            <span class="reviewer-name">${review.reviewerName}</span>
                                            <span class="rating">${'⭐'.repeat(review.rating)} (${review.rating}/5)</span>
                                        </div>
                                        <div class="review-meta">
                                            <span class="review-date">${utils.formatDate(review.date)}</span>
                                            <span class="review-status ${statusClass}">${statusLabel}</span>
                                        </div>
                                    </div>
                                    ${hasCategoryRatings ? `
                                    <div class="category-ratings-preview">
                                        <strong>Category Ratings:</strong>
                                        ${categoryRatings.quality ? `Quality: ${'⭐'.repeat(categoryRatings.quality)}` : ''}
                                        ${categoryRatings.communication ? ` | Communication: ${'⭐'.repeat(categoryRatings.communication)}` : ''}
                                        ${categoryRatings.timeliness ? ` | Timeliness: ${'⭐'.repeat(categoryRatings.timeliness)}` : ''}
                                        ${categoryRatings.value ? ` | Value: ${'⭐'.repeat(categoryRatings.value)}` : ''}
                                    </div>
                                    ` : ''}
                                    <p class="review-comment">${review.comment}</p>
                                    <div class="review-actions">
                                        ${review.status === 'pending' ? `
                                            <button class="btn btn-small btn-success" onclick="adminReviewsModule.approveReview('${contractor.id}', '${review.id}')">
                                                Approve
                                            </button>
                                            <button class="btn btn-small btn-warning" onclick="adminReviewsModule.rejectReview('${contractor.id}', '${review.id}')">
                                                Reject
                                            </button>
                                        ` : ''}
                                        ${review.status === 'approved' ? `
                                            <button class="btn btn-small btn-warning" onclick="adminReviewsModule.rejectReview('${contractor.id}', '${review.id}')">
                                                Reject
                                            </button>
                                        ` : ''}
                                        ${review.status === 'rejected' ? `
                                            <button class="btn btn-small btn-success" onclick="adminReviewsModule.approveReview('${contractor.id}', '${review.id}')">
                                                Approve
                                            </button>
                                        ` : ''}
                                    </div>
                                </div>
                                `;
                            }).join('') : 
                            '<p>No reviews yet.</p>'
                        }
                    </div>
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