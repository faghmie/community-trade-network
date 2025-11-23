// js/modules/recommendationDataManager.js
// ES6 Module for community recommendation management

import { generateId } from './uuid.js';
import { showNotification } from './notifications.js';

export class RecommendationDataManager {
    constructor() {
        this.recommendations = [];
        this.contractorManager = null;
        this.storage = null;
        this.initialized = false;
    }

    async init(contractorManager, storage) {
        this.contractorManager = contractorManager;
        this.storage = storage;

        try {
            const saved = await this.storage.load('recommendations');

            if (saved && saved.length > 0) {
                // Use saved recommendations if they exist
                this.recommendations = saved;
            } else if (saved !== null && saved !== undefined) {
                // If saved is explicitly null/undefined (no data), but we got a response,
                // don't load defaults. This means Supabase intentionally has 0 recommendations.
                this.recommendations = [];
            } else {
                // Only use empty array if we truly have no saved data
                this.recommendations = [];
            }

            // Update all contractor trust metrics after loading recommendations
            this.updateAllContractorTrustMetrics();
            this.initialized = true;
        } catch (error) {
            console.error('RecommendationDataManager initialization failed:', error);
            // Fall back to empty array but don't save
            this.recommendations = [];
            this.updateAllContractorTrustMetrics();
            this.initialized = true;
        }
    }

    async save() {
        await this.storage.save('recommendations', this.recommendations);
    }

    // Get all recommendations (raw data)
    getAllRecommendations = () => {
        return [...this.recommendations]; // Return a copy to prevent mutation
    };

    // Get recommendations with current contractor information (fresh data every time)
    getRecommendationsWithContractorInfo = () => {
        return this.recommendations.map(recommendation => {
            // ALWAYS get fresh contractor data to ensure no stale information
            const contractor = this.contractorManager.getById(recommendation.contractor_id);
            return {
                ...recommendation,
                contractorName: contractor ? contractor.name : 'Unknown Service Provider',
                contractorCategory: contractor ? contractor.category : 'Unknown Category',
                contractorPhone: contractor ? contractor.phone : 'N/A'
            };
        });
    };

    // Get recommendations by contractor
    getRecommendationsByContractor = (contractorId) => {
        return this.recommendations.filter(recommendation => 
            recommendation.contractor_id === contractorId
        );
    }

    // Get verified recommendations by contractor (with contact details)
    getVerifiedRecommendationsByContractor = (contractorId) => {
        return this.recommendations.filter(recommendation => 
            recommendation.contractor_id === contractorId && 
            recommendation.referrerPhone && 
            recommendation.referrerPhone.trim() !== ''
        );
    }

    // Get recommendations by moderation status
    getRecommendationsByStatus = (status) => {
        return this.recommendations.filter(recommendation => 
            recommendation.moderationStatus === status
        );
    }

    // Add a new community recommendation
    async addRecommendation(contractorId, recommendationData) {
        const contractor = this.contractorManager.getById(contractorId);
        if (!contractor) {
            console.error('Service Provider not found:', contractorId);
            throw new Error(`Service Provider with ID ${contractorId} not found`);
        }

        const recommendation = {
            id: generateId(),
            contractor_id: contractorId,
            submissionDate: new Date().toISOString(),
            serviceUsed: recommendationData.serviceUsed,
            serviceDate: recommendationData.serviceDate,
            endorsementNote: recommendationData.endorsementNote,
            referrerName: recommendationData.referrerName,
            referrerPhone: recommendationData.referrerPhone || '',
            referrerNeighborhood: recommendationData.referrerNeighborhood,
            referrerType: recommendationData.referrerType,
            metrics: {
                quality: recommendationData.metrics.quality,
                timeliness: recommendationData.metrics.timeliness,
                communication: recommendationData.metrics.communication,
                value: recommendationData.metrics.value
            },
            wouldRecommendToNeighbors: recommendationData.wouldRecommendToNeighbors,
            isAnonymous: recommendationData.isAnonymous || false,
            photos: recommendationData.photos || [],
            isVerified: !!recommendationData.referrerPhone, // Verified if phone provided
            moderationStatus: 'approved' // All new recommendations start as pending
        };

        this.recommendations.push(recommendation);
        await this.save();
        
        // Update contractor trust metrics (includes pending recommendations for internal metrics)
        this.updateContractorTrustMetrics(contractorId);

        showNotification(
            'Thank you for your community recommendation! It will help neighbors make informed choices.',
            'success'
        );

        return recommendation;
    }

