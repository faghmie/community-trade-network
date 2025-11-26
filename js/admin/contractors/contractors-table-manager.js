import { sanitizeHtml } from '../../modules/utilities.js';

/**
 * ContractorsTableManager - Handles table rendering, sorting, and row interactions
 * for the contractors admin interface
 * Follows exact same pattern as CategoryTableManager
 */
class ContractorsTableManager {
    constructor(dataModule) {
        this.dataModule = dataModule;
        this.sortState = {
            field: 'name',
            direction: 'asc'
        };
        this.container = null;
    }

    /**
     * Initialize the table manager with a container element
     * @param {HTMLElement} container - The DOM element to render the table in
     */
    init(container) {
        this.container = container;
        this.bindTableHeaderEvents();
    }

    /**
     * Render the contractors table with optional filtered data
     * @param {Array} contractors - Array of contractor objects to display
     */
    renderTable(contractors = null) {
        if (!this.container) {
            console.error('ContractorsTableManager: No container element provided');
            return;
        }

        const contractorsToRender = contractors || this.getSortedContractors();

        if (contractorsToRender.length === 0) {
            this.container.innerHTML = this.generateEmptyTableState();
            return;
        }

        this.container.innerHTML = this.generateTableHTML(contractorsToRender);
        this.bindTableHeaderEvents();
    }

