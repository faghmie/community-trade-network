// js/app/views/contractorListView.js
// ES6 Module for contractor list view management - Event Driven

import { CardManager } from '../modules/cardManager.js';

export class ContractorListView {
    constructor(dataModule, reviewManager) {
        this.dataModule = dataModule;
        this.reviewManager = reviewManager;
        this.cardManager = new CardManager(dataModule, reviewManager);
        
        this.container = document.getElementById('contractor-cards-container');
        this.resultsCount = document.getElementById('results-count');
        
        this.initializeEventListeners();
    }

    /**
     * Initialize event listeners for the contractor list view
     */
    initializeEventListeners() {
        // Listen for contractor list updates
        document.addEventListener('contractorsListUpdate', (event) => {
            this.renderContractorList(event.detail.contractors);
        });

        // Listen for favorites updates to refresh card states
        document.addEventListener('favoritesUpdated', () => {
            // Re-render current contractors to update favorite button states
            const currentEvent = new CustomEvent('requestCurrentContractors');
            document.dispatchEvent(currentEvent);
        });

        // Listen for view state changes
        document.addEventListener('viewStateChanged', (event) => {
            if (event.detail.view === 'list') {
                this.show();
            } else {
                this.hide();
            }
        });

        // Listen for requests to show this view
        document.addEventListener('showContractorListView', () => {
            this.show();
        });

        // Listen for requests to hide this view
        document.addEventListener('hideContractorListView', () => {
            this.hide();
        });

        // Respond to requests for current contractors
        document.addEventListener('requestCurrentContractors', () => {
            // This event should be handled by FilterManager or Main to provide current contractors
        });
    }

    /**
     * Render the contractor list based on provided contractors array
     * @param {Array} contractors - Array of contractor objects to display
     */
    renderContractorList(contractors) {
        if (!this.container) {
            console.warn('Contractor cards container not found');
            return;
        }

        this.cardManager.renderContractorCards(contractors, this.container);
        this.updateResultsCount(contractors ? contractors.length : 0);
        
        // Dispatch event that rendering is complete
        document.dispatchEvent(new CustomEvent('contractorListRendered', {
            detail: {
                contractorCount: contractors ? contractors.length : 0,
                timestamp: new Date().toISOString()
            }
        }));
    }

    /**
     * Update the results count display
     * @param {number} count - Number of contractors displayed
     */
    updateResultsCount(count) {
        if (this.resultsCount) {
            this.resultsCount.textContent = `${count} contractor${count !== 1 ? 's' : ''} found`;
        }
    }

    /**
     * Show the contractor list view
     */
    show() {
        if (this.container) {
            this.container.style.display = 'block';
        }
        
        // Dispatch event that view is now visible
        document.dispatchEvent(new CustomEvent('contractorListViewShown'));
    }

    /**
     * Hide the contractor list view
     */
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
        
        // Dispatch event that view is now hidden
        document.dispatchEvent(new CustomEvent('contractorListViewHidden'));
    }

    /**
     * Get the current display state
     * @returns {Object} Current view state
     */
    getDisplayState() {
        return {
            isVisible: this.container ? this.container.style.display !== 'none' : false,
            containerExists: !!this.container
        };
    }

    /**
     * Clean up event listeners
     */
    destroy() {
        // Remove any specific event listeners if needed
        // Currently using anonymous functions so no need for explicit removal
    }
}