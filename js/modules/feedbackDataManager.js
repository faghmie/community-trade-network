/**
 * Feedback Data Manager - ES6 Module
 * Handles user feedback data operations (business logic only)
 */
import { generateId } from './uuid.js';
import { validateRequired, validateNumberRange, validateMaxLength, isValidEmail } from './validation.js';

export class FeedbackDataManager {
    constructor() {
        this.storage = null;
        this.initialized = false;
    }

    /**
     * Initialize the feedback data manager
     * @param {Storage} storage - Storage instance
     */
    init(storage) {
        this.storage = storage;
        this.initialized = true;
    }

    /**
     * Submit user feedback
     * @param {Object} feedbackData - Feedback data
     * @returns {Promise<boolean>} Success status
     */
    async submitFeedback(feedbackData) {
        if (!this.initialized) {
            throw new Error('FeedbackDataManager not initialized');
        }

        try {
            // Validate required fields
            const validationErrors = this.validateFeedback(feedbackData);
            if (validationErrors.length > 0) {
                throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
            }

            // Create feedback record with proper structure
            const feedbackRecord = {
                id: generateId(),
                rating: feedbackData.rating,
                positive_comments: feedbackData.positive_comments.trim(),
                improvement_comments: (feedbackData.improvement_comments || '').trim(),
                contact_email: feedbackData.contact_email ? feedbackData.contact_email.trim() : null,
                user_agent: feedbackData.user_agent || navigator.userAgent,
                app_version: feedbackData.app_version || '1.0.0',
                page_context: feedbackData.page_context || '',
                feature_context: feedbackData.feature_context || '',
                timestamp: new Date().toISOString(),
                status: 'new'
            };

            // Load existing feedback and append new one
            const existingFeedback = await this.getAllFeedback();
            const updatedFeedback = [...existingFeedback, feedbackRecord];

            // Save to storage (which will handle Supabase sync)
            const success = await this.storage.save('user_feedback', updatedFeedback, {
                syncToSupabase: true
            });

            if (success) {
                return true;
            } else {
                throw new Error('Failed to save feedback to storage');
            }

        } catch (error) {
            console.error('Error submitting feedback:', error);
            throw error;
        }
    }

    /**
     * Validate feedback data
     * @param {Object} feedbackData - Feedback data to validate
     * @returns {Array} Array of validation errors
     */
    validateFeedback(feedbackData) {
        const errors = [];

        // Validate rating (required, between 1-5)
        const ratingError = validateNumberRange(feedbackData.rating, 1, 5, 'Rating');
        if (ratingError) errors.push(ratingError);

        // Validate positive comments (required, max 1000 chars)
        const positiveCommentsError = validateRequired(feedbackData.positive_comments, 'Positive comments');
        if (positiveCommentsError) {
            errors.push(positiveCommentsError);
        } else {
            const maxLengthError = validateMaxLength(feedbackData.positive_comments, 1000, 'Positive comments');
            if (maxLengthError) errors.push(maxLengthError);
        }

        // Validate improvement comments (optional, max 1000 chars)
        if (feedbackData.improvement_comments) {
            const improvementLengthError = validateMaxLength(feedbackData.improvement_comments, 1000, 'Improvement comments');
            if (improvementLengthError) errors.push(improvementLengthError);
        }

        // Validate email format if provided (using existing validation function)
        if (feedbackData.contact_email && feedbackData.contact_email.trim()) {
            if (!isValidEmail(feedbackData.contact_email.trim())) {
                errors.push('Email must be a valid email address');
            }
        }

        return errors;
    }

    /**
     * Get all feedback (admin use)
     * @returns {Promise<Array>} Array of feedback records
     */
    async getAllFeedback() {
        if (!this.initialized) {
            throw new Error('FeedbackDataManager not initialized');
        }

        try {
            const feedback = await this.storage.load('user_feedback');
            return feedback || [];
        } catch (error) {
            console.error('Error loading feedback:', error);
            return [];
        }
    }

    /**
     * Get feedback by status
     * @param {string} status - Feedback status ('new', 'reviewed', 'actioned')
     * @returns {Promise<Array>} Filtered feedback records
     */
    async getFeedbackByStatus(status) {
        const allFeedback = await this.getAllFeedback();
        return allFeedback.filter(feedback => feedback.status === status);
    }

    /**
     * Update feedback status
     * @param {string} feedbackId - Feedback ID
     * @param {string} status - New status
     * @returns {Promise<boolean>} Success status
     */
    async updateFeedbackStatus(feedbackId, status) {
        if (!this.initialized) {
            throw new Error('FeedbackDataManager not initialized');
        }

        try {
            const allFeedback = await this.getAllFeedback();
            const feedbackIndex = allFeedback.findIndex(f => f.id === feedbackId);
            
            if (feedbackIndex === -1) {
                throw new Error(`Feedback not found: ${feedbackId}`);
            }

            // Validate status
            const validStatuses = ['new', 'reviewed', 'actioned'];
            if (!validStatuses.includes(status)) {
                throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
            }

            // Update status
            allFeedback[feedbackIndex].status = status;
            allFeedback[feedbackIndex].updated_at = new Date().toISOString();

            // Save back to storage
            const success = await this.storage.save('user_feedback', allFeedback, {
                syncToSupabase: true
            });

            if (success) {
                return true;
            } else {
                throw new Error('Failed to update feedback status');
            }

        } catch (error) {
            console.error('Error updating feedback status:', error);
            throw error;
        }
    }

    /**
     * Get feedback statistics
     * @returns {Promise<Object>} Feedback stats
     */
    async getFeedbackStats() {
        const allFeedback = await this.getAllFeedback();
        
        const stats = {
            total: allFeedback.length,
            byStatus: {
                new: allFeedback.filter(f => f.status === 'new').length,
                reviewed: allFeedback.filter(f => f.status === 'reviewed').length,
                actioned: allFeedback.filter(f => f.status === 'actioned').length
            },
            byRating: {
                1: allFeedback.filter(f => f.rating === 1).length,
                2: allFeedback.filter(f => f.rating === 2).length,
                3: allFeedback.filter(f => f.rating === 3).length,
                4: allFeedback.filter(f => f.rating === 4).length,
                5: allFeedback.filter(f => f.rating === 5).length
            },
            averageRating: allFeedback.length > 0 
                ? Number((allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length).toFixed(1))
                : 0
        };

        return stats;
    }

    /**
     * Delete feedback (admin use)
     * @param {string} feedbackId - Feedback ID to delete
     * @returns {Promise<boolean>} Success status
     */
    async deleteFeedback(feedbackId) {
        if (!this.initialized) {
            throw new Error('FeedbackDataManager not initialized');
        }

        try {
            const allFeedback = await this.getAllFeedback();
            const updatedFeedback = allFeedback.filter(f => f.id !== feedbackId);
            
            if (updatedFeedback.length === allFeedback.length) {
                throw new Error(`Feedback not found: ${feedbackId}`);
            }

            const success = await this.storage.save('user_feedback', updatedFeedback, {
                syncToSupabase: true
            });

            if (success) {
                return true;
            } else {
                throw new Error('Failed to delete feedback');
            }

        } catch (error) {
            console.error('Error deleting feedback:', error);
            throw error;
        }
    }

    /**
     * Check if manager is initialized
     * @returns {boolean} Initialization status
     */
    isInitialized() {
        return this.initialized;
    }
}