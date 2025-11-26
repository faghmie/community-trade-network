/**
 * CategoriesModal - Handles category form modal creation, management, and interactions
 * Refactored to use BaseModal for common functionality
 */

import BaseModal from '../shared/base-modal.js';
import { sanitizeHtml } from '../../modules/utilities.js';
import { showNotification } from '../../modules/notifications.js';

class CategoriesModal extends BaseModal {
    constructor(dataModule) {
        super('categoryFormModal', 'Category');
        this.dataModule = dataModule;
        this.typeSuggestions = [];
        this.subtypeSuggestions = [];
        this.currentType = '';
    }

    /**
     * Generate modal body with auto-complete fields
     */
    generateModalBody() {
        return `
            <form id="categoryForm" class="material-form">
                <input type="hidden" id="categoryId">
                
                <div class="material-form-group autocomplete-container">
                    <label for="categoryType" class="material-input-label">Type</label>
                    <input type="text" id="categoryType" name="type" class="material-input" required autocomplete="off">
                    <div class="material-input-helper">Main category type (e.g., "Business Services")</div>
                    <div class="autocomplete-suggestions" id="typeSuggestionsList"></div>
                </div>
                
                <div class="material-form-group autocomplete-container">
                    <label for="categorySubtype" class="material-input-label">Sub-Type</label>
                    <input type="text" id="categorySubtype" name="subtype" class="material-input" required autocomplete="off">
                    <div class="material-input-helper">Specific subtype (e.g., "Cosmetics")</div>
                    <div class="autocomplete-suggestions" id="subtypeSuggestionsList"></div>
                </div>
                
                <div class="material-form-group">
                    <label for="categoryName" class="material-input-label">Category Name</label>
                    <input type="text" id="categoryName" name="name" class="material-input" required>
                    <div class="material-input-helper">Specific category name (e.g., "Jewelery")</div>
                </div>
                
                <div class="material-form-group">
                    <label for="categoryDescription" class="material-input-label">Description</label>
                    <textarea id="categoryDescription" name="description" class="material-input" rows="3"></textarea>
                    <div class="material-input-helper">Detailed description of services included</div>
                </div>
            </form>
        `;
    }

    /**
     * Initialize modal with auto-complete functionality
     */
    async initializeModal() {
        this.loadSuggestions();
        this.bindAutocompleteEvents();
    }

    /**
     * Load type and subtype suggestions from existing categories
     */
    loadSuggestions() {
        // Check if dataModule is available and has getCategories method
        if (!this.dataModule || typeof this.dataModule.getCategories !== 'function') {
            console.warn('CategoriesModal: dataModule not available or missing getCategories method');
            this.typeSuggestions = [];
            this.subtypeSuggestions = [];
            return;
        }

        try {
            const categories = this.dataModule.getCategories();

            // Extract unique types
            this.typeSuggestions = [...new Set(categories.map(cat => cat.type).filter(Boolean))];

            // Extract unique subtypes
            this.subtypeSuggestions = [...new Set(categories.map(cat => cat.subtype).filter(Boolean))];

            // Sort alphabetically
            this.typeSuggestions.sort();
            this.subtypeSuggestions.sort();
        } catch (error) {
            console.error('CategoriesModal: Error loading suggestions:', error);
            this.typeSuggestions = [];
            this.subtypeSuggestions = [];
        }
    }

