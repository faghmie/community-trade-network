/**
 * Admin Dashboard Module
 * Handles stats calculation, tab management, and UI rendering
 */

import TabsModule from '../modules/tabs.js';

class AdminDashboard {
    constructor(dataModule) {
        this.dataModule = dataModule;
        this.tabsModule = null;
        this.adminModules = {};
    }

    async init(adminModules) {
        this.adminModules = adminModules;
        
        // Initialize tabs
        this.tabsModule = new TabsModule();
        this.tabsModule.init();
        
        this.setupTabCallbacks();
        this.setupEventListeners();
    }

    show() {
        // Show admin content and hide login
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        
        this.render();
    }

    setupTabCallbacks() {
        // Each module handles its own rendering when its tab becomes active
        this.tabsModule.onTabChange('contractors-tab', () => {
            this.adminModules.contractors.refresh();
        });

        this.tabsModule.onTabChange('categories-tab', () => {
            this.adminModules.categories.refresh();
        });

        this.tabsModule.onTabChange('recommendations-tab', () => {
            this.adminModules.recommendations.refresh();
        });

        this.tabsModule.onTabChange('feedback-tab', () => {
            if (this.adminModules.feedback) {
                this.adminModules.feedback.refresh();
            }
        });
    }

    setupEventListeners() {
        // Listen for data updates to refresh stats
        document.addEventListener('adminDataUpdated', () => {
            this.refreshStats();
        });

        // Listen for feedback updates
        document.addEventListener('feedbackSubmitted', () => {
            this.refreshStats();
        });

        document.addEventListener('feedbackUpdated', () => {
            this.refreshStats();
        });

        document.addEventListener('feedbackDeleted', () => {
            this.refreshStats();
        });

        document.addEventListener('feedbackBulkUpdated', () => {
            this.refreshStats();
        });

        // Listen for recommendations updates
        document.addEventListener('recommendationsUpdated', () => {
            this.refreshStats();
        });
    }

    render() {
        this.refreshStats();
        // Don't render current tab - let the module handle it when tab changes
    }

    refreshStats() {
        this.renderStats();
    }

    renderStats() {
        const contractors = this.dataModule.getContractors();

        // Use getRecommendationDataManager() instead of getRecommendationManager()
        const recommendationManager = this.dataModule.getRecommendationDataManager();
        const allRecommendations = recommendationManager ? recommendationManager.getAllRecommendations() : [];
        
        // Calculate total recommendations across all contractors
        const totalRecommendations = allRecommendations.length;

        // Calculate average trust score from contractors
        const averageTrustScore = contractors && contractors.length > 0 ?
            contractors.reduce((total, contractor) => {
                const trustScore = contractor.trustMetrics ? contractor.trustMetrics.trustScore : 0;
                return total + trustScore;
            }, 0) / contractors.length : 0;

        const categories = this.dataModule.getCategories();
        const totalCategories = categories ? categories.length : 0;

        // Use recommendation stats instead of review stats
        const pendingRecommendations = allRecommendations.filter(rec => 
            rec.moderationStatus === 'pending'
        ).length;

        // Get feedback stats if available - with proper error handling
        let unreadFeedback = 0;
        try {
            // Use the dataModule method directly instead of relying on adminFeedbackManager
            const feedbackStats = this.dataModule.getFeedbackStats();
            if (feedbackStats && feedbackStats.byStatus) {
                unreadFeedback = feedbackStats.byStatus.new || 0;
            }
        } catch (error) {
            console.warn('Could not load feedback stats:', error);
            unreadFeedback = 0;
        }

        // Update stats elements
        this.updateElementText('totalContractors', contractors ? contractors.length : 0);
        this.updateElementText('totalRecommendations', totalRecommendations);
        this.updateElementText('averageRating', averageTrustScore.toFixed(0) + '%');
        this.updateElementText('totalCategories', totalCategories);
        this.updateElementText('pendingRecommendations', pendingRecommendations);
        this.updateElementText('unreadFeedback', unreadFeedback);
    }

    updateElementText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }
}

export default AdminDashboard;