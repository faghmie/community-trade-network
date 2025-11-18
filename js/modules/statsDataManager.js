// js/modules/statsDataManager.js
// ES6 Module for statistics data management

export class StatsDataManager {
    constructor() {
        this.contractorManager = null;
        this.reviewManager = null;
    }

    init(contractorManager, reviewManager) {
        this.contractorManager = contractorManager;
        this.reviewManager = reviewManager;
    }

    getStats() {
        const contractors = this.contractorManager.getAll();
        const totalContractors = contractors.length;
        
        // Get all reviews from reviewManager instead of contractor.reviews
        const allReviews = this.reviewManager.getAllReviews();
        const totalReviews = allReviews.length;
        
        const approvedReviews = allReviews.filter(review => review.status === 'approved');
        const averageRating = approvedReviews.length > 0 ? 
            approvedReviews.reduce((total, review) => total + review.rating, 0) / approvedReviews.length : 0;

        const reviewStats = this.getReviewStats();

        return {
            totalContractors: totalContractors,
            totalReviews: totalReviews,
            averageRating: averageRating.toFixed(1),
            pendingReviews: reviewStats.pendingReviews
        };
    }

    getReviewStats() {
        const allReviews = this.reviewManager.getAllReviews();
        return {
            totalReviews: allReviews.length,
            approvedReviews: allReviews.filter(r => r.status === 'approved').length,
            pendingReviews: allReviews.filter(r => r.status === 'pending').length,
            rejectedReviews: allReviews.filter(r => r.status === 'rejected').length
        };
    }
}