    /**
     * Bind events for auto-complete functionality
     */
    bindAutocompleteEvents() {
        const typeInput = this.modalElement.querySelector('#categoryType');
        const subtypeInput = this.modalElement.querySelector('#categorySubtype');

        if (typeInput) {
            typeInput.addEventListener('input', (e) => {
                this.handleTypeInput(e.target.value);
            });

            typeInput.addEventListener('focus', (e) => {
                this.showTypeSuggestions(e.target.value);
                e.target.closest('.autocomplete-container').classList.add('focused');
            });

            typeInput.addEventListener('blur', (e) => {
                setTimeout(() => {
                    this.hideSuggestions();
                    e.target.closest('.autocomplete-container').classList.remove('focused');
                }, 150);
            });
        }

        if (subtypeInput) {
            subtypeInput.addEventListener('input', (e) => {
                this.handleSubtypeInput(e.target.value);
            });

            subtypeInput.addEventListener('focus', (e) => {
                this.showSubtypeSuggestions(e.target.value);
                e.target.closest('.autocomplete-container').classList.add('focused');
            });

            subtypeInput.addEventListener('blur', (e) => {
                setTimeout(() => {
                    this.hideSuggestions();
                    e.target.closest('.autocomplete-container').classList.remove('focused');
                }, 150);
            });
        }

        // Keyboard navigation for suggestions
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                this.handleKeyboardNavigation(e);
            } else if (e.key === 'Enter') {
                this.handleSuggestionSelect(e);
            }
        });
    }

    /**
     * Handle escape key to hide suggestions first
     */
    handleEscapeKey() {
        return this.hideSuggestions();
    }

    /**
     * Handle type input for auto-complete
     */
    handleTypeInput(value) {
        this.currentType = value;
        this.showTypeSuggestions(value);

        // When type changes, update subtype suggestions based on selected type
        const subtypeInput = this.modalElement.querySelector('#categorySubtype');
        if (subtypeInput && subtypeInput.value) {
            // If subtype input has value, refresh its suggestions
            this.showSubtypeSuggestions(subtypeInput.value);
        }
    }

    /**
     * Handle subtype input for auto-complete
     */
    handleSubtypeInput(value) {
        this.showSubtypeSuggestions(value);
    }

    /**
     * Show type suggestions based on input
     */
    showTypeSuggestions(query) {
        const filtered = this.typeSuggestions.filter(type =>
            type.toLowerCase().includes(query.toLowerCase())
        );
        this.showSuggestions('type', filtered, query);
    }

    /**
     * Show subtype suggestions based on input and current type selection
     */
    showSubtypeSuggestions(query) {
        let filtered = [];

        if (this.currentType) {
            // If we have a current type, get subtypes used with this type
            const categories = this.dataModule.getCategories();
            const typeSpecificSubtypes = [...new Set(
                categories
                    .filter(cat => cat.type === this.currentType && cat.subtype)
                    .map(cat => cat.subtype)
                    .filter(Boolean)
            )];

            // Use only type-specific subtypes
            filtered = typeSpecificSubtypes.sort();
        } else {
            // If no type selected, show all available subtypes
            filtered = [...this.subtypeSuggestions];
        }

        // Filter by search query
        filtered = filtered.filter(subtype =>
            subtype.toLowerCase().includes(query.toLowerCase())
        );

        this.showSuggestions('subtype', filtered, query);
    }

    /**
     * Display suggestions in the UI
     */
    showSuggestions(field, suggestions, query) {
        const container = this.modalElement.querySelector(`#${field}SuggestionsList`);
        if (!container) return;

        if (suggestions.length === 0 || !query) {
            container.innerHTML = '';
            container.style.display = 'none';
            return;
        }

        const suggestionsHTML = suggestions.map(suggestion =>
            `<div class="autocomplete-suggestion" data-value="${sanitizeHtml(suggestion)}">
                ${this.highlightMatch(suggestion, query)}
            </div>`
        ).join('');

        container.innerHTML = suggestionsHTML;
        container.style.display = 'block';

        // Bind click events to suggestions
        container.querySelectorAll('.autocomplete-suggestion').forEach(suggestion => {
            suggestion.addEventListener('mousedown', (e) => {
                e.preventDefault(); // Prevent input blur
                this.selectSuggestion(field, suggestion.getAttribute('data-value'));
            });
        });
    }

    /**
     * Highlight matching text in suggestions
     */
    highlightMatch(text, query) {
        if (!query) return sanitizeHtml(text);

        const index = text.toLowerCase().indexOf(query.toLowerCase());
        if (index === -1) return sanitizeHtml(text);

        const before = text.substring(0, index);
        const match = text.substring(index, index + query.length);
        const after = text.substring(index + query.length);

        return `${sanitizeHtml(before)}<strong>${sanitizeHtml(match)}</strong>${sanitizeHtml(after)}`;
    }

    /**
     * Select a suggestion and update the input field
     */
    selectSuggestion(field, value) {
        const input = this.modalElement.querySelector(`#category${field.charAt(0).toUpperCase() + field.slice(1)}`);
        if (input) {
            input.value = value;
            input.focus();

            // If type was selected, refresh subtype suggestions
            if (field === 'type') {
                this.currentType = value;
                const subtypeInput = this.modalElement.querySelector('#categorySubtype');
                if (subtypeInput) {
                    // Clear current subtype and refresh suggestions
                    subtypeInput.value = '';
                    this.showSubtypeSuggestions('');
                }
            }
        }
        this.hideSuggestions();
    }

    /**
     * Hide all suggestion lists
     */
    hideSuggestions() {
        const containers = this.modalElement.querySelectorAll('.autocomplete-suggestions');
        let wasVisible = false;

        containers.forEach(container => {
            if (container.style.display !== 'none') {
                wasVisible = true;
            }
            container.style.display = 'none';
        });

        return wasVisible;
    }

    /**
     * Handle keyboard navigation for suggestions
     */
    handleKeyboardNavigation(e) {
        const visibleContainer = this.modalElement.querySelector('.autocomplete-suggestions[style="display: block"]');
        if (!visibleContainer) return;

        e.preventDefault();
        const suggestions = visibleContainer.querySelectorAll('.autocomplete-suggestion');
        if (suggestions.length === 0) return;

        const currentSelected = visibleContainer.querySelector('.autocomplete-suggestion.selected');
        let nextIndex = 0;

        if (currentSelected) {
            const currentIndex = Array.from(suggestions).indexOf(currentSelected);
            nextIndex = e.key === 'ArrowDown'
                ? Math.min(currentIndex + 1, suggestions.length - 1)
                : Math.max(currentIndex - 1, 0);

            currentSelected.classList.remove('selected');
        }

        suggestions[nextIndex].classList.add('selected');
        suggestions[nextIndex].scrollIntoView({ block: 'nearest' });
    }

    /**
     * Handle suggestion selection with Enter key
     */
    handleSuggestionSelect(e) {
        const visibleContainer = this.modalElement.querySelector('.autocomplete-suggestions[style="display: block"]');
        if (!visibleContainer) return;

        const selected = visibleContainer.querySelector('.autocomplete-suggestion.selected');
        if (!selected) return;

        e.preventDefault();
        const field = visibleContainer.id.replace('SuggestionsList', '');
        const value = selected.getAttribute('data-value');

        if (field === 'type') {
            // When type is selected, update currentType and refresh subtype suggestions
            this.currentType = value;
            const subtypeInput = this.modalElement.querySelector('#categorySubtype');
            if (subtypeInput) {
                subtypeInput.value = ''; // Clear subtype when type changes
                this.showSubtypeSuggestions(''); // Refresh subtype suggestions
            }
        }

        this.selectSuggestion(field, value);
    }

    /**
     * Populate form with category data
     */
    async populateModal(category, options) {
        const form = this.modalElement.querySelector('#categoryForm');
        if (!form) return;

        if (category) {
            // Edit mode
            this.setFormValue('categoryId', category.id || '');
            this.setFormValue('categoryType', category.type || '');
            this.setFormValue('categorySubtype', category.subtype || '');
            this.setFormValue('categoryName', category.name || '');
            this.setFormValue('categoryDescription', category.description || '');

            // Set current type for auto-complete
            this.currentType = category.type || '';
        } else {
            // Add mode
            form.reset();
            this.setFormValue('categoryId', '');
            this.currentType = '';
        }
    }

    /**
     * Get current form data as an object
     */
    async getFormData() {
        const form = this.modalElement.querySelector('#categoryForm');
        if (!form) return null;

        const formData = new FormData(form);
        return {
            id: this.getFormValue('categoryId'),
            type: formData.get('type').trim(),
            subtype: formData.get('subtype').trim(),
            name: formData.get('name').trim(),
            description: formData.get('description').trim()
        };
    }

    /**
     * Validate form data
     */
    validateForm(formData) {
        this.clearAllErrors();

        let isValid = true;

        if (!formData.type) {
            this.setFieldError('categoryType', 'Type is required');
            isValid = false;
        }

        if (!formData.subtype) {
            this.setFieldError('categorySubtype', 'Sub-Type is required');
            isValid = false;
        }

        if (!formData.name) {
            this.setFieldError('categoryName', 'Category Name is required');
            isValid = false;
        }

        if (!isValid) {
            showNotification('Please fill in all required fields', 'error');
        }

        return isValid;
    }

    /**
     * Hook called before modal opens
     */
    async beforeOpen(data, options) {
        this.loadSuggestions();
        this.currentType = '';
        
        // Populate the form with the provided category data
        if (data) {
            await this.populateModal(data, options);
        }
    }

    /**
     * Hook called before modal closes
     */
    beforeClose() {
        this.hideSuggestions();
        this.currentType = '';
    }

    /**
     * Public method to open modal with category ID
     */
    openWithCategory(categoryId = null, onSave = null) {
        if (categoryId) {
            // EDIT MODE - Fetch fresh data by ID
            const categories = this.dataModule.getCategories();
            const category = categories.find(cat => cat.id === categoryId);
            if (!category) {
                showNotification('Category not found', 'error');
                return;
            }

            // Pass the category data to the open method
            this.open(category, { onSave });
        } else {
            // CREATE MODE
            this.open(null, { onSave });
        }
    }
}

export default CategoriesModal;