    // Update recommendation moderation status
    async updateRecommendationStatus(recommendationId, status) {
        const recommendation = this.recommendations.find(r => r.id === recommendationId);
        if (!recommendation) {
            console.error('Recommendation not found:', recommendationId);
            return false;
        }

        const oldStatus = recommendation.moderationStatus;
        recommendation.moderationStatus = status;
        await this.save();
        
        // Update contractor trust metrics if status changed
        if (oldStatus !== status) {
            this.updateContractorTrustMetrics(recommendation.contractor_id);
        }

        showNotification(`Recommendation ${status} successfully!`, 'success');
        return true;
    }

    // Delete a recommendation
    async deleteRecommendation(recommendationId) {
        const index = this.recommendations.findIndex(r => r.id === recommendationId);
        if (index === -1) {
            console.error('Recommendation not found for deletion:', recommendationId);
            return false;
        }

        const recommendation = this.recommendations[index];
        this.recommendations.splice(index, 1);
        await this.save();
        
        // Update contractor trust metrics after deletion
        this.updateContractorTrustMetrics(recommendation.contractor_id);

        showNotification('Recommendation deleted successfully!', 'success');
        return true;
    }

    // Search recommendations with filters
    searchRecommendations(searchTerm = '', statusFilter = 'all', contractorFilter = 'all') {
        const allRecommendations = this.getRecommendationsWithContractorInfo();
        const filteredRecommendations = allRecommendations.filter(recommendation => {
            const matchesSearch = !searchTerm ||
                recommendation.referrerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                recommendation.endorsementNote.toLowerCase().includes(searchTerm.toLowerCase()) ||
                recommendation.serviceUsed.toLowerCase().includes(searchTerm.toLowerCase()) ||
                recommendation.referrerNeighborhood.toLowerCase().includes(searchTerm.toLowerCase()) ||
                recommendation.contractorName.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'all' || recommendation.moderationStatus === statusFilter;
            const matchesContractor = contractorFilter === 'all' || recommendation.contractor_id === contractorFilter;

            return matchesSearch && matchesStatus && matchesContractor;
        });

        return filteredRecommendations;
    }

    // Calculate trust metrics for a contractor
    calculateContractorTrustMetrics(contractorId) {
        const contractorRecommendations = this.getRecommendationsByContractor(contractorId);
        const approvedRecommendations = contractorRecommendations.filter(r => 
            r.moderationStatus === 'approved'
        );
        const verifiedRecommendations = this.getVerifiedRecommendationsByContractor(contractorId);

        if (approvedRecommendations.length === 0) {
            return {
                trustScore: 0,
                recommendationRate: 0,
                quality: 0,
                timeliness: 0,
                communication: 0,
                value: 0,
                totalRecommendations: 0,
                verifiedNeighborCount: 0,
                serviceTypeDistribution: {},
                neighborhoodDistribution: {}
            };
        }

        // Calculate average metrics
        const totalMetrics = approvedRecommendations.reduce((acc, rec) => {
            acc.quality += rec.metrics.quality;
            acc.timeliness += rec.metrics.timeliness;
            acc.communication += rec.metrics.communication;
            acc.value += rec.metrics.value;
            return acc;
        }, { quality: 0, timeliness: 0, communication: 0, value: 0 });

        const avgQuality = totalMetrics.quality / approvedRecommendations.length;
        const avgTimeliness = totalMetrics.timeliness / approvedRecommendations.length;
        const avgCommunication = totalMetrics.communication / approvedRecommendations.length;
        const avgValue = totalMetrics.value / approvedRecommendations.length;

        // Calculate recommendation rate
        const wouldRecommendCount = approvedRecommendations.filter(r => 
            r.wouldRecommendToNeighbors
        ).length;
        const recommendationRate = (wouldRecommendCount / approvedRecommendations.length) * 100;

        // Calculate overall trust score (weighted average)
        const trustScore = Math.round(
            (avgQuality * 0.3) + 
            (avgTimeliness * 0.25) + 
            (avgCommunication * 0.2) + 
            (avgValue * 0.15) + 
            (recommendationRate * 0.1)
        );

        // Calculate service type distribution
        const serviceTypeDistribution = {};
        approvedRecommendations.forEach(rec => {
            serviceTypeDistribution[rec.serviceUsed] = 
                (serviceTypeDistribution[rec.serviceUsed] || 0) + 1;
        });

        // Calculate neighborhood distribution
        const neighborhoodDistribution = {};
        approvedRecommendations.forEach(rec => {
            neighborhoodDistribution[rec.referrerNeighborhood] = 
                (neighborhoodDistribution[rec.referrerNeighborhood] || 0) + 1;
        });

        return {
            trustScore: Math.min(trustScore, 100), // Cap at 100
            recommendationRate: Math.round(recommendationRate),
            quality: parseFloat(avgQuality.toFixed(1)),
            timeliness: parseFloat(avgTimeliness.toFixed(1)),
            communication: parseFloat(avgCommunication.toFixed(1)),
            value: parseFloat(avgValue.toFixed(1)),
            totalRecommendations: approvedRecommendations.length,
            verifiedNeighborCount: verifiedRecommendations.length,
            serviceTypeDistribution,
            neighborhoodDistribution
        };
    }