    /**
     * Generate the complete table HTML structure
     * @param {Array} contractors - Contractors to render
     * @returns {string} Table HTML
     */
    generateTableHTML(contractors) {
        return `
            <div class="table-container">
                <table id="contractorsTable" class="table">
                    <thead>
                        <tr>
                            <th data-sort="name" class="sortable ${this.getSortClass('name')}">
                                Name
                                ${this.getSortIndicator('name')}
                            </th>
                            <th data-sort="category" class="sortable ${this.getSortClass('category')}">
                                Category
                                ${this.getSortIndicator('category')}
                            </th>
                            <th data-sort="rating" class="sortable ${this.getSortClass('rating')}">
                                Rating
                                ${this.getSortIndicator('rating')}
                            </th>
                            <th data-sort="reviewCount" class="sortable ${this.getSortClass('reviewCount')}">
                                Reviews
                                ${this.getSortIndicator('reviewCount')}
                            </th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${contractors.map(contractor => this.generateTableRow(contractor)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Generate a single table row for a contractor
     * @param {Object} contractor - Contractor object
     * @returns {string} Table row HTML
     */
    generateTableRow(contractor) {
        const recommendations = this.dataModule.getRecommendationsForContractor(contractor.id);
        const recommendationCount = recommendations.length;
        const trustScore = contractor.trustMetrics ? contractor.trustMetrics.trustScore : 0;
        const rating = contractor.rating || 0;

        return `
            <tr class="contractor-row" data-contractor-id="${contractor.id || ''}">
                <td class="contractor-name">
                    <div class="contractor-name-primary">${sanitizeHtml(contractor.name)}</div>
                    ${contractor.location ? `<div class="contractor-location">${sanitizeHtml(contractor.location)}</div>` : ''}
                    <div class="contractor-contact">
                        <span class="contact-phone">${sanitizeHtml(contractor.phone)}</span>
                        ${contractor.email ? `<span class="contact-email">${sanitizeHtml(contractor.email)}</span>` : ''}
                    </div>
                </td>
                <td class="contractor-category">
                    <span class="category-badge">${sanitizeHtml(contractor.category)}</span>
                </td>
                <td class="contractor-rating">
                    <div class="rating-display">
                        <span class="rating-value">${rating.toFixed(1)}</span>
                        ${trustScore > 0 ? `<span class="trust-score">${trustScore}% trust</span>` : ''}
                    </div>
                </td>
                <td class="contractor-reviews">
                    <div class="review-count">${recommendationCount}</div>
                    <div class="review-label">recommendations</div>
                </td>
                <td class="contractor-actions">
                    <button class="btn btn-icon btn-small btn-primary edit-contractor" 
                            data-contractor-id="${contractor.id || ''}"
                            title="Edit Contractor">
                        <span class="material-icons">edit</span>
                    </button>
                    <button class="btn btn-icon btn-small btn-danger delete-contractor" 
                            data-contractor-id="${contractor.id || ''}"
                            data-contractor-name="${sanitizeHtml(contractor.name)}"
                            title="Delete Contractor">
                        <span class="material-icons">delete</span>
                    </button>
                </td>
            </tr>
        `;
    }

    /**
     * Get contractors sorted according to current sort state
     * @returns {Array} Sorted contractors
     */
    getSortedContractors() {
        const contractors = this.dataModule.getContractors();
        return contractors.sort((a, b) => {
            let aValue = a[this.sortState.field] || '';
            let bValue = b[this.sortState.field] || '';

            // Handle numeric fields differently
            if (this.sortState.field === 'rating' || this.sortState.field === 'reviewCount') {
                aValue = Number(aValue) || 0;
                bValue = Number(bValue) || 0;
                
                if (this.sortState.direction === 'asc') {
                    return aValue - bValue;
                } else {
                    return bValue - aValue;
                }
            }

            // Handle string fields
            aValue = String(aValue).toLowerCase();
            bValue = String(bValue).toLowerCase();

            if (this.sortState.direction === 'asc') {
                return aValue.localeCompare(bValue);
            } else {
                return bValue.localeCompare(aValue);
            }
        });
    }

    /**
     * Handle sort when a table header is clicked
     * @param {string} field - Field name to sort by
     * @param {Function} onSortChange - Callback when sort changes
     */
    handleSort(field, onSortChange = null) {
        if (this.sortState.field === field) {
            this.sortState.direction = this.sortState.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortState.field = field;
            this.sortState.direction = 'asc';
        }

        this.renderTable();

        if (onSortChange && typeof onSortChange === 'function') {
            onSortChange(this.sortState);
        }
    }

    /**
     * Get CSS class for sortable column header
     * @param {string} field - Field name
     * @returns {string} CSS class
     */
    getSortClass(field) {
        return this.sortState.field === field ? `sort-${this.sortState.direction}` : '';
    }

    /**
     * Get sort indicator HTML for column header
     * @param {string} field - Field name
     * @returns {string} Sort indicator HTML
     */
    getSortIndicator(field) {
        if (this.sortState.field !== field) {
            return '<span class="sort-indicator"></span>';
        }

        return this.sortState.direction === 'asc'
            ? '<span class="sort-indicator asc">↑</span>'
            : '<span class="sort-indicator desc">↓</span>';
    }

    /**
     * Bind events to table headers for sorting
     */
    bindTableHeaderEvents() {
        if (!this.container) return;

        const tableHeaders = this.container.querySelectorAll('thead th[data-sort]');
        tableHeaders.forEach(header => {
            // Remove existing listeners to prevent duplicates
            header.replaceWith(header.cloneNode(true));
        });

        // Re-query after clone
        const freshHeaders = this.container.querySelectorAll('thead th[data-sort]');
        freshHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const field = header.getAttribute('data-sort');
                this.handleSort(field);
            });
        });
    }

    /**
     * Bind action events for edit/delete buttons
     * @param {Function} onEdit - Edit button callback
     * @param {Function} onDelete - Delete button callback
     */
    bindActionEvents(onEdit, onDelete) {
        if (!this.container) return;

        this.container.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            const contractorId = target.getAttribute('data-contractor-id');
            const contractorName = target.getAttribute('data-contractor-name');

            console.log('🖱️ Contractor button clicked:', {
                target: target.className,
                contractorId: contractorId,
                contractorName: contractorName,
                hasOnEdit: !!onEdit,
                hasOnDelete: !!onDelete
            });

            if (!contractorId) return;

            if (target.classList.contains('edit-contractor') && onEdit) {
                console.log('📤 Calling onEdit with contractorId:', contractorId);
                onEdit(contractorId);
            } else if (target.classList.contains('delete-contractor') && onDelete) {
                onDelete(contractorId, contractorName);
            }
        });
    }

    /**
     * Filter contractors based on search term
     * @param {string} searchTerm - Search term to filter by
     */
    filterContractors(searchTerm) {
        const contractors = this.dataModule.getContractors();
        const filtered = contractors.filter(contractor => {
            const searchLower = searchTerm.toLowerCase();
            
            const nameMatch = contractor.name?.toLowerCase().includes(searchLower) || false;
            const categoryMatch = contractor.category?.toLowerCase().includes(searchLower) || false;
            const emailMatch = (contractor.email || '').toLowerCase().includes(searchLower);
            const locationMatch = contractor.location?.toLowerCase().includes(searchLower) || false;
            const phoneMatch = (contractor.phone || '').toLowerCase().includes(searchLower);
            const descriptionMatch = (contractor.description || '').toLowerCase().includes(searchLower);
            
            return nameMatch || categoryMatch || emailMatch || locationMatch || phoneMatch || descriptionMatch;
        });
        this.renderTable(filtered);
    }

    /**
     * Generate empty state HTML for when no contractors are available
     * @returns {string} Empty state HTML
     */
    generateEmptyTableState() {
        return `
            <div class="empty-state">
                <span class="material-icons empty-icon">business_center</span>
                <h3>No Contractors Found</h3>
                <p>No contractors are available to display.</p>
            </div>
        `;
    }

    /**
     * Refresh the table with current data
     */
    refresh() {
        this.renderTable();
    }

    /**
     * Update sort state externally
     * @param {string} field - Field to sort by
     * @param {string} direction - Sort direction ('asc' or 'desc')
     */
    setSortState(field, direction) {
        this.sortState.field = field;
        this.sortState.direction = direction;
        this.renderTable();
    }

    /**
     * Get current sort state
     * @returns {Object} Current sort state
     */
    getSortState() {
        return { ...this.sortState };
    }

    /**
     * Get the container element
     * @returns {HTMLElement|null} The container element
     */
    getContainer() {
        return this.container;
    }

    /**
     * Clean up event listeners and references
     */
    destroy() {
        // Clean up any event listeners if needed
        this.container = null;
    }
}

export default ContractorsTableManager;