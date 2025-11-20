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

        console.log('📝 ReviewManager initializing...');

        // FIX: Use parameter if provided, otherwise use imported default
        const reviewsToUse = defaultReviews || JSON.parse(JSON.stringify(importedDefaultReviews));

        try {
            const saved = await this.storage.load('reviews');
            console.log('📝 Loaded reviews from storage:', saved ? saved.length : 'none');

            if (saved && saved.length > 0) {
                // Use saved reviews if they exist
                this.reviews = saved;
                console.log('📝 Using saved reviews:', this.reviews.length);
            } else if (saved !== null && saved !== undefined) {
                // CRITICAL FIX: If saved is explicitly null/undefined (no data), but we got a response,
                // don't load defaults. This means Supabase intentionally has 0 reviews.
                this.reviews = [];
                console.log('📝 Using empty reviews array (intentional no data from Supabase)');
            } else {
                // Only use defaults if we truly have no saved data (first-time setup)
                this.reviews = reviewsToUse;
                console.log('📝 Using default reviews (first load):', this.reviews.length);
            }

            // Update all contractor stats after loading reviews (only approved reviews)
            this.updateAllContractorStats();
            this.initialized = true;
            console.log('📝 ReviewManager initialized with', this.reviews.length, 'reviews');
        } catch (error) {
            console.error('❌ ReviewManager initialization failed:', error);
            // Fall back to default reviews but don't save them
            this.reviews = reviewsToUse;
            this.updateAllContractorStats();
            this.initialized = true;
            console.log('📝 ReviewManager fallback initialized with', this.reviews.length, 'reviews');
        }
    }

    async save() {
        console.log('💾 Saving reviews to storage:', this.reviews.length);
        await this.storage.save('reviews', this.reviews);
    }

    // CRITICAL FIX: Return raw reviews without enhancement - enhancement should happen at display time
    getAllReviews = () => {
        console.log('📋 Getting all reviews (raw):', this.reviews.length);
        return [...this.reviews]; // Return a copy to prevent mutation
    };

    // NEW: Get reviews with current contractor information (fresh data every time)
    getReviewsWithContractorInfo = () => {
        console.log('📋 Getting reviews with fresh contractor info');
        
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
        const reviews = this.reviews.filter(review => review.contractor_id === contractorId);
        console.log(`📋 Getting reviews for contractor ${contractorId}:`, reviews.length);
        return reviews;
    }

    getApprovedReviewsByContractor = (contractorId) => {
        const reviews = this.reviews.filter(review => 
            review.contractor_id === contractorId && review.status === 'approved'
        );
        console.log(`📋 Getting approved reviews for contractor ${contractorId}:`, reviews.length);
        return reviews;
    }

    getPendingReviewsByContractor = (contractorId) => {
        const reviews = this.reviews.filter(review => 
            review.contractor_id === contractorId && review.status === 'pending'
        );
        console.log(`📋 Getting pending reviews for contractor ${contractorId}:`, reviews.length);
        return reviews;
    }

    async addReview(contractorId, reviewData) {
        console.log('➕ Adding review for contractor:', contractorId, reviewData);

        const contractor = this.contractorManager.getById(contractorId);
        if (!contractor) {
            console.error('❌ Contractor not found:', contractorId);
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

        console.log('➕ Created review object:', review);

        this.reviews.push(review);
        console.log('➕ Reviews array after push:', this.reviews.length);

        await this.save();
        
        // IMPORTANT: Do NOT update contractor stats for pending reviews
        // Contractor stats should only reflect approved reviews
        // this.updateContractorStats(contractorId); // REMOVED

        showNotification('Review submitted successfully! It will be visible after approval by our team.', 'success');

        console.log('✅ Review added successfully (pending moderation)');
        return review;
    }

    async updateReviewStatus(reviewId, status) {
        console.log(`🔄 Updating review ${reviewId} status to:`, status);

        const review = this.reviews.find(r => r.id === reviewId);
        if (!review) {
            console.error('❌ Review not found:', reviewId);
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
        console.log('✅ Review status updated');
        return true;
    }

    async deleteReview(reviewId) {
        console.log('🗑️ Deleting review:', reviewId);

        const index = this.reviews.findIndex(r => r.id === reviewId);
        if (index === -1) {
            console.error('❌ Review not found for deletion:', reviewId);
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
        console.log('✅ Review deleted');
        return true;
    }

    searchReviews(searchTerm = '', statusFilter = 'all', contractorFilter = 'all') {
        console.log('🔍 Searching reviews:', { searchTerm, statusFilter, contractorFilter });

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

        console.log('🔍 Search results:', filteredReviews.length);
        return filteredReviews;
    }

    updateContractorStats(contractorId) {
        console.log(`📊 Updating stats for contractor:`, contractorId);

        const contractor = this.contractorManager.getById(contractorId);
        if (!contractor) {
            console.error('❌ Contractor not found for stats update:', contractorId);
            return;
        }

        // CRITICAL FIX: Only use approved reviews for contractor statistics
        const approvedReviews = this.getApprovedReviewsByContractor(contractorId);

        contractor.reviewCount = approvedReviews.length;
        contractor.overallRating = this.calculateOverallRating(approvedReviews);

        console.log(`📊 Contractor ${contractorId} stats (approved reviews only):`, {
            reviewCount: contractor.reviewCount,
            overallRating: contractor.overallRating,
            approvedReviewsCount: approvedReviews.length
        });

        this.contractorManager.save();
    }

    updateAllContractorStats() {
        console.log('📊 Updating stats for all contractors (approved reviews only)');
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
        const count = this.reviews.filter(review => review.status === 'pending').length;
        console.log('⏳ Pending reviews count:', count);
        return count;
    }

    // Refresh reviews data from storage
    async refresh() {
        console.log('🔄 Refreshing reviews from storage');
        
        try {
            // Force a fresh load from storage (bypass any caching)
            const saved = await this.storage.load('reviews', { forceRefresh: true });
            
            // CRITICAL FIX: Always update the reviews array, even if it's empty
            // This ensures deleted reviews are properly removed from cache
            this.reviews = saved || [];
            console.log('🔄 Reviews refreshed from storage:', this.reviews.length);
            
            // Update contractor stats after refresh
            this.updateAllContractorStats();
            
        } catch (error) {
            console.error('❌ Error refreshing reviews:', error);
            // If refresh fails, clear the cache to prevent stale data
            this.reviews = [];
            console.log('🔄 Reviews cache cleared due to error');
        }
    }

    // Force a complete refresh including Supabase sync
    async forceRefresh() {
        console.log('🔄🔄 FORCE refreshing reviews (including Supabase sync)');
        
        try {
            // First, trigger a complete storage refresh
            if (this.storage && this.storage.forceRefreshAll) {
                console.log('🔄 Triggering storage force refresh...');
                await this.storage.forceRefreshAll();
            }
            
            // Then refresh our local cache
            await this.refresh();
            
            console.log('✅ Force refresh completed');
            
        } catch (error) {
            console.error('❌ Error during force refresh:', error);
        }
    }

    // NEW: Clear internal cache completely (for admin use)
    clearCache() {
        console.log('🧹 Clearing ReviewManager cache');
        this.reviews = [];
    }

    // Debug method to log current state
    debug() {
        console.log('🐛 ReviewManager Debug:');
        console.log('Total reviews:', this.reviews.length);
        
        const approved = this.reviews.filter(r => r.status === 'approved').length;
        const pending = this.reviews.filter(r => r.status === 'pending').length;
        const rejected = this.reviews.filter(r => r.status === 'rejected').length;
        
        console.log('Approved reviews:', approved);
        console.log('Pending reviews:', pending);
        console.log('Rejected reviews:', rejected);
        console.log('All reviews:', this.reviews);
    }
}