// js/modules/reviewManager.js
class ReviewManager {
    constructor() {
        this.reviews = [];
        this.contractorManager = null;
        this.storage = null;
        this.utils = null;
    }

    init(contractorManager, storage, defaultReviews = [], utils) {
        this.contractorManager = contractorManager;
        this.storage = storage;
        this.utils = utils;
        
        const saved = this.storage.load('reviews');
        
        if (saved && saved.length > 0) {
            this.reviews = saved;
        } else {
            // Load default reviews if no saved reviews exist
            this.reviews = JSON.parse(JSON.stringify(defaultReviews));
            this.save();
        }
        
        // Update all contractor stats after loading reviews
        this.updateAllContractorStats();
    }

    save = () => this.storage.save('reviews', this.reviews);

    getAllReviews = () => this.reviews;

    getReviewsByContractor = (contractorId) => 
        this.reviews.filter(review => review.contractor_id === contractorId);

    getApprovedReviewsByContractor = (contractorId) =>
        this.reviews.filter(review => review.contractor_id === contractorId && review.status === 'approved');

    addReview(contractorId, reviewData) {
        const contractor = this.contractorManager.getById(contractorId);
        if (!contractor) {
            throw new Error(`Contractor with ID ${contractorId} not found`);
        }

        // Calculate overall rating from category ratings
        const categoryRatings = [
            reviewData.qualityRating,
            reviewData.communicationRating,
            reviewData.timelinessRating,
            reviewData.valueRating
        ].filter(rating => rating > 0);
        
        const overallRating = categoryRatings.length > 0 
            ? Math.round(categoryRatings.reduce((sum, rating) => sum + rating, 0) / categoryRatings.length)
            : 0;

        const review = {
            id: this.utils.generateId(),
            contractor_id: contractorId,
            reviewerName: reviewData.reviewerName,
            rating: overallRating,
            categoryRatings: {
                quality: reviewData.qualityRating,
                communication: reviewData.communicationRating,
                timeliness: reviewData.timelinessRating,
                value: reviewData.valueRating
            },
            projectType: reviewData.projectType,
            comment: reviewData.comment,
            date: new Date().toISOString(),
            status: 'pending'
        };

        this.reviews.push(review);
        this.save();
        this.updateContractorStats(contractorId);
        
        this.utils.showNotification('Review submitted successfully! It will be visible after approval.', 'success');
        
        return review;
    }

    updateReviewStatus(reviewId, status) {
        const review = this.reviews.find(r => r.id === reviewId);
        if (!review) return false;

        review.status = status;
        this.save();
        this.updateContractorStats(review.contractor_id);

        this.utils.showNotification(`Review ${status} successfully!`, 'success');
        return true;
    }

    deleteReview(reviewId) {
        const index = this.reviews.findIndex(r => r.id === reviewId);
        if (index === -1) return false;

        const review = this.reviews[index];
        this.reviews.splice(index, 1);
        this.save();
        this.updateContractorStats(review.contractor_id);

        this.utils.showNotification('Review deleted successfully!', 'success');
        return true;
    }

    searchReviews(searchTerm = '', statusFilter = 'all', contractorFilter = 'all') {
        return this.reviews.filter(review => {
            const contractor = this.contractorManager.getById(review.contractor_id);
            const contractorName = contractor ? contractor.name : '';
            
            const matchesSearch = !searchTerm ||
                review.reviewerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                contractorName.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = statusFilter === 'all' || review.status === statusFilter;
            const matchesContractor = contractorFilter === 'all' || review.contractor_id === contractorFilter;
            
            return matchesSearch && matchesStatus && matchesContractor;
        });
    }

    updateContractorStats(contractorId) {
        const contractor = this.contractorManager.getById(contractorId);
        if (!contractor) return;

        const approvedReviews = this.getApprovedReviewsByContractor(contractorId);
        
        contractor.reviewCount = approvedReviews.length;
        contractor.overallRating = this.calculateOverallRating(approvedReviews);
        
        this.contractorManager.save();
    }

    updateAllContractorStats() {
        const contractors = this.contractorManager.getAll();
        contractors.forEach(contractor => {
            this.updateContractorStats(contractor.id);
        });
    }

    calculateOverallRating(reviews) {
        if (!reviews || reviews.length === 0) return 0;
        
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        return parseFloat((totalRating / reviews.length).toFixed(1));
    }

    getCategoryAverage(contractorId, category) {
        const approvedReviews = this.getApprovedReviewsByContractor(contractorId);
        
        if (approvedReviews.length === 0) return 0;

        const total = approvedReviews.reduce((sum, review) => 
            sum + review.categoryRatings[category], 0
        );
        
        return parseFloat((total / approvedReviews.length).toFixed(1));
    }

    getPendingReviewsCount = () => 
        this.reviews.filter(review => review.status === 'pending').length;

    // Refresh reviews data from storage
    refresh() {
        const saved = this.storage.load('reviews');
        if (saved && saved.length > 0) {
            this.reviews = saved;
        }
    }
}

// Create singleton instance
const reviewManager = new ReviewManager();