    // Update contractor trust metrics
    updateContractorTrustMetrics(contractorId) {
        const contractor = this.contractorManager.getById(contractorId);
        if (!contractor) {
            console.error('Service Provider not found for trust metrics update:', contractorId);
            return;
        }

        const trustMetrics = this.calculateContractorTrustMetrics(contractorId);
        contractor.trustMetrics = trustMetrics;

        this.contractorManager.save();
    }

    // Update all contractor trust metrics
    updateAllContractorTrustMetrics() {
        const contractors = this.contractorManager.getAll();
        contractors.forEach(contractor => {
            this.updateContractorTrustMetrics(contractor.id);
        });
    }

    // Get pending recommendations count
    getPendingRecommendationsCount = () => {
        return this.recommendations.filter(recommendation => 
            recommendation.moderationStatus === 'pending'
        ).length;
    }

    // Get recommendations for display (approved only)
    getApprovedRecommendationsForContractor = (contractorId) => {
        return this.recommendations.filter(recommendation => 
            recommendation.contractor_id === contractorId && 
            recommendation.moderationStatus === 'approved'
        );
    }

    // Get recommendation summary for display cards
    getRecommendationSummariesForContractor = (contractorId) => {
        const approvedRecommendations = this.getApprovedRecommendationsForContractor(contractorId);
        
        return approvedRecommendations.map(recommendation => ({
            id: recommendation.id,
            referrerName: recommendation.isAnonymous ? 'Anonymous Neighbor' : recommendation.referrerName,
            endorsementNote: this.truncateEndorsementNote(recommendation.endorsementNote),
            submissionDate: this.formatSubmissionDate(recommendation.submissionDate),
            serviceUsed: recommendation.serviceUsed,
            wouldRecommendToNeighbors: recommendation.wouldRecommendToNeighbors,
            referrerNeighborhood: recommendation.referrerNeighborhood,
            metrics: recommendation.metrics,
            isVerified: recommendation.isVerified
        }));
    }

    // Helper: Truncate endorsement note for display
    truncateEndorsementNote(note, maxLength = 120) {
        if (note.length <= maxLength) return note;
        return note.substring(0, maxLength) + '...';
    }

    // Helper: Format submission date as relative time
    formatSubmissionDate(isoDate) {
        const date = new Date(isoDate);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
        return `${Math.ceil(diffDays / 30)} months ago`;
    }

    // Refresh recommendations data from storage
    async refresh() {
        try {
            // Force a fresh load from storage (bypass any caching)
            const saved = await this.storage.load('recommendations', { forceRefresh: true });
            
            // Always update the recommendations array, even if it's empty
            this.recommendations = saved || [];
            
            // Update contractor trust metrics after refresh
            this.updateAllContractorTrustMetrics();
            
        } catch (error) {
            console.error('Error refreshing recommendations:', error);
            // If refresh fails, clear the cache to prevent stale data
            this.recommendations = [];
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

    // Clear internal cache completely (for admin use)
    clearCache() {
        this.recommendations = [];
    }
}