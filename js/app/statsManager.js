// js/app/statsManager.js
// ES6 Module for statistics display management

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
            totalContractorsCount: document.getElementById('totalContractorsCount'),
            totalReviewsCount: document.getElementById('totalReviewsCount'),
            averageRatingCount: document.getElementById('averageRatingCount'),
            favoritesCount: document.querySelector('.favorites-count')
        };
    }

    renderStats(filteredContractors = null) {
        const stats = filteredContractors ? 
            this.calculateFilteredStats(filteredContractors) : 
            this.dataModule.getStats();

        const { totalContractorsCount, totalReviewsCount, averageRatingCount } = this.elements;
        
        if (totalContractorsCount) totalContractorsCount.textContent = stats.totalContractors;
        if (totalReviewsCount) totalReviewsCount.textContent = stats.totalReviews;
        if (averageRatingCount) averageRatingCount.textContent = stats.averageRating;

        this.updateFavoritesCount();
    }

    calculateFilteredStats(contractors) {
        const totalContractors = contractors.length;
        const approvedReviews = contractors.flatMap(contractor => 
            this.reviewManager.getApprovedReviewsByContractor(contractor.id)
        );
        const totalReviews = approvedReviews.length;
        
        const averageRating = contractors.length > 0 ? 
            contractors.reduce((total, contractor) => total + parseFloat(contractor.overallRating || 0), 0) / contractors.length : 0;

        return {
            totalContractors,
            totalReviews,
            averageRating: averageRating.toFixed(1)
        };
    }

    updateFavoritesCount() {
        const { favoritesCount } = this.elements;
        const count = this.dataModule.getFavoritesCount();
        
        if (favoritesCount) {
            favoritesCount.textContent = count;
        }
        
        const favoritesStat = document.querySelector('.favorites-stat .stat-number');
        if (favoritesStat) {
            favoritesStat.textContent = count;
        }
    }

    updateStats(filteredContractors) {
        this.renderStats(filteredContractors);
    }

    // Event subscription for stats updates
    onStatsUpdate(callback) {
        // Can be used by other components to request stats updates
        document.addEventListener('statsUpdateRequested', (event) => {
            this.renderStats(event.detail?.contractors);
        });
    }

    // Method to manually trigger stats update
    refresh() {
        this.renderStats();
    }
}