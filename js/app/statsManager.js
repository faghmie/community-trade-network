// js/app/statsManager.js
// ES6 Module for statistics display management - Now only handles contractor count

export class StatsManager {
    constructor(dataModule, reviewManager) {
        this.dataModule = dataModule;
        this.reviewManager = reviewManager;
        this.elements = {};
    }

    async init() {
        this.cacheElements();
        this.renderStats();
    }

    cacheElements() {
        this.elements = {
            // ONLY keeping the contractor count element for the Available Contractors section
            contractorsCount: document.getElementById('contractorsCount')
        };
    }

    // Single method to handle contractor count UI rendering
    renderStats(filteredContractors = null) {
        const stats = filteredContractors ? 
            this.calculateFilteredStats(filteredContractors) : 
            this.dataModule.getStats();

        this.updateContractorCountUI(stats);
        
        console.log('StatsManager: Updated contractor count -', {
            contractors: stats.totalContractors
        });
    }

    // Update only the contractor count element
    updateContractorCountUI(stats) {
        if (this.elements.contractorsCount) {
            const count = stats.totalContractors || 0;
            this.elements.contractorsCount.textContent = `${count} contractor${count !== 1 ? 's' : ''}`;
        }
    }

    calculateFilteredStats(contractors) {
        const totalContractors = contractors.length;
        
        return {
            totalContractors
        };
    }

    // Public API maintained for compatibility
    updateStats(filteredContractors) {
        this.renderStats(filteredContractors);
    }

    refresh() {
        this.renderStats();
    }

    // Cleanup
    destroy() {
        // No specific cleanup needed
    }
}