// js/modules/reviewManager.js
const reviewManager = {
    init(contractorManager) {
        this.contractorManager = contractorManager;
    },

    getAllReviews() {
        const allReviews = [];
        this.contractorManager.contractors.forEach(contractor => {
            contractor.reviews.forEach(review => {
                // DEBUG: Log each review to see what data is available
                console.log('DEBUG getAllReviews - Individual review:', {
                    id: review.id,
                    rating: review.rating,
                    categoryRatings: review.categoryRatings,
                    reviewerName: review.reviewerName
                });
                
                allReviews.push({
                    ...review,
                    contractorId: contractor.id,
                    contractorName: contractor.name,
                    contractorCategory: contractor.category
                });
            });
        });
        
        console.log('DEBUG getAllReviews - All reviews for admin:', allReviews);
        return allReviews;
    },

    addReview(contractorId, reviewData) {
        console.log('DEBUG addReview - Review data received from form:', reviewData);
        
        const contractor = this.contractorManager.getById(contractorId);
        if (!contractor) {
            console.error('Contractor not found with ID:', contractorId);
            return null;
        }

        // Ensure we have a valid overall rating - use category average if overall is 0
        let overallRating = reviewData.rating;
        if (!overallRating || overallRating === 0) {
            const categoryRatings = [
                reviewData.qualityRating,
                reviewData.communicationRating,
                reviewData.timelinessRating,
                reviewData.valueRating
            ].filter(rating => rating > 0);
            
            if (categoryRatings.length > 0) {
                overallRating = Math.round(categoryRatings.reduce((sum, rating) => sum + rating, 0) / categoryRatings.length);
                console.log('DEBUG addReview - Calculated overall rating from categories:', overallRating);
            }
        }

        const review = {
            id: this.generateId(),
            reviewerName: reviewData.reviewerName,
            rating: overallRating, // Use the calculated or provided rating
            // Category ratings
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

        console.log('DEBUG addReview - Final review object to save:', review);

        contractor.reviews.push(review);
        
        // Update contractor overall rating
        contractor.rating = this.calculateOverallRating(contractor.reviews);
        
        const success = this.contractorManager.save();
        
        if (success) {
            // Show notification using utils
            if (typeof utils !== 'undefined' && utils.showNotification) {
                utils.showNotification('Review submitted successfully! It will be visible after approval.', 'success');
            } else {
                // Fallback if utils is not available
                alert('Review submitted successfully! It will be visible after approval.');
            }
            console.log('Review added successfully to contractor:', contractor.name);
        } else {
            console.error('Failed to save review');
            if (typeof utils !== 'undefined' && utils.showNotification) {
                utils.showNotification('Failed to submit review. Please try again.', 'error');
            }
        }
        
        return review;
    },

    updateReviewStatus(contractorId, reviewId, status) {
        const contractor = this.contractorManager.getById(contractorId);
        if (!contractor) return false;

        const review = contractor.reviews.find(r => r.id === reviewId);
        if (!review) return false;

        const oldStatus = review.status;
        review.status = status;

        // Update contractor rating if needed
        if (status === 'approved' || oldStatus === 'approved') {
            contractor.rating = this.calculateOverallRating(
                contractor.reviews.filter(r => r.status === 'approved')
            );
        }

        const success = this.contractorManager.save();
        if (success && typeof utils !== 'undefined' && utils.showNotification) {
            utils.showNotification(`Review ${status} successfully!`, 'success');
        }
        return success;
    },

    deleteReview(contractorId, reviewId) {
        const contractor = this.contractorManager.getById(contractorId);
        if (!contractor) return false;

        const reviewIndex = contractor.reviews.findIndex(r => r.id === reviewId);
        if (reviewIndex === -1) return false;

        const wasApproved = contractor.reviews[reviewIndex].status === 'approved';
        contractor.reviews.splice(reviewIndex, 1);

        if (wasApproved) {
            contractor.rating = this.calculateOverallRating(
                contractor.reviews.filter(r => r.status === 'approved')
            );
        }

        const success = this.contractorManager.save();
        if (success && typeof utils !== 'undefined' && utils.showNotification) {
            utils.showNotification('Review deleted successfully!', 'success');
        }
        return success;
    },

    // NEW: Search reviews method
    searchReviews(searchTerm = '', statusFilter = 'all', contractorFilter = 'all') {
        const allReviews = this.getAllReviews();
        return allReviews.filter(review => {
            const matchesSearch = !searchTerm ||
                review.reviewerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                review.contractorName.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = statusFilter === 'all' || review.status === statusFilter;
            
            const matchesContractor = contractorFilter === 'all' || review.contractorId === contractorFilter;
            
            return matchesSearch && matchesStatus && matchesContractor;
        });
    },

    // Calculate overall rating from category ratings
    calculateOverallRating(reviews) {
        if (!reviews || reviews.length === 0) return 0;
        
        const approvedReviews = reviews.filter(review => review.status === 'approved');
        if (approvedReviews.length === 0) return 0;

        let totalRating = 0;
        approvedReviews.forEach(review => {
            if (review.categoryRatings) {
                // Average of all category ratings
                const categoryAverage = (
                    review.categoryRatings.quality +
                    review.categoryRatings.communication +
                    review.categoryRatings.timeliness +
                    review.categoryRatings.value
                ) / 4;
                totalRating += categoryAverage;
            } else {
                // Fallback to single rating for backward compatibility
                totalRating += review.rating;
            }
        });

        return parseFloat((totalRating / approvedReviews.length).toFixed(1));
    },

    // Keep old method for backward compatibility
    calculateAverageRating(reviews) {
        return this.calculateOverallRating(reviews);
    },

    // Get average for specific category
    getCategoryAverage(reviews, category) {
        const approvedReviews = reviews.filter(review => 
            review.status === 'approved' && review.categoryRatings
        );
        
        if (approvedReviews.length === 0) return 0;

        const total = approvedReviews.reduce((sum, review) => 
            sum + review.categoryRatings[category], 0
        );
        
        return parseFloat((total / approvedReviews.length).toFixed(1));
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};