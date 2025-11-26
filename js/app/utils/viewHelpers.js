// js/app/utils/viewHelpers.js
/**
 * View-specific utilities for consistent UI components
 * No duplication with utilities.js - only view-specific helpers
 */
import { sanitizeHtml } from '../../modules/utilities.js';

/**
 * Creates standardized view header with consistent styling and behavior
 */
export function createViewHeader(viewId, title, subtitle = '', showBackButton = true) {
    const elements = {
        backButton: showBackButton ? createBackButton(viewId) : createSpacer(),
        subtitle: subtitle ? createSubtitle(viewId, subtitle) : ''
    };

    return {
        html: createHeaderHTML(viewId, title, elements),
        bindBackButton: (handler) => bindBackButtonHandler(viewId, handler),
        updateHeader: (newTitle, newSubtitle = '') => updateHeaderText(viewId, newTitle, newSubtitle),
        getHeaderElements: () => getHeaderElements(viewId)
    };
}

// Component creation functions
function createBackButton(viewId) {
    return `
        <button class="material-icon-button back-button" id="${viewId}BackBtn" aria-label="Go back">
            <i class="material-icons">arrow_back</i>
        </button>
    `;
}

function createSpacer() {
    return '<div class="header-spacer"></div>';
}

function createSubtitle(viewId, subtitle) {
    return `<div class="view-subtitle" id="${viewId}Subtitle">${subtitle}</div>`;
}

function createHeaderHTML(viewId, title, elements) {
    return `
        <div class="view-header">
            <div class="header-top-row">
                ${elements.backButton}
                <h1 class="view-title" id="${viewId}Title">${title}</h1>
            </div>
            ${elements.subtitle}
        </div>
    `;
}

// Event binding functions
function bindBackButtonHandler(viewId, handler) {
    const backButton = document.getElementById(`${viewId}BackBtn`);
    if (backButton) {
        backButton.addEventListener('click', handler);
    }
}

function updateHeaderText(viewId, newTitle, newSubtitle) {
    const titleElement = document.getElementById(`${viewId}Title`);
    const subtitleElement = document.getElementById(`${viewId}Subtitle`);
    
    if (titleElement) titleElement.textContent = newTitle;
    if (subtitleElement && newSubtitle) subtitleElement.textContent = newSubtitle;
}

function getHeaderElements(viewId) {
    return {
        title: document.getElementById(`${viewId}Title`),
        subtitle: document.getElementById(`${viewId}Subtitle`)
    };
}

/**
 * Creates a loading spinner with optional text
 */
export function createLoadingSpinner(text = 'Loading...') {
    return `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <div class="loading-text">${text}</div>
        </div>
    `;
}

/**
 * Creates an empty state message with optional action button
 */
export function createEmptyState(message, buttonText = '', buttonAction = null) {
    const buttonHTML = buttonText ? `
        <button class="material-button primary empty-state-action" id="emptyStateAction">
            ${buttonText}
        </button>
    ` : '';

    const html = `
        <div class="empty-state">
            <i class="material-icons empty-state-icon">inbox</i>
            <div class="empty-state-message">${message}</div>
            ${buttonHTML}
        </div>
    `;

    return {
        html,
        bindAction: (handler) => {
            const button = document.getElementById('emptyStateAction');
            if (button && handler) {
                button.addEventListener('click', handler);
            }
        }
    };
}

/**
 * Creates a standardized card component
 */
export function createCard(content, classes = '') {
    return `<div class="material-card ${classes}">${content}</div>`;
}

/**
 * Creates a material design button
 */
export function createButton(text, type = 'primary', icon = '', id = '') {
    const iconHTML = icon ? `<i class="material-icons">${icon}</i>` : '';
    const idAttr = id ? `id="${id}"` : '';
    
    return `
        <button ${idAttr} class="material-button ${type}">
            ${iconHTML}
            ${text}
        </button>
    `;
}

/**
 * Helper to safely set innerHTML and bind events
 * Uses sanitizeHtml from utilities.js for XSS protection
 */
export function renderWithBindings(container, html, bindings = {}) {
    if (!container) return;
    
    container.innerHTML = html;
    
    // Bind events to elements
    Object.entries(bindings).forEach(([elementId, handler]) => {
        const element = document.getElementById(elementId);
        if (element && handler) {
            element.addEventListener('click', handler);
        }
    });
}

/**
 * Format phone number for display (view-specific formatting)
 */
export function formatPhoneNumber(phone) {
    if (!phone) return '';
    
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // South African phone number format
    if (cleaned.length === 10 && cleaned.startsWith('0')) {
        return `+27 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    }
    
    // International format
    if (cleaned.length === 11 && cleaned.startsWith('27')) {
        return `+27 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
    }
    
    return phone; // Return original if format doesn't match
}

/**
 * Format address for display (view-specific formatting)
 */
export function formatAddress(address) {
    if (!address) return 'No address provided';
    
    const parts = [
        address.street,
        address.suburb,
        address.city,
        address.province,
        address.postalCode
    ].filter(part => part && part.trim());
    
    return parts.join(', ') || 'Address not specified';
}

/**
 * Truncate text with ellipsis (view-specific utility)
 */
export function truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

/**
 * Create category badge with consistent styling
 */
export function createCategoryBadge(categoryName, isSelected = false) {
    const selectedClass = isSelected ? 'selected' : '';
    return `
        <span class="category-badge ${selectedClass}" data-category="${sanitizeHtml(categoryName)}">
            ${sanitizeHtml(categoryName)}
        </span>
    `;
}

/**
 * Create rating stars HTML
 */
export function createRatingStars(rating, maxRating = 5) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHTML = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="material-icons star full">star</i>';
    }
    
    // Half star
    if (hasHalfStar) {
        starsHTML += '<i class="material-icons star half">star_half</i>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="material-icons star empty">star_border</i>';
    }
    
    return starsHTML;
}

/**
 * Create favorite button with consistent styling
 */
export function createFavoriteButton(contractorId, isFavorite = false) {
    const favoriteClass = isFavorite ? 'favorited' : '';
    const icon = isFavorite ? 'favorite' : 'favorite_border';
    
    return `
        <button class="material-icon-button favorite-button ${favoriteClass}" 
                data-contractor-id="${contractorId}" 
                aria-label="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
            <i class="material-icons">${icon}</i>
        </button>
    `;
}

export default {
    createViewHeader,
    createLoadingSpinner,
    createEmptyState,
    createCard,
    createButton,
    renderWithBindings,
    formatPhoneNumber,
    formatAddress,
    truncateText,
    createCategoryBadge,
    createRatingStars,
    createFavoriteButton
};