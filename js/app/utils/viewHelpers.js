// js/app/utils/viewHelpers.js
/**
 * Utility for creating consistent view headers across the application
 */

/**
 * Creates standardized view header HTML and provides event binding
 * @param {string} viewId - The ID of the view (e.g., 'contractorView')
 * @param {string} title - The main title text
 * @param {string} subtitle - The subtitle text (optional)
 * @param {boolean} showBackButton - Whether to show the back button (default: true)
 * @returns {Object} Object containing HTML string and binding methods
 */
export function createViewHeader(viewId, title, subtitle = '', showBackButton = true) {
    const backButtonHtml = showBackButton ? `
        <button class="material-icon-button back-button" id="${viewId}BackBtn" aria-label="Go back">
            <i class="material-icons">arrow_back</i>
        </button>
    ` : '<div class="header-spacer"></div>';

    const subtitleHtml = subtitle ? `
        <div class="view-subtitle" id="${viewId}Subtitle">${subtitle}</div>
    ` : '';

    return {
        html: `
            <div class="view-header">
                <div class="header-top-row">
                    ${backButtonHtml}
                    <h1 class="view-title" id="${viewId}Title">${title}</h1>
                </div>
                ${subtitleHtml}
            </div>
        `,
        
        /**
         * Binds the back button click handler
         * @param {Function} handler - Click handler function
         */
        bindBackButton(handler) {
            if (showBackButton) {
                document.getElementById(`${viewId}BackBtn`)?.addEventListener('click', handler);
            }
        },
        
        /**
         * Updates the header title and subtitle
         * @param {string} newTitle - New title text
         * @param {string} newSubtitle - New subtitle text (optional)
         */
        updateHeader(newTitle, newSubtitle = '') {
            const titleElement = document.getElementById(`${viewId}Title`);
            const subtitleElement = document.getElementById(`${viewId}Subtitle`);
            
            if (titleElement) titleElement.textContent = newTitle;
            if (subtitleElement && newSubtitle) subtitleElement.textContent = newSubtitle;
        },
        
        /**
         * Gets the current header elements for direct manipulation
         * @returns {Object} Object with title and subtitle elements
         */
        getHeaderElements() {
            return {
                title: document.getElementById(`${viewId}Title`),
                subtitle: document.getElementById(`${viewId}Subtitle`)
            };
        }
    };
}

export default {
    createViewHeader
};