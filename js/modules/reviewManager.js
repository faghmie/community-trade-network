// js/modules/reviewManager.js
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
                // FIX: Use saved reviews if they exist (don't overwrite with defaults)
                this.reviews = saved;
                console.log('📝 Using saved reviews:', this.reviews.length);
            } else {
                // FIX: Only use defaults if NO saved reviews exist (first-time setup)
                this.reviews = reviewsToUse;
                console.log('📝 Using default reviews (first load):', this.reviews.length);
                // DON'T save here - let the main app handle first-time setup
            }

            // Update all contractor stats after loading reviews
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

    getAllReviews = () => {
        console.log('📋 Getting all reviews:', this.reviews.length);
        // Ensure we have contractor names and categories for admin display
        const enhancedReviews = this.reviews.map(review => {
            const contractor = this.contractorManager.getById(review.contractor_id);
            return {
                ...review,
                contractorId: review.contractor_id, // Add contractorId for admin module compatibility
                contractorName: contractor ? contractor.name : 'Unknown Contractor',
                contractorCategory: contractor ? contractor.category : 'Unknown Category'
            };
        });
        console.log('📋 Enhanced reviews for display:', enhancedReviews.length);
        return enhancedReviews;
    };

    getReviewsByContractor = (contractorId) => {
        const reviews = this.reviews.filter(review => review.contractor_id === contractorId);
        console.log(`📋 Getting reviews for contractor ${contractorId}:`, reviews.length);
        return reviews;
    }

    getApprovedReviewsByContractor = (contractorId) => {
        const reviews = this.reviews.filter(review => review.contractor_id === contractorId && review.status === 'approved');
        console.log(`📋 Getting approved reviews for contractor ${contractorId}:`, reviews.length);
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
            status: 'pending'
        };

        console.log('➕ Created review object:', review);

        this.reviews.push(review);
        console.log('➕ Reviews array after push:', this.reviews.length);

        await this.save();
        this.updateContractorStats(contractorId);

        showNotification('Review submitted successfully! It will be visible after approval.', 'success');

        console.log('✅ Review added successfully');
        return review;
    }

    async updateReviewStatus(reviewId, status) {
        console.log(`🔄 Updating review ${reviewId} status to:`, status);

        const review = this.reviews.find(r => r.id === reviewId);
        if (!review) {
            console.error('❌ Review not found:', reviewId);
            return false;
        }

        review.status = status;
        await this.save();
        this.updateContractorStats(review.contractor_id);

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
        this.reviews.splice(index, 1);
        await this.save();
        this.updateContractorStats(review.contractor_id);

        showNotification('Review deleted successfully!', 'success');
        console.log('✅ Review deleted');
        return true;
    }

    searchReviews(searchTerm = '', statusFilter = 'all', contractorFilter = 'all') {
        console.log('🔍 Searching reviews:', { searchTerm, statusFilter, contractorFilter });

        const allReviews = this.getAllReviews();
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

        const approvedReviews = this.getApprovedReviewsByContractor(contractorId);

        contractor.reviewCount = approvedReviews.length;
        contractor.overallRating = this.calculateOverallRating(approvedReviews);

        console.log(`📊 Contractor ${contractorId} stats:`, {
            reviewCount: contractor.reviewCount,
            overallRating: contractor.overallRating
        });

        this.contractorManager.save();
    }

    updateAllContractorStats() {
        console.log('📊 Updating stats for all contractors');
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

    getPendingReviewsCount = () => {
        const count = this.reviews.filter(review => review.status === 'pending').length;
        console.log('⏳ Pending reviews count:', count);
        return count;
    }

    // Refresh reviews data from storage
    async refresh() {
        console.log('🔄 Refreshing reviews from storage');
        const saved = await this.storage.load('reviews');
        if (saved && saved.length > 0) {
            this.reviews = saved;
            console.log('🔄 Reviews refreshed:', this.reviews.length);
        }
    }

    // Debug method to log current state
    debug() {
        console.log('🐛 ReviewManager Debug:');
        console.log('Total reviews:', this.reviews.length);
        console.log('Reviews:', this.reviews);
        console.log('Pending reviews:', this.getPendingReviewsCount());

        const allReviews = this.getAllReviews();
        console.log('Enhanced reviews for display:', allReviews);
    }
}