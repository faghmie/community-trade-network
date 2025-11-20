// js/modules/reviewManager.js - FIXED CACHE ISSUE
// ES6 Module for review management

import { generateId } from './uuid.js';
import { showNotification } from './notifications.js';
import { defaultReviews as importedDefaultReviews } from '../data/defaultReviews.js';

export class ReviewManager {
    constructor() {
        this.reviews = [];
        this.contractorManager = null;
        this.storage = null;
        this.initialized = false;
    }

    async init(contractorManager, storage, defaultReviews = null) {
        this.contractorManager = contractorManager;
        this.storage = storage;

        // FIX: Use parameter if provided, otherwise use imported default
        const reviewsToUse = defaultReviews || JSON.parse(JSON.stringify(importedDefaultReviews));

        try {
            const saved = await this.storage.load('reviews');

            if (saved && saved.length > 0) {
                // Use saved reviews if they exist
                this.reviews = saved;
            } else if (saved !== null && saved !== undefined) {
                // CRITICAL FIX: If saved is explicitly null/undefined (no data), but we got a response,
                // don't load defaults. This means Supabase intentionally has 0 reviews.
                this.reviews = [];
            } else {
                // Only use defaults if we truly have no saved data (first-time setup)
                this.reviews = reviewsToUse;
            }

            // Update all contractor stats after loading reviews (only approved reviews)
            this.updateAllContractorStats();
            this.initialized = true;
        } catch (error) {
            console.error('ReviewManager initialization failed:', error);
            // Fall back to default reviews but don't save them
            this.reviews = reviewsToUse;
            this.updateAllContractorStats();
            this.initialized = true;
        }
    }

    async save() {
        await this.storage.save('reviews', this.reviews);
    }

    // CRITICAL FIX: Return raw reviews without enhancement - enhancement should happen at display time
    getAllReviews = () => {
        return [...this.reviews]; // Return a copy to prevent mutation
    };

    // NEW: Get reviews with current contractor information (fresh data every time)
    getReviewsWithContractorInfo = () => {
        return this.reviews.map(review => {
            // ALWAYS get fresh contractor data to ensure no stale information
            const contractor = this.contractorManager.getById(review.contractor_id);
            return {
                ...review,
                contractorId: review.contractor_id,
                contractorName: contractor ? contractor.name : 'Unknown Contractor',
                contractorCategory: contractor ? contractor.category : 'Unknown Category'
            };
        });
    };

    getReviewsByContractor = (contractorId) => {
        return this.reviews.filter(review => review.contractor_id === contractorId);
    }

    getApprovedReviewsByContractor = (contractorId) => {
        return this.reviews.filter(review => 
            review.contractor_id === contractorId && review.status === 'approved'
        );
    }

    getPendingReviewsByContractor = (contractorId) => {
        return this.reviews.filter(review => 
            review.contractor_id === contractorId && review.status === 'pending'
        );
    }

    async addReview(contractorId, reviewData) {
        const contractor = this.contractorManager.getById(contractorId);
        if (!contractor) {
            console.error('Contractor not found:', contractorId);
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
            id: generateId(), // Use imported generateId
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
            status: 'pending' // All new reviews start as pending
        };

        this.reviews.push(review);
        await this.save();
        
        // IMPORTANT: Do NOT update contractor stats for pending reviews
        // Contractor stats should only reflect approved reviews
        // this.updateContractorStats(contractorId); // REMOVED

        showNotification('Review submitted successfully! It will be visible after approval by our team.', 'success');

        return review;
    }

    async updateReviewStatus(reviewId, status) {
        const review = this.reviews.find(r => r.id === reviewId);
        if (!review) {
            console.error('Review not found:', reviewId);
            return false;
        }

        const oldStatus = review.status;
        review.status = status;
        await this.save();
        
        // Only update contractor stats if status changed to/from approved
        if (oldStatus === 'approved' || status === 'approved') {
            this.updateContractorStats(review.contractor_id);
        }

        showNotification(`Review ${status} successfully!`, 'success');
        return true;
    }

    async deleteReview(reviewId) {
        const index = this.reviews.findIndex(r => r.id === reviewId);
        if (index === -1) {
            console.error('Review not found for deletion:', reviewId);
            return false;
        }

        const review = this.reviews[index];
        const wasApproved = review.status === 'approved';
        this.reviews.splice(index, 1);
        await this.save();
        
        // Only update contractor stats if the deleted review was approved
        if (wasApproved) {
            this.updateContractorStats(review.contractor_id);
        }

        showNotification('Review deleted successfully!', 'success');
        return true;
    }

    searchReviews(searchTerm = '', statusFilter = 'all', contractorFilter = 'all') {
        // CRITICAL FIX: Use getReviewsWithContractorInfo to ensure fresh contractor data
        const allReviews = this.getReviewsWithContractorInfo();
        const filteredReviews = allReviews.filter(review => {
            const matchesSearch = !searchTerm ||
                review.reviewerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                review.contractorName.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'all' || review.status === statusFilter;
            const matchesContractor = contractorFilter === 'all' || review.contractor_id === contractorFilter;

            return matchesSearch && matchesStatus && matchesContractor;
        });

        return filteredReviews;
    }

    updateContractorStats(contractorId) {
        const contractor = this.contractorManager.getById(contractorId);
        if (!contractor) {
            console.error('Contractor not found for stats update:', contractorId);
            return;
        }

        // CRITICAL FIX: Only use approved reviews for contractor statistics
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
        // CRITICAL FIX: Only use approved reviews for category averages
        const approvedReviews = this.getApprovedReviewsByContractor(contractorId);

        if (approvedReviews.length === 0) return 0;

        const total = approvedReviews.reduce((sum, review) =>
            sum + review.categoryRatings[category], 0
        );

        return parseFloat((total / approvedReviews.length).toFixed(1));
    }

    getPendingReviewsCount = () => {
        return this.reviews.filter(review => review.status === 'pending').length;
    }

    // Refresh reviews data from storage
    async refresh() {
        try {
            // Force a fresh load from storage (bypass any caching)
            const saved = await this.storage.load('reviews', { forceRefresh: true });
            
            // CRITICAL FIX: Always update the reviews array, even if it's empty
            // This ensures deleted reviews are properly removed from cache
            this.reviews = saved || [];
            
            // Update contractor stats after refresh
            this.updateAllContractorStats();
            
        } catch (error) {
            console.error('Error refreshing reviews:', error);
            // If refresh fails, clear the cache to prevent stale data
            this.reviews = [];
        }
    }

    // Force a complete refresh including Supabase sync
    async forceRefresh() {
        try {
            // First, trigger a complete storage refresh
            if (this.storage && this.storage.forceRefreshAll) {
                await this.storage.forceRefreshAll();
            }
            
            // Then refresh our local cache
            await this.refresh();
            
        } catch (error) {
            console.error('Error during force refresh:', error);
        }
    }

    // NEW: Clear internal cache completely (for admin use)
    clearCache() {
        this.reviews = [];
    }
}