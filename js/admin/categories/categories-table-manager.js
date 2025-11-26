// js/admin/categories/categories-table-manager.js

import { sanitizeHtml } from '../../modules/utilities.js';

/**
 * CategoryTableManager - Handles table rendering, sorting, and row interactions
 * for the categories admin interface
 */
class CategoryTableManager {
    constructor(dataModule) {
        this.dataModule = dataModule;
        this.sortState = {
            field: 'type',
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
     * Render the categories table with optional filtered data
     * @param {Array} categories - Array of category objects to display
     */
    renderTable(categories = null) {
        if (!this.container) {
            console.error('CategoryTableManager: No container element provided');
            return;
        }

        const categoriesToRender = categories || this.getSortedCategories();

        if (categoriesToRender.length === 0) {
            this.container.innerHTML = this.generateEmptyTableState();
            return;
        }

        this.container.innerHTML = this.generateTableHTML(categoriesToRender);
        this.bindTableHeaderEvents();
    }

    /**
     * Generate the complete table HTML structure
     * @param {Array} categories - Categories to render
     * @returns {string} Table HTML
     */
    generateTableHTML(categories) {
        return `
            <div class="table-container">
                <table id="categoriesTable" class="table">
                    <thead>
                        <tr>
                            <th data-sort="type" class="sortable ${this.getSortClass('type')}">
                                Type
                                ${this.getSortIndicator('type')}
                            </th>
                            <th data-sort="subtype" class="sortable ${this.getSortClass('subtype')}">
                                Sub-Type
                                ${this.getSortIndicator('subtype')}
                            </th>
                            <th data-sort="name" class="sortable ${this.getSortClass('name')}">
                                Category
                                ${this.getSortIndicator('name')}
                            </th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${categories.map(category => this.generateTableRow(category)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Generate a single table row for a category
     * @param {Object} category - Category object
     * @returns {string} Table row HTML
     */
    generateTableRow(category) {
        const contractorsUsingCategory = this.dataModule.getContractors().filter(
            contractor => contractor.category === category.name
        );
        const hasContractors = contractorsUsingCategory.length > 0;

        return `
    <tr class="category-row" data-category-id="${category.id || ''}">
        <td class="category-type">${sanitizeHtml(category.type)}</td>
        <td class="category-subtype">${sanitizeHtml(category.subtype)}</td>
        <td class="category-name">
            <div class="category-name-primary">${sanitizeHtml(category.name)}</div>
            ${category.description ? `<div class="category-description">${sanitizeHtml(category.description)}</div>` : ''}
            <div class="category-stats">
                <span class="stat-badge">${contractorsUsingCategory.length} contractors</span>
            </div>
        </td>
        <td class="category-actions">
            <button class="btn btn-icon btn-small btn-primary edit-category" 
                    data-category-id="${category.id || ''}"
                    title="Edit Category">
                <span class="material-icons">edit</span>
            </button>
            <button class="btn btn-icon btn-small btn-danger delete-category" 
                    data-category-id="${category.id || ''}"
                    data-category-name="${sanitizeHtml(category.name)}"
                    ${hasContractors ? 'disabled' : ''}
                    title="${hasContractors ? 'Cannot delete category with contractors' : 'Delete Category'}">
                <span class="material-icons">delete</span>
            </button>
        </td>
    </tr>
`;
    }
    /**
     * Get categories sorted according to current sort state
     * @returns {Array} Sorted categories
     */
    getSortedCategories() {
        const categories = this.dataModule.getCategories();
        return categories.sort((a, b) => {
            let aValue = a[this.sortState.field] || '';
            let bValue = b[this.sortState.field] || '';

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

            const categoryId = target.getAttribute('data-category-id');
            const categoryName = target.getAttribute('data-category-name'); // Only for delete

            console.log('🖱️ Button clicked:', {
                target: target.className,
                categoryId: categoryId,
                categoryName: categoryName, // This will be null for edit buttons (correct)
                hasOnEdit: !!onEdit,
                hasOnDelete: !!onDelete
            });

            if (!categoryId) return;

            if (target.classList.contains('edit-category') && onEdit) {
                console.log('📤 Calling onEdit with categoryId:', categoryId);
                onEdit(categoryId); // Only pass ID
            } else if (target.classList.contains('delete-category') && onDelete) {
                // For delete, we need both ID and name for confirmation
                onDelete(categoryId, categoryName);
            }
        });
    }

    /**
     * Generate empty state HTML for when no categories are available
     * @returns {string} Empty state HTML
     */
    generateEmptyTableState() {
        return `
            <div class="empty-state">
                <span class="material-icons empty-icon">category</span>
                <h3>No Categories Found</h3>
                <p>No categories are available to display.</p>
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
}

export default CategoryTableManager;