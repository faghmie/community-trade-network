// Data module - handles all data operations and business logic
const dataModule = {
    contractors: [],

    init() {
        this.loadContractors();
    },

    loadContractors() {
        console.log('Loading contractors...');
        const saved = storage.load('contractors');
        
        if (saved && saved.length > 0) {
            this.contractors = saved;
            // Migrate existing reviews to have status field
            this.migrateReviewStatus();
            // Migrate existing contractors to have website and location fields
            this.migrateContractorFields();
            console.log('Loaded contractors from storage:', this.contractors.length);
        } else {
            this.contractors = JSON.parse(JSON.stringify(defaultContractors));
            this.saveContractors();
            console.log('Loaded default contractors:', this.contractors.length);
        }
    },

    // Migrate existing reviews to have status field
    migrateReviewStatus() {
        let migrated = false;
        this.contractors.forEach(contractor => {
            contractor.reviews.forEach(review => {
                if (!review.status) {
                    review.status = 'approved'; // Default existing reviews to approved
                    migrated = true;
                }
            });
        });
        if (migrated) {
            this.saveContractors();
            console.log('Migrated review status for existing reviews');
        }
    },

    // Migrate existing contractors to have website and location fields
    migrateContractorFields() {
        let migrated = false;
        this.contractors.forEach(contractor => {
            if (!contractor.hasOwnProperty('website')) {
                contractor.website = '';
                migrated = true;
            }
            if (!contractor.hasOwnProperty('location')) {
                contractor.location = '';
                migrated = true;
            }
        });
        if (migrated) {
            this.saveContractors();
            console.log('Migrated contractor fields for existing contractors');
        }
    },

    saveContractors() {
        const success = storage.save('contractors', this.contractors);
        if (success) {
            console.log('Contractors saved successfully');
        } else {
            console.error('Failed to save contractors');
        }
        return success;
    },

    // Contractor operations
    getContractors() {
        return this.contractors;
    },

    getContractor(id) {
        return this.contractors.find(contractor => contractor.id === id);
    },

    addContractor(contractorData) {
        const newContractor = {
            id: this.generateId(),
            ...contractorData,
            rating: 0,
            reviews: [],
            createdAt: new Date().toISOString()
        };
        
        this.contractors.push(newContractor);
        const success = this.saveContractors();
        if (success) {
            utils.showNotification('Contractor added successfully!');
        }
        return newContractor;
    },

    updateContractor(id, updates) {
        const index = this.contractors.findIndex(contractor => contractor.id === id);
        if (index !== -1) {
            this.contractors[index] = { ...this.contractors[index], ...updates };
            const success = this.saveContractors();
            if (success) {
                utils.showNotification('Contractor updated successfully!');
            }
            return this.contractors[index];
        }
        return null;
    },

    deleteContractor(id) {
        const index = this.contractors.findIndex(contractor => contractor.id === id);
        if (index !== -1) {
            this.contractors.splice(index, 1);
            const success = this.saveContractors();
            if (success) {
                utils.showNotification('Contractor deleted successfully!');
            }
            return true;
        }
        return false;
    },

    // Review operations
    addReview(contractorId, reviewData) {
        console.log('Adding review for contractor:', contractorId, 'with data:', reviewData);
        
        const contractor = this.getContractor(contractorId);
        if (contractor) {
            const newReview = {
                id: this.generateId(),
                reviewerName: reviewData.reviewerName,
                rating: reviewData.rating,
                comment: reviewData.comment,
                date: new Date().toISOString(),
                status: 'pending' // New reviews start as pending
            };
            
            console.log('Created review object:', newReview);
            
            contractor.reviews.push(newReview);
            // Don't update rating until review is approved
            const success = this.saveContractors();
            if (success) {
                utils.showNotification('Review submitted successfully! It will be visible after approval.');
                console.log('Review added successfully to contractor:', contractor.name);
            } else {
                console.error('Failed to save review');
            }
            return newReview;
        }
        console.error('Contractor not found with ID:', contractorId);
        return null;
    },

    // Update review status
    updateReviewStatus(contractorId, reviewId, status) {
        const contractor = this.getContractor(contractorId);
        if (contractor) {
            const review = contractor.reviews.find(r => r.id === reviewId);
            if (review) {
                const oldStatus = review.status;
                review.status = status;
                
                // Update contractor rating if review is approved or was approved before
                if (status === 'approved' || oldStatus === 'approved') {
                    contractor.rating = this.calculateAverageRating(
                        contractor.reviews.filter(r => r.status === 'approved')
                    );
                }
                
                const success = this.saveContractors();
                if (success) {
                    utils.showNotification(`Review ${status} successfully!`);
                }
                return true;
            }
        }
        return false;
    },

    // Delete review
    deleteReview(contractorId, reviewId) {
        const contractor = this.getContractor(contractorId);
        if (contractor) {
            const reviewIndex = contractor.reviews.findIndex(r => r.id === reviewId);
            if (reviewIndex !== -1) {
                const wasApproved = contractor.reviews[reviewIndex].status === 'approved';
                contractor.reviews.splice(reviewIndex, 1);
                
                // Update rating if the deleted review was approved
                if (wasApproved) {
                    contractor.rating = this.calculateAverageRating(
                        contractor.reviews.filter(r => r.status === 'approved')
                    );
                }
                
                const success = this.saveContractors();
                if (success) {
                    utils.showNotification('Review deleted successfully!');
                }
                return true;
            }
        }
        return false;
    },

    // Get all reviews across all contractors
    getAllReviews() {
        const allReviews = [];
        this.contractors.forEach(contractor => {
            contractor.reviews.forEach(review => {
                allReviews.push({
                    ...review,
                    contractorId: contractor.id,
                    contractorName: contractor.name,
                    contractorCategory: contractor.category
                });
            });
        });
        return allReviews;
    },

    // Get review statistics
    getReviewStats() {
        const allReviews = this.getAllReviews();
        const totalReviews = allReviews.length;
        const approvedReviews = allReviews.filter(r => r.status === 'approved').length;
        const pendingReviews = allReviews.filter(r => r.status === 'pending').length;
        const rejectedReviews = allReviews.filter(r => r.status === 'rejected').length;

        return {
            totalReviews,
            approvedReviews,
            pendingReviews,
            rejectedReviews
        };
    },

    // Update contractor category across all contractors
    updateContractorCategory(oldCategory, newCategory) {
        let updated = false;
        this.contractors.forEach(contractor => {
            if (contractor.category === oldCategory) {
                contractor.category = newCategory;
                updated = true;
            }
        });
        if (updated) {
            this.saveContractors();
            console.log(`Updated category from "${oldCategory}" to "${newCategory}" for ${updated} contractors`);
        }
        return updated;
    },

    // Utility functions
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    calculateAverageRating(reviews) {
        if (!reviews || reviews.length === 0) return 0;
        const sum = reviews.reduce((total, review) => total + review.rating, 0);
        return (sum / reviews.length).toFixed(1);
    },

    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    // Search and filter
    searchContractors(searchTerm, categoryFilter = '', ratingFilter = '') {
        return this.contractors.filter(contractor => {
            const matchesSearch = !searchTerm || 
                contractor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                contractor.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                contractor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                contractor.location.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesCategory = !categoryFilter || 
                contractor.category === categoryFilter;
            
            const matchesRating = !ratingFilter || 
                parseFloat(contractor.rating) >= parseFloat(ratingFilter);
            
            return matchesSearch && matchesCategory && matchesRating;
        });
    },

    // Search reviews
    searchReviews(searchTerm = '', statusFilter = 'all') {
        const allReviews = this.getAllReviews();
        return allReviews.filter(review => {
            const matchesSearch = !searchTerm ||
                review.reviewerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                review.contractorName.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = statusFilter === 'all' || review.status === statusFilter;
            
            return matchesSearch && matchesStatus;
        });
    },

    // Statistics
    getStats() {
        const totalReviews = this.contractors.reduce((total, contractor) => 
            total + contractor.reviews.length, 0
        );
        const averageRating = this.contractors.length > 0 ? 
            this.contractors.reduce((total, contractor) => total + parseFloat(contractor.rating), 0) / this.contractors.length : 0;

        const reviewStats = this.getReviewStats();

        return {
            totalContractors: this.contractors.length,
            totalReviews: totalReviews,
            averageRating: averageRating.toFixed(1),
            pendingReviews: reviewStats.pendingReviews
        };
    